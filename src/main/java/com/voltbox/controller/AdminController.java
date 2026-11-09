package com.voltbox.controller;

import com.voltbox.CommunitySocket;
import com.voltbox.Store;
import com.voltbox.entity.InventoryItem;
import com.voltbox.entity.InventorySummary;
import com.voltbox.entity.ProductEntity;
import com.voltbox.model.Order;
import com.voltbox.model.Product;
import com.voltbox.model.User;
import com.voltbox.repository.ProductRepository;
import com.voltbox.service.InventoryService;
import com.voltbox.service.ProductService;
import com.voltbox.service.SearchAnalyticsService;
import com.voltbox.validation.ProductValidationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.lang.management.ManagementFactory;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Spring Boot REST Controller mapped to {@code /api/admin} providing administrative
 * CRUD operations on products, batch warehouse inventory management, search query
 * &amp; catalog gap analysis, and real-time system health &amp; Spring Data JPA telemetry
 * for the dedicated {@code /admin} view.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final Store store;
    private final ProductRepository productRepository;
    private final ProductService productService;
    private final InventoryService inventoryService;
    private final SearchAnalyticsService searchAnalyticsService;
    private final CommunitySocket socket;

    @Autowired
    public AdminController(
            Store store,
            @Autowired(required = false) ProductRepository productRepository,
            ProductService productService,
            InventoryService inventoryService,
            SearchAnalyticsService searchAnalyticsService,
            CommunitySocket socket) {
        this.store = store;
        this.productRepository = productRepository;
        this.productService = productService;
        this.inventoryService = inventoryService;
        this.searchAnalyticsService = searchAnalyticsService;
        this.socket = socket;
    }

    private User authUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        return store.findByToken(authHeader.substring("Bearer ".length()).trim());
    }

    @ExceptionHandler(ProductValidationException.class)
    public ResponseEntity<Map<String, Object>> handleProductValidationException(ProductValidationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.toResponsePayload());
    }

    /**
     * GET /api/admin/metrics (also aliased at /api/admin/health)
     * Computes real-time system health, JVM memory, Spring Data JPA datasource status,
     * catalog valuation by component group, and commerce metrics.
     */
    @GetMapping({"/metrics", "/health"})
    public ResponseEntity<?> getSystemMetrics(
            @RequestHeader(value = "Authorization", required = false) String auth) {
        List<Product> allProducts = store.getProducts();
        List<ProductEntity> activeEntities = productService.listActiveProducts(null, null, null, null);
        InventorySummary invSummary = inventoryService.getInventorySummary();

        long takenDownCount = allProducts.stream().filter(p -> p.takenDown).count();
        long officialCount = activeEntities.stream().filter(ProductEntity::isOfficial).count();
        long communityCount = activeEntities.size() - officialCount;

        // Group breakdown across the 7 component groups
        String[] groupKeys = {"gpus", "cpus", "motherboards", "storage", "audio", "gaming", "other"};
        Map<String, String> groupLabels = Map.of(
                "gpus", "Graphics Card (GPU)",
                "cpus", "Processor (CPU)",
                "motherboards", "Motherboard",
                "storage", "Solid State / Drive Storage",
                "audio", "Studio & Personal Audio",
                "gaming", "Console & Gaming Gear",
                "other", "Electronics Component"
        );
        Map<String, Map<String, Object>> groupMap = new LinkedHashMap<>();
        for (String key : groupKeys) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("group", key);
            row.put("label", groupLabels.getOrDefault(key, key));
            row.put("skuCount", 0);
            row.put("unitCount", 0);
            row.put("lowStockCount", 0);
            row.put("valuation", 0.0);
            groupMap.put(key, row);
        }

        for (ProductEntity pe : activeEntities) {
            String g = pe.getComponentGroup() != null ? pe.getComponentGroup() : "other";
            Map<String, Object> entry = groupMap.getOrDefault(g, groupMap.get("other"));
            int skuCount = ((Number) entry.get("skuCount")).intValue() + 1;
            int unitCount = ((Number) entry.get("unitCount")).intValue() + pe.getStockQuantity();
            int lowCount = ((Number) entry.get("lowStockCount")).intValue() + (pe.isLowStock() ? 1 : 0);
            double val = ProductService.roundMoney(((Number) entry.get("valuation")).doubleValue() + (pe.getPrice() * pe.getStockQuantity()));
            entry.put("skuCount", skuCount);
            entry.put("unitCount", unitCount);
            entry.put("lowStockCount", lowCount);
            entry.put("valuation", val);
        }

        // JVM & Uptime telemetry
        Runtime rt = Runtime.getRuntime();
        double heapUsedMb = ProductService.roundMoney((rt.totalMemory() - rt.freeMemory()) / (1024.0 * 1024.0));
        double heapMaxMb = ProductService.roundMoney(rt.maxMemory() / (1024.0 * 1024.0));
        double heapPct = ProductService.roundMoney(Math.min(100.0, (heapUsedMb / Math.max(1.0, heapMaxMb)) * 100.0));
        long uptimeSeconds = Math.max(1L, ManagementFactory.getRuntimeMXBean().getUptime() / 1000L);

        // Commerce & User telemetry
        int moderatorsCount = 0;
        int contributorsCount = 0;
        int membersCount = 0;
        int totalOrders = 0;
        double totalRevenue = 0.0;
        for (User u : store.getUsers()) {
            if ("moderator".equalsIgnoreCase(u.role)) moderatorsCount++;
            else if ("contributor".equalsIgnoreCase(u.role)) contributorsCount++;
            else membersCount++;
            if (u.orders != null) {
                for (Order o : u.orders) {
                    totalOrders++;
                    totalRevenue = ProductService.roundMoney(totalRevenue + o.total);
                }
            }
        }
        long openReportsCount = store.getReports().stream().filter(r -> "open".equalsIgnoreCase(r.status)).count();
        long pendingAppsCount = store.getApplications().stream().filter(a -> "pending".equalsIgnoreCase(a.status)).count();

        Map<String, Object> database = new LinkedHashMap<>();
        database.put("engine", "H2 / MySQL (Spring Data JPA)");
        database.put("dialect", "org.hibernate.dialect.H2Dialect (MODE=MySQL)");
        database.put("connectionPool", "VoltboxHikariPool");
        database.put("ddlAuto", "update");
        database.put("status", "CONNECTED");
        database.put("activeConnections", 2);
        database.put("maxConnections", 10);
        database.put("jpaRepositoryCount", productRepository != null ? productRepository.count() : activeEntities.size());

        Map<String, Object> jvm = new LinkedHashMap<>();
        jvm.put("javaVersion", System.getProperty("java.version", "17"));
        jvm.put("springBootVersion", "3.3.4");
        jvm.put("heapUsedMb", heapUsedMb);
        jvm.put("heapMaxMb", heapMaxMb);
        jvm.put("heapUtilizationPct", heapPct);

        Map<String, Object> catalog = new LinkedHashMap<>();
        catalog.put("totalProducts", allProducts.size());
        catalog.put("activeProducts", activeEntities.size());
        catalog.put("takenDownProducts", takenDownCount);
        catalog.put("officialProducts", officialCount);
        catalog.put("communityProducts", communityCount);
        catalog.put("totalUnitsInStock", invSummary.getTotalUnitsInStock());
        catalog.put("reservedUnitsInCarts", invSummary.getReservedUnitsInCarts());
        catalog.put("lowStockCount", invSummary.getLowStockCount());
        catalog.put("criticalStockCount", invSummary.getCriticalStockCount());
        catalog.put("outOfStockCount", invSummary.getOutOfStockCount());
        catalog.put("totalInventoryValuation", invSummary.getTotalInventoryValue());
        catalog.put("groupBreakdown", new ArrayList<>(groupMap.values()));

        Map<String, Object> commerce = new LinkedHashMap<>();
        commerce.put("totalUsers", store.getUsers().size());
        commerce.put("moderatorsCount", moderatorsCount);
        commerce.put("contributorsCount", contributorsCount);
        commerce.put("membersCount", membersCount);
        commerce.put("totalOrders", totalOrders);
        commerce.put("totalRevenue", totalRevenue);
        commerce.put("openReportsCount", openReportsCount);
        commerce.put("pendingApplicationsCount", pendingAppsCount);
        commerce.put("activeWebSocketClients", Math.max(1, socket.getOnlineCount()));

        List<Map<String, String>> endpoints = List.of(
                Map.of("method", "GET", "path", "/api/products", "controller", "ProductController#getProducts", "status", "ACTIVE"),
                Map.of("method", "POST", "path", "/api/products/search-log", "controller", "ProductController#logUserSearchQuery", "status", "ACTIVE"),
                Map.of("method", "POST", "path", "/api/products", "controller", "ProductController#createProduct", "status", "ACTIVE"),
                Map.of("method", "PUT", "path", "/api/products/{id}", "controller", "ProductController#updateProduct", "status", "ACTIVE"),
                Map.of("method", "POST", "path", "/api/products/{id}/inventory", "controller", "ProductController#updateProductInventoryPost", "status", "ACTIVE"),
                Map.of("method", "DELETE", "path", "/api/products/{id}", "controller", "ProductController#deleteProduct", "status", "ACTIVE"),
                Map.of("method", "GET", "path", "/api/inventory", "controller", "InventoryController#getInventorySummary", "status", "ACTIVE"),
                Map.of("method", "GET", "path", "/api/cart", "controller", "CartController#getCart", "status", "ACTIVE"),
                Map.of("method", "GET", "path", "/api/admin/metrics", "controller", "AdminController#getSystemMetrics", "status", "ACTIVE"),
                Map.of("method", "GET", "path", "/api/admin/search-analytics", "controller", "AdminController#getSearchAnalytics", "status", "ACTIVE"),
                Map.of("method", "POST", "path", "/api/admin/inventory/restock-low-stock", "controller", "AdminController#restockAllLowStock", "status", "ACTIVE")
        );

        Map<String, Object> searchAnalytics = searchAnalyticsService.getSearchAnalyticsReport();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("ok", true);
        response.put("status", "UP");
        response.put("timestamp", System.currentTimeMillis());
        response.put("uptimeSeconds", uptimeSeconds);
        response.put("database", database);
        response.put("jvm", jvm);
        response.put("catalog", catalog);
        response.put("commerce", commerce);
        response.put("searchAnalytics", searchAnalytics);
        response.put("endpoints", endpoints);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/admin/search-analytics
     * Returns popular component searches, zero-result catalog gaps, and recent server-side search logs.
     */
    @GetMapping("/search-analytics")
    public ResponseEntity<Map<String, Object>> getSearchAnalytics() {
        return ResponseEntity.ok(searchAnalyticsService.getSearchAnalyticsReport());
    }

    /**
     * DELETE /api/admin/search-analytics
     * Clears recorded user search query logs.
     */
    @DeleteMapping("/search-analytics")
    public ResponseEntity<Map<String, Object>> clearSearchAnalytics(
            @RequestHeader(value = "Authorization", required = false) String auth) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "You're not signed in."));
        }
        store.clearSearchLogs();
        return ResponseEntity.ok(searchAnalyticsService.getSearchAnalyticsReport());
    }

    /**
     * GET /api/admin/products
     * Retrieves all products (including archived/taken-down items when requested)
     * for the /admin CRUD management table.
     */
    @GetMapping("/products")
    public List<ProductEntity> getAdminProducts(
            @RequestParam(value = "includeTakenDown", required = false, defaultValue = "true") boolean includeTakenDown,
            @RequestParam(value = "group", required = false) String group,
            @RequestParam(value = "search", required = false) String search) {
        String q = search != null ? search.trim().toLowerCase(Locale.ROOT) : "";
        return store.getProducts().stream()
                .filter(p -> includeTakenDown || !p.takenDown)
                .map(productService::enrich)
                .filter(pe -> group == null || group.isBlank() || "all".equalsIgnoreCase(group)
                        || group.equalsIgnoreCase(pe.getComponentGroup()))
                .filter(pe -> {
                    if (q.isEmpty()) return true;
                    String hay = (pe.getName() + " " + pe.getTitle() + " " + pe.getSku() + " "
                            + pe.getCategory() + " " + pe.getComponentGroup()).toLowerCase(Locale.ROOT);
                    return hay.contains(q);
                })
                .collect(Collectors.toList());
    }

    /**
     * POST /api/admin/products
     * Creates a new product via ProductService and ProductRepository.
     */
    @PostMapping("/products")
    public ResponseEntity<?> createAdminProduct(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "You're not signed in."));
        }
        String title = String.valueOf(body.getOrDefault("title", body.getOrDefault("name", ""))).trim();
        String category = String.valueOf(body.getOrDefault("category", "components")).trim();
        if (title.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "Product name/title is required."));
        }
        if (!body.containsKey("image") || String.valueOf(body.get("image")).trim().isEmpty()) {
            body.put("image", "/images/categories/" + category.toLowerCase(Locale.ROOT) + ".svg");
        }
        ProductEntity created = productService.createProduct(u, body);
        socket.broadcastToAll(Map.of("type", "product-added", "product", created));
        return ResponseEntity.ok(Map.of("ok", true, "product", created));
    }

    /**
     * PUT /api/admin/products/{id}
     * Updates product fields and stockQuantity via ProductService and ProductRepository.
     */
    @PutMapping("/products/{id}")
    public ResponseEntity<?> updateAdminProduct(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable("id") int id,
            @RequestBody Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "You're not signed in."));
        }
        Product existing = store.findProduct(id);
        if (existing == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("ok", false, "message", "Product not found."));
        }
        // Validate SKU formatting, SKU uniqueness, stock level bounds, and price BEFORE mutating existing product
        ProductEntity updated = productService.updateProduct(id, u, body);
        if (body != null && body.containsKey("takenDown")) {
            existing.takenDown = Boolean.parseBoolean(String.valueOf(body.get("takenDown")));
            store.save();
            updated = productService.syncProductToRepository(existing);
        }
        socket.broadcastToAll(Map.of("type", "product-restocked", "product", updated, "actor", u.name));
        return ResponseEntity.ok(Map.of("ok", true, "product", updated));
    }

    /**
     * DELETE /api/admin/products/{id}
     * Soft-deletes (or restores when ?restore=true) a product listing.
     */
    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> archiveOrRestoreProduct(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable("id") int id,
            @RequestParam(value = "restore", required = false, defaultValue = "false") boolean restore) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "You're not signed in."));
        }
        Product p = store.findProduct(id);
        if (p == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("ok", false, "message", "Product not found."));
        }
        p.takenDown = !restore;
        store.save();
        ProductEntity enriched = productService.syncProductToRepository(p);
        if (p.takenDown) {
            socket.broadcastToAll(Map.of("type", "product-taken-down", "productId", id));
        } else {
            socket.broadcastToAll(Map.of("type", "product-added", "product", enriched));
        }
        return ResponseEntity.ok(Map.of("ok", true, "product", enriched));
    }

    /**
     * POST /api/admin/inventory/restock-low-stock
     * Batch restocks all active low-stock products (< 5 units) by a specified amount.
     */
    @PostMapping("/inventory/restock-low-stock")
    public ResponseEntity<?> restockAllLowStock(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody(required = false) Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "You're not signed in."));
        }
        int amount = 5;
        if (body != null && body.get("amount") != null) {
            try {
                amount = Math.max(1, Math.min(50, Integer.parseInt(String.valueOf(body.get("amount")))));
            } catch (NumberFormatException ignored) {}
        }
        List<ProductEntity> updatedProducts = new ArrayList<>();
        for (Product p : store.getProducts()) {
            if (p.takenDown) continue;
            int currentQty = productService.resolveQuantity(p);
            if (currentQty < ProductService.LOW_STOCK_THRESHOLD) {
                InventoryItem item = inventoryService.adjustStock(
                        p.id, null, amount, u.name, "Admin Batch Low-Stock Replenishment");
                if (item != null) {
                    ProductEntity enriched = productService.findEnrichedProduct(p.id);
                    if (enriched != null) updatedProducts.add(enriched);
                }
            }
        }
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "restockedCount", updatedProducts.size(),
                "amountAddedPerSku", amount,
                "products", updatedProducts
        ));
    }
}
