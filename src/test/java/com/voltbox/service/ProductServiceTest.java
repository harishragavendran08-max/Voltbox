package com.voltbox.service;

import com.voltbox.Store;
import com.voltbox.entity.ProductEntity;
import com.voltbox.model.Product;
import com.voltbox.model.User;
import com.voltbox.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link ProductService} using JUnit 5 and Mockito.
 * Verifies price calculations, 6-month price telemetry, inventory threshold checks,
 * stock mutations, and Product-to-ProductEntity JPA data mapping prior to deployment.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ProductService Unit Tests (Price Calculations, Inventory Checks & Data Mapping)")
class ProductServiceTest {

    @Mock
    private Store store;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    @Captor
    private ArgumentCaptor<ProductEntity> entityCaptor;

    private Product sampleGpu;
    private Product sampleCpu;
    private Product sampleStorage;
    private User contributorUser;

    @BeforeEach
    void setUp() {
        sampleGpu = new Product(
                19,
                null,
                "Nvidia RTX 5090",
                200.00,
                2,
                "components"
        );
        sampleGpu.description = "Flagship Blackwell 32GB GDDR7 GPU";
        sampleGpu.image = "https://images.unsplash.com/photo-1591488320449-011701bb6704";
        sampleGpu.ratingRate = 4.9;
        sampleGpu.ratingCount = 128;
        sampleGpu.addedByName = "Voltbox";
        sampleGpu.addedByEmail = "harish@voltbox.test";
        sampleGpu.addedByColor = "#ffd23f";
        sampleGpu.official = true;
        sampleGpu.createdAt = 1730000000000L;

        sampleCpu = new Product(
                16,
                "VB-CPU-016",
                "AMD Ryzen 7 9800X3D",
                125.50,
                25,
                "components"
        );
        sampleCpu.description = "8-Core 16-Thread 3D V-Cache Gaming Processor";
        sampleCpu.image = "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea";
        sampleCpu.official = true;

        sampleStorage = new Product(
                10,
                null,
                "SanDisk SSD PLUS 1TB Internal SSD",
                109.00,
                3,
                "electronics"
        );

        contributorUser = new User();
        contributorUser.id = 1;
        contributorUser.name = "Harish";
        contributorUser.email = "harish@voltbox.test";
        contributorUser.avatarColor = "#ffd23f";
        contributorUser.role = "moderator";
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Price Calculations & Telemetry Tests
    // ─────────────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("1. Price Calculations & Historical Telemetry")
    class PriceCalculationTests {

        @Test
        @DisplayName("roundMoney rounds floating-point currency values to two decimal places")
        void roundMoneyRoundsToTwoDecimals() {
            assertEquals(200.00, ProductService.roundMoney(199.996));
            assertEquals(49.99, ProductService.roundMoney(49.994));
            assertEquals(114.95, ProductService.roundMoney(114.9500001));
            assertEquals(0.00, ProductService.roundMoney(0.0));
        }

        @Test
        @DisplayName("calculateLineSubtotal multiplies unit price by quantity and handles non-positive inputs")
        void calculateLineSubtotalComputesAccurateTotals() {
            assertEquals(600.00, productService.calculateLineSubtotal(200.00, 3));
            assertEquals(376.50, productService.calculateLineSubtotal(125.50, 3));
            assertEquals(0.00, productService.calculateLineSubtotal(200.00, 0));
            assertEquals(0.00, productService.calculateLineSubtotal(-15.00, 4));
        }

        @Test
        @DisplayName("calculateDiscountedPrice applies Rig Builder 5% and Promo 10% discounts accurately")
        void calculateDiscountedPriceAppliesPercentageDiscounts() {
            // 5% Rig Builder bundle discount on $200.00 -> $190.00
            assertEquals(190.00, productService.calculateDiscountedPrice(200.00, 5.0));
            // 10% VOLT10 promo discount on $125.50 -> $112.95
            assertEquals(112.95, productService.calculateDiscountedPrice(125.50, 10.0));
            // Clamps out-of-range percentages safely
            assertEquals(200.00, productService.calculateDiscountedPrice(200.00, -10.0));
            assertEquals(0.00, productService.calculateDiscountedPrice(200.00, 150.0));
        }

        @Test
        @DisplayName("calculateInventoryValuation sums active product stock value and excludes taken-down listings")
        void calculateInventoryValuationSumsActiveProductsOnly() {
            ProductEntity activeGpu = productService.enrich(sampleGpu);   // $200.00 * 2 = $400.00
            ProductEntity activeCpu = productService.enrich(sampleCpu);   // $125.50 * 25 = $3,137.50
            ProductEntity takenDown = productService.enrich(sampleStorage); // $109.00 * 3 (takenDown = true)
            takenDown.setTakenDown(true);

            double totalValuation = productService.calculateInventoryValuation(
                    Arrays.asList(activeGpu, activeCpu, takenDown)
            );

            assertEquals(3537.50, totalValuation);
            assertEquals(0.0, productService.calculateInventoryValuation(Collections.emptyList()));
        }

        @Test
        @DisplayName("generatePriceHistory and buildSpecs calculate 6-month price bounds, average, and delta percentage")
        void generatePriceHistoryAndBuildSpecsComputeAccurateMetrics() {
            List<ProductEntity.PricePoint> history = productService.generatePriceHistory(sampleGpu);

            assertNotNull(history);
            assertEquals(6, history.size());
            assertEquals("May", history.get(0).month);
            assertEquals("Oct", history.get(5).month);
            // Final month ("Oct") must match the current unit price
            assertEquals(200.00, history.get(5).price);

            for (ProductEntity.PricePoint point : history) {
                assertTrue(point.price > 0, "Historical price must be positive");
                assertTrue(point.marketAvg > point.price, "Market average should exceed Voltbox bench price");
            }

            ProductEntity.Specs specs = productService.buildSpecs(sampleGpu, history);
            assertNotNull(specs);
            assertEquals("VB-GPU-019", specs.sku);
            assertEquals("gpus", specs.group);
            assertEquals("Graphics Card (GPU)", specs.groupLabel);
            assertTrue(specs.lowestPrice <= 200.00);
            assertTrue(specs.highestPrice >= 200.00);
            assertTrue(specs.avgPrice >= specs.lowestPrice && specs.avgPrice <= specs.highestPrice);

            double expectedDelta = ProductService.roundMoney(
                    ((sampleGpu.price - history.get(0).price) / history.get(0).price) * 100.0
            );
            assertEquals(expectedDelta, specs.priceDeltaPct);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Inventory Checks & Stock Mutation Tests
    // ─────────────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("2. Inventory Checks & Stock Threshold Logic")
    class InventoryCheckTests {

        @Test
        @DisplayName("isLowStock and isInStock enforce LOW_STOCK_THRESHOLD (< 5 units)")
        void lowStockAndInStockBoundaryChecks() {
            assertEquals(5, ProductService.LOW_STOCK_THRESHOLD);

            assertTrue(productService.isLowStock(0));
            assertTrue(productService.isLowStock(1));
            assertTrue(productService.isLowStock(4));
            assertFalse(productService.isLowStock(5));
            assertFalse(productService.isLowStock(25));

            assertFalse(productService.isInStock(0));
            assertTrue(productService.isInStock(1));
        }

        @Test
        @DisplayName("resolveQuantity prioritizes explicit stockQuantity and falls back to seed DEFAULT_QUANTITIES")
        void resolveQuantityHandlesExplicitAndDefaultSeedQuantities() {
            // Explicit stockQuantity != 10
            assertEquals(2, productService.resolveQuantity(sampleGpu));
            assertEquals(25, productService.resolveQuantity(sampleCpu));

            // Product with default uninitialized fields (10) falls back to DEFAULT_QUANTITIES map by ID
            Product uninitializedSeed = new Product();
            uninitializedSeed.id = 8; // ID 8 has default seed quantity 1 in DEFAULT_QUANTITIES
            assertEquals(1, productService.resolveQuantity(uninitializedSeed));

            // Product explicitly updated to 0 units (out of stock) preserves 0
            Product depleted = new Product(19, "VB-GPU-019", "Nvidia RTX 5090", 200.0, 0, "components");
            depleted.lastRestockedAt = System.currentTimeMillis();
            depleted.lastUpdatedBy = "Harish";
            assertEquals(0, productService.resolveQuantity(depleted));
        }

        @Test
        @DisplayName("updateProductStock updates stockQuantity, recalculates lowStock flag, and syncs with ProductRepository")
        void updateProductStockUpdatesStoreAndRepository() {
            when(store.findProduct(19)).thenReturn(sampleGpu);
            when(productRepository.save(any(ProductEntity.class))).thenAnswer(inv -> inv.getArgument(0));

            // Increase stock from 2 (low stock) to 12 (healthy stock)
            ProductEntity updated = productService.updateProductStock(19, 12, "Harish");

            assertNotNull(updated);
            assertEquals(12, updated.getStockQuantity());
            assertEquals(12, updated.getQuantity());
            assertEquals(12, updated.getStock());
            assertFalse(updated.isLowStock(), "12 units should clear the lowStock flag");
            assertEquals("Harish", updated.getLastUpdatedBy());

            verify(store, times(1)).save();
            verify(productRepository, times(1)).updateStockQuantity(
                    eq(19),
                    eq(12),
                    eq(false),
                    anyLong(),
                    eq("Harish")
            );
            verify(productRepository, times(1)).save(any(ProductEntity.class));
        }

        @Test
        @DisplayName("updateProductStock clamps negative stock values to 0 and sets lowStock to true")
        void updateProductStockClampsNegativeQuantityToZero() {
            when(store.findProduct(16)).thenReturn(sampleCpu);

            ProductEntity depleted = productService.updateProductStock(16, -5, "Harish");

            assertNotNull(depleted);
            assertEquals(0, depleted.getStockQuantity());
            assertTrue(depleted.isLowStock(), "0 units must be marked as lowStock");
            verify(productRepository, times(1)).updateStockQuantity(
                    eq(16),
                    eq(0),
                    eq(true),
                    anyLong(),
                    eq("Harish")
            );
        }

        @Test
        @DisplayName("listActiveProducts with lowStockOnly=true queries ProductRepository for low-stock items")
        void listActiveProductsFiltersLowStockViaRepository() {
            ProductEntity lowStockGpu = productService.enrich(sampleGpu); // qty = 2, lowStock = true
            when(productRepository.count()).thenReturn(2L);
            when(productRepository.findByLowStockTrueAndTakenDownFalseOrderByStockQuantityAsc())
                    .thenReturn(Collections.singletonList(lowStockGpu));

            List<ProductEntity> result = productService.listActiveProducts(null, null, null, true);

            assertEquals(1, result.size());
            assertEquals(19, result.get(0).getId());
            assertTrue(result.get(0).isLowStock());
            verify(productRepository, times(1))
                    .findByLowStockTrueAndTakenDownFalseOrderByStockQuantityAsc();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Data Mapping & JPA Repository Integration Tests
    // ─────────────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("3. Product-to-ProductEntity Data Mapping & Repository Operations")
    class DataMappingTests {

        @Test
        @DisplayName("classifyComponentGroup and computeSku accurately categorize hardware and format SKUs")
        void classifyComponentGroupAndComputeSkuMapHardwareCorrectly() {
            assertEquals("gpus", productService.classifyComponentGroup(sampleGpu));
            assertEquals("VB-GPU-019", productService.computeSku(sampleGpu));

            assertEquals("cpus", productService.classifyComponentGroup(sampleCpu));
            assertEquals("VB-CPU-016", productService.computeSku(sampleCpu));

            assertEquals("storage", productService.classifyComponentGroup(sampleStorage));
            assertEquals("VB-STR-010", productService.computeSku(sampleStorage));

            Product motherboard = new Product(15, null, "ASUS ROG Crosshair B550 Motherboard", 220.0, 6, "components");
            assertEquals("motherboards", productService.classifyComponentGroup(motherboard));
            assertEquals("VB-MBD-015", productService.computeSku(motherboard));

            Product audio = new Product(25, null, "Apple AirPods Max Wireless Headphones", 479.0, 1, "audio");
            assertEquals("audio", productService.classifyComponentGroup(audio));
            assertEquals("VB-AUD-025", productService.computeSku(audio));

            Product console = new Product(24, null, "Sony PlayStation 5 Pro Console", 699.0, 4, "gaming");
            assertEquals("gaming", productService.classifyComponentGroup(console));
            assertEquals("VB-GMG-024", productService.computeSku(console));
        }

        @Test
        @DisplayName("enrich maps all Product fields, inventory flags, priceHistory, and Specs onto ProductEntity")
        void enrichMapsCompleteProductToProductEntity() {
            ProductEntity entity = productService.enrich(sampleGpu);

            assertNotNull(entity);
            assertEquals(19, entity.getId());
            assertEquals("VB-GPU-019", entity.getSku());
            assertEquals("Nvidia RTX 5090", entity.getName());
            assertEquals("Nvidia RTX 5090", entity.getTitle());
            assertEquals(200.00, entity.getPrice());
            assertEquals("components", entity.getCategory());
            assertEquals("gpus", entity.getComponentGroup());
            assertEquals(2, entity.getStockQuantity());
            assertEquals(2, entity.getQuantity());
            assertEquals(2, entity.getStock());
            assertTrue(entity.isLowStock());
            assertTrue(entity.isOfficial());
            assertEquals("Voltbox", entity.getAddedByName());
            assertEquals("harish@voltbox.test", entity.getAddedByEmail());
            assertNotNull(entity.getSpecs());
            assertEquals("Blackwell / Ada 32GB GDDR7", entity.getSpecs().architecture);
            assertEquals(6, entity.getPriceHistory().size());
        }

        @Test
        @DisplayName("findEnrichedProduct retrieves entity from ProductRepository and hydrates transient telemetry")
        void findEnrichedProductUsesRepositoryFirstAndHydratesTelemetry() {
            ProductEntity persisted = new ProductEntity(19, "VB-GPU-019", "Nvidia RTX 5090", 200.00, 7, "components");
            persisted.setComponentGroup("gpus");
            when(productRepository.findByIdAndTakenDownFalse(19)).thenReturn(Optional.of(persisted));

            ProductEntity result = productService.findEnrichedProduct(19);

            assertNotNull(result);
            assertEquals(19, result.getId());
            assertEquals("VB-GPU-019", result.getSku());
            assertEquals(7, result.getStockQuantity());
            assertFalse(result.isLowStock());
            assertNotNull(result.getSpecs(), "Transient specs should be hydrated");
            assertEquals(6, result.getPriceHistory().size(), "Transient priceHistory should be hydrated");
            verify(productRepository, times(1)).findByIdAndTakenDownFalse(19);
            verify(store, never()).findProduct(anyInt());
        }

        @Test
        @DisplayName("findEnrichedProductBySku resolves product case-insensitively and returns null when taken down")
        void findEnrichedProductBySkuHandlesCaseInsensitiveLookup() {
            ProductEntity persisted = productService.enrich(sampleCpu);
            when(productRepository.findBySkuIgnoreCase("vb-cpu-016")).thenReturn(Optional.of(persisted));

            ProductEntity found = productService.findEnrichedProductBySku("  vb-cpu-016 ");

            assertNotNull(found);
            assertEquals(16, found.getId());
            assertEquals("VB-CPU-016", found.getSku());
            assertEquals("AMD Ryzen 7 9800X3D", found.getName());
            assertNull(productService.findEnrichedProductBySku("   "));
        }

        @Test
        @DisplayName("createProduct maps request payload, assigns contributor metadata, and saves to Store and ProductRepository")
        void createProductMapsPayloadAndPersistsEntity() {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("title", "Corsair MP700 PRO 2TB PCIe Gen5 NVMe SSD");
            payload.put("category", "storage");
            payload.put("price", "239.99");
            payload.put("stockQuantity", "4");
            payload.put("description", "12,400 MB/s sequential read Gen5 M.2 SSD");
            payload.put("image", "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b");

            when(store.addProduct(any(Product.class))).thenAnswer(inv -> {
                Product p = inv.getArgument(0);
                p.id = 28;
                return p;
            });

            ProductEntity created = productService.createProduct(contributorUser, payload);

            assertNotNull(created);
            assertEquals(28, created.getId());
            assertEquals("VB-STR-028", created.getSku());
            assertEquals("Corsair MP700 PRO 2TB PCIe Gen5 NVMe SSD", created.getName());
            assertEquals(239.99, created.getPrice());
            assertEquals(4, created.getStockQuantity());
            assertTrue(created.isLowStock(), "4 units (< 5) should flag lowStock=true");
            assertEquals("storage", created.getComponentGroup());
            assertEquals("Harish", created.getAddedByName());
            assertEquals("harish@voltbox.test", created.getAddedByEmail());

            verify(store, times(1)).addProduct(any(Product.class));
            verify(productRepository, times(1)).save(entityCaptor.capture());
            assertEquals("VB-STR-028", entityCaptor.getValue().getSku());
        }

        @Test
        @DisplayName("updateProduct updates price, stockQuantity, and title while rounding currency")
        void updateProductUpdatesFieldsAndSyncsRepository() {
            when(store.findProduct(19)).thenReturn(sampleGpu);

            Map<String, Object> updates = new LinkedHashMap<>();
            updates.put("name", "Nvidia GeForce RTX 5090 Founders Edition");
            updates.put("price", "249.995");
            updates.put("stockQuantity", "9");

            ProductEntity updated = productService.updateProduct(19, contributorUser, updates);

            assertNotNull(updated);
            assertEquals("Nvidia GeForce RTX 5090 Founders Edition", updated.getName());
            assertEquals(250.00, updated.getPrice());
            assertEquals(9, updated.getStockQuantity());
            assertFalse(updated.isLowStock());
            verify(store, times(1)).save();
            verify(productRepository, times(1)).save(any(ProductEntity.class));
        }

        @Test
        @DisplayName("takeDownProduct marks listing as takenDown and invokes softDeleteById on ProductRepository")
        void takeDownProductSoftDeletesListing() {
            when(store.findProduct(19)).thenReturn(sampleGpu);

            boolean removed = productService.takeDownProduct(19);

            assertTrue(removed);
            assertTrue(sampleGpu.takenDown);
            verify(store, times(1)).save();
            verify(productRepository, times(1)).softDeleteById(19);
        }
    }
}
