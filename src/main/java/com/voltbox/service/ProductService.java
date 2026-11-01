package com.voltbox.service;

import com.voltbox.Store;
import com.voltbox.entity.ProductEntity;
import com.voltbox.model.Product;
import com.voltbox.model.User;
import com.voltbox.repository.ProductRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProductService {
    public static final int LOW_STOCK_THRESHOLD = 5;

    private static final Map<Integer, Integer> DEFAULT_QUANTITIES = Map.ofEntries(
            Map.entry(1, 3), Map.entry(2, 14), Map.entry(3, 2), Map.entry(4, 20),
            Map.entry(5, 11), Map.entry(6, 4), Map.entry(7, 9), Map.entry(8, 1),
            Map.entry(9, 16), Map.entry(10, 3), Map.entry(11, 7), Map.entry(12, 4),
            Map.entry(13, 10), Map.entry(14, 18), Map.entry(15, 6), Map.entry(16, 25),
            Map.entry(17, 2), Map.entry(18, 8), Map.entry(19, 2), Map.entry(20, 12),
            Map.entry(21, 3), Map.entry(22, 8), Map.entry(23, 15), Map.entry(24, 4),
            Map.entry(25, 1), Map.entry(26, 10), Map.entry(27, 2)
    );

    private static final Map<String, String> SKU_PREFIX_BY_GROUP = Map.of(
            "gpus", "GPU",
            "cpus", "CPU",
            "motherboards", "MBD",
            "storage", "STR",
            "audio", "AUD",
            "gaming", "GMG",
            "other", "PRT"
    );

    private static final Map<String, String> GROUP_LABELS = Map.of(
            "gpus", "Graphics Card (GPU)",
            "cpus", "Processor (CPU)",
            "motherboards", "Motherboard",
            "storage", "Solid State / Drive Storage",
            "audio", "Studio & Personal Audio",
            "gaming", "Console & Gaming Gear",
            "other", "Electronics Component"
    );

    private final Store store;
    private final ProductRepository productRepository;

    public ProductService(Store store) {
        this(store, null);
    }

    @Autowired
    public ProductService(Store store, @Autowired(required = false) ProductRepository productRepository) {
        this.store = store;
        this.productRepository = productRepository;
    }

    @PostConstruct
    public void syncCatalogToRepository() {
        if (productRepository == null) return;
        try {
            for (Product p : store.getProducts()) {
                ProductEntity entity = enrich(p);
                productRepository.save(entity);
            }
        } catch (Exception ignored) {}
    }

    public ProductEntity syncProductToRepository(Product p) {
        if (p == null) return null;
        ProductEntity enriched = enrich(p);
        if (productRepository != null) {
            try {
                productRepository.save(enriched);
            } catch (Exception ignored) {}
        }
        return enriched;
    }

    public ProductEntity hydrateTransientTelemetry(ProductEntity entity) {
        if (entity == null) return null;
        Product temp = new Product();
        temp.id = entity.getId();
        temp.sku = entity.getSku();
        temp.name = entity.getName();
        temp.title = entity.getTitle();
        temp.price = entity.getPrice();
        temp.category = entity.getCategory();
        temp.componentGroup = entity.getComponentGroup();
        List<ProductEntity.PricePoint> history = generatePriceHistory(temp);
        ProductEntity.Specs specs = buildSpecs(temp, history);
        entity.setPriceHistory(history);
        entity.setSpecs(specs);
        return entity;
    }

    public static double roundMoney(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    public boolean isLowStock(int stockQuantity) {
        return stockQuantity < LOW_STOCK_THRESHOLD;
    }

    public boolean isInStock(int stockQuantity) {
        return stockQuantity > 0;
    }

    public double calculateLineSubtotal(double unitPrice, int quantity) {
        if (unitPrice <= 0 || quantity <= 0) return 0.0;
        return roundMoney(unitPrice * quantity);
    }

    public double calculateDiscountedPrice(double unitPrice, double discountPercent) {
        if (unitPrice <= 0) return 0.0;
        double clampedPct = Math.max(0.0, Math.min(100.0, discountPercent));
        return roundMoney(unitPrice * (1.0 - (clampedPct / 100.0)));
    }

    public double calculateInventoryValuation(List<ProductEntity> products) {
        if (products == null || products.isEmpty()) return 0.0;
        double sum = products.stream()
                .filter(p -> p != null && !p.isTakenDown())
                .mapToDouble(p -> Math.max(0.0, p.getPrice()) * Math.max(0, p.getStockQuantity()))
                .sum();
        return roundMoney(sum);
    }

    public int resolveQuantity(Product p) {
        if (p == null) return 0;
        if (p.lastRestockedAt > 0 || (p.lastUpdatedBy != null && !p.lastUpdatedBy.isBlank())) {
            return Math.max(0, p.stockQuantity);
        }
        if (p.stockQuantity >= 0 && p.stockQuantity != 10) return p.stockQuantity;
        if (p.quantity >= 0 && p.quantity != 10) return p.quantity;
        if (p.stock >= 0 && p.stock != 10) return p.stock;
        return DEFAULT_QUANTITIES.getOrDefault(p.id, 10);
    }

    public String classifyComponentGroup(Product p) {
        if (p.componentGroup != null && !p.componentGroup.isBlank()) {
            return p.componentGroup;
        }
        String label = (p.title != null && !p.title.isBlank()) ? p.title : (p.name != null ? p.name : "");
        String hay = (label + " " + (p.category != null ? p.category : "")).toLowerCase(Locale.ROOT);
        if (hay.contains("rtx") || hay.contains("gtx") || hay.contains("radeon") || hay.contains("gpu") || hay.contains("graphics")) {
            return "gpus";
        }
        if (hay.contains("ryzen") || hay.contains("intel") || hay.contains("core ultra") || hay.contains("core i")
                || hay.contains("cpu") || hay.contains("processor") || hay.contains("noctua") || hay.contains("cooler")) {
            return "cpus";
        }
        if (hay.contains("motherboard") || hay.contains("b550") || hay.contains("b570") || hay.contains("x670")
                || hay.contains("x870") || hay.contains("crosshair") || hay.contains("z790") || hay.contains("tomahawk")
                || hay.contains("ddr5") || hay.contains("vengeance") || hay.contains("raspberry")) {
            return "motherboards";
        }
        if (hay.contains("ssd") || hay.contains("nvme") || hay.contains("mp700") || hay.contains("sn850")
                || hay.contains("harddisk") || hay.contains("hard disk") || hay.contains("hdd") || hay.contains("storage")) {
            return "storage";
        }
        if (hay.contains("airpods") || hay.contains("headphone") || hay.contains("xm5") || hay.contains("earbud")
                || hay.contains("audio") || hay.contains("speaker") || hay.contains("mic") || hay.contains("shure")
                || hay.contains("sm7") || hay.contains("broadcast") || hay.contains("webcam") || hay.contains("facecam")) {
            return "audio";
        }
        if (hay.contains("playstation") || hay.contains("ps5") || hay.contains("xbox") || hay.contains("controller")
                || hay.contains("console") || hay.contains("handheld") || hay.contains("aethel") || hay.contains("steam deck")
                || hay.contains("mouse") || hay.contains("viper") || hay.contains("apex pro") || hay.contains("gaming")
                || hay.contains("alienware") || hay.contains("oled") || hay.contains("monitor")
                || hay.contains("keychron") || hay.contains("keyboard")) {
            return "gaming";
        }
        return "other";
    }

    public String computeSku(Product p) {
        if (p.sku != null && !p.sku.isBlank()) return p.sku;
        String group = classifyComponentGroup(p);
        String prefix = SKU_PREFIX_BY_GROUP.getOrDefault(group, "PRT");
        return String.format("VB-%s-%03d", prefix, p.id);
    }

    public List<ProductEntity.PricePoint> generatePriceHistory(Product p) {
        String[] months = {"May", "Jun", "Jul", "Aug", "Sep", "Oct"};
        double basePrice = Math.max(1.0, p.price > 0 ? p.price : 100.0);
        int seed = Math.max(1, p.id) * 17;
        double[] mults = {
                1.14 - ((seed % 7) * 0.01),
                1.10 + ((seed % 5) * 0.008),
                1.06 - ((seed % 4) * 0.01),
                1.08 + ((seed % 6) * 0.005),
                1.03 - ((seed % 3) * 0.007),
                1.0
        };
        List<ProductEntity.PricePoint> points = new ArrayList<>(months.length);
        for (int i = 0; i < months.length; i++) {
            double price = (i == months.length - 1) ? roundMoney(basePrice) : roundMoney(basePrice * mults[i]);
            double marketAvg = roundMoney(price * (1.06 + ((i + seed) % 4) * 0.012));
            points.add(new ProductEntity.PricePoint(months[i], price, marketAvg));
        }
        return points;
    }

    public ProductEntity.Specs buildSpecs(Product p, List<ProductEntity.PricePoint> history) {
        String group = classifyComponentGroup(p);
        String sku = computeSku(p);
        double lowest = history.stream().mapToDouble(pt -> pt.price).min().orElse(p.price);
        double highest = history.stream().mapToDouble(pt -> pt.price).max().orElse(p.price);
        double avg = roundMoney(history.stream().mapToDouble(pt -> pt.price).average().orElse(p.price));
        double first = history.isEmpty() ? p.price : history.get(0).price;
        double deltaPct = first > 0 ? roundMoney(((p.price - first) / first) * 100.0) : 0.0;

        ProductEntity.Specs specs = new ProductEntity.Specs();
        specs.sku = sku;
        specs.group = group;
        specs.groupLabel = GROUP_LABELS.getOrDefault(group, "Electronics Component");
        specs.lowestPrice = lowest;
        specs.highestPrice = highest;
        specs.avgPrice = avg;
        specs.priceDeltaPct = deltaPct;

        switch (group) {
            case "gpus":
                specs.architecture = "Blackwell / Ada 32GB GDDR7";
                specs.interfaceSpec = "PCIe 5.0 x16 · HDMI 2.1b + 3× DP 2.1";
                specs.powerDraw = "450W TDP (16-Pin 12V-2x6)";
                specs.warranty = "3-Year Manufacturer + Voltbox Bench Verified";
                break;
            case "cpus":
                specs.architecture = "Zen 5 · 16-Core / 32-Thread · 5.7 GHz Boost";
                specs.interfaceSpec = "Socket AM5 · Dual-Channel DDR5-6400";
                specs.powerDraw = "170W TDP · 80MB L2+L3 Cache";
                specs.warranty = "3-Year Boxed Processor Warranty";
                break;
            case "motherboards":
                specs.architecture = "14+2+1 Duet Rail VRM · 6-Layer Server PCB";
                specs.interfaceSpec = "Socket AM5 / ATX · 3× M.2 Gen5 · Wi-Fi 7";
                specs.powerDraw = "24-Pin ATX + Dual 8-Pin EPS";
                specs.warranty = "3-Year Board & BIOS Protection";
                break;
            case "storage":
                boolean isHdd = p.title != null && p.title.toLowerCase(Locale.ROOT).contains("harddisk");
                specs.architecture = isHdd ? "CMR 7200 RPM Multi-Platter Cache" : "3D TLC NAND · DRAM Cache Controller";
                specs.interfaceSpec = isHdd ? "SATA III 6.0 Gb/s · 3.5\" Form Factor" : "PCIe Gen4 x4 NVMe 2.0 (7,450 MB/s)";
                specs.powerDraw = isHdd ? "6.8W Active / 3.4W Idle" : "5.4W Active / 40mW DevSleep";
                specs.warranty = "5-Year / 600 TBW Endurance";
                break;
            case "audio":
                specs.architecture = "Custom 40mm Neodymium Dynamic Driver · H1/H2 DSP";
                specs.interfaceSpec = "Bluetooth 5.3 Multipoint + Lossless USB-C";
                specs.powerDraw = "20-Hour Active ANC + Spatial Audio";
                specs.warranty = "1-Year Apple / Voltbox Coverage";
                break;
            case "gaming":
                boolean isController = p.title != null && p.title.toLowerCase(Locale.ROOT).contains("controller");
                specs.architecture = isController ? "Dual-Actuator Haptic + Adaptive Triggers" : "Custom RDNA 3.5 Ray-Tracing GPU · 2TB SSD";
                specs.interfaceSpec = isController ? "Bluetooth 5.1 / USB-C Low-Latency" : "HDMI 2.1 (4K 120Hz / 8K) · Wi-Fi 7";
                specs.powerDraw = isController ? "1,560mAh Li-Ion Rechargeable" : "390W Peak System PSU";
                specs.warranty = "1-Year Hardware Replacement";
                break;
            default:
                specs.architecture = "Precision Solid-State";
                specs.interfaceSpec = "PCIe 4.0 / USB-C";
                specs.powerDraw = "65W Nominal";
                specs.warranty = "3-Year Limited Hardware";
                break;
        }
        return specs;
    }

    public ProductEntity enrich(Product p) {
        int qty = resolveQuantity(p);
        String sku = computeSku(p);
        String group = classifyComponentGroup(p);
        String resolvedName = (p.name != null && !p.name.isBlank()) ? p.name : p.title;
        List<ProductEntity.PricePoint> history = generatePriceHistory(p);
        ProductEntity.Specs specs = buildSpecs(p, history);

        ProductEntity entity = new ProductEntity();
        entity.setId(p.id);
        entity.setSku(sku);
        entity.setName(resolvedName);
        entity.setTitle(resolvedName);
        entity.setPrice(p.price);
        entity.setDescription(p.description);
        entity.setCategory(p.category);
        entity.setComponentGroup(group);
        entity.setImage(p.image);
        entity.setRatingRate(p.ratingRate);
        entity.setRatingCount(p.ratingCount);
        entity.setAddedByName(p.addedByName);
        entity.setAddedByColor(p.addedByColor);
        entity.setAddedByEmail(p.addedByEmail);
        entity.setOfficial(p.official);
        entity.setCreatedAt(p.createdAt);
        entity.setTakenDown(p.takenDown);
        entity.setStockQuantity(qty);
        entity.setQuantity(qty);
        entity.setStock(qty);
        entity.setLowStock(qty < LOW_STOCK_THRESHOLD);
        entity.setLastRestockedAt(p.lastRestockedAt > 0 ? p.lastRestockedAt : p.createdAt);
        entity.setLastUpdatedBy(p.lastUpdatedBy != null ? p.lastUpdatedBy : p.addedByName);
        entity.setPriceHistory(history);
        entity.setSpecs(specs);
        return entity;
    }

    public List<ProductEntity> listActiveProducts(String category, String group, String search, Boolean lowStockOnly) {
        String q = search != null ? search.trim().toLowerCase(Locale.ROOT) : "";
        List<ProductEntity> baseList;

        if (productRepository != null && productRepository.count() > 0) {
            if (!q.isEmpty()) {
                baseList = productRepository.searchActiveCatalog(q).stream()
                        .map(this::hydrateTransientTelemetry)
                        .collect(Collectors.toList());
            } else if (Boolean.TRUE.equals(lowStockOnly)) {
                baseList = productRepository.findByLowStockTrueAndTakenDownFalseOrderByStockQuantityAsc().stream()
                        .map(this::hydrateTransientTelemetry)
                        .collect(Collectors.toList());
            } else if (category != null && !category.isBlank() && !"all".equalsIgnoreCase(category)) {
                baseList = productRepository.findByCategoryIgnoreCaseAndTakenDownFalseOrderByIdAsc(category).stream()
                        .map(this::hydrateTransientTelemetry)
                        .collect(Collectors.toList());
            } else if (group != null && !group.isBlank() && !"all".equalsIgnoreCase(group)) {
                baseList = productRepository.findByComponentGroupIgnoreCaseAndTakenDownFalseOrderByIdAsc(group).stream()
                        .map(this::hydrateTransientTelemetry)
                        .collect(Collectors.toList());
            } else {
                baseList = productRepository.findByTakenDownFalseOrderByIdAsc().stream()
                        .map(this::hydrateTransientTelemetry)
                        .collect(Collectors.toList());
            }
        } else {
            baseList = store.getProducts().stream()
                    .filter(p -> !p.takenDown)
                    .map(this::enrich)
                    .collect(Collectors.toList());
        }

        return baseList.stream()
                .filter(pe -> category == null || category.isBlank() || "all".equalsIgnoreCase(category)
                        || category.equalsIgnoreCase(pe.getCategory()))
                .filter(pe -> group == null || group.isBlank() || "all".equalsIgnoreCase(group)
                        || group.equalsIgnoreCase(pe.getComponentGroup()))
                .filter(pe -> lowStockOnly == null || !lowStockOnly || pe.isLowStock())
                .filter(pe -> {
                    if (q.isEmpty()) return true;
                    String hay = (pe.getName() + " " + pe.getTitle() + " "
                            + (pe.getDescription() != null ? pe.getDescription() : "")
                            + " " + pe.getCategory() + " " + pe.getComponentGroup() + " " + pe.getSku()).toLowerCase(Locale.ROOT);
                    return hay.contains(q);
                })
                .collect(Collectors.toList());
    }

    public ProductEntity findEnrichedProduct(int id) {
        if (productRepository != null) {
            Optional<ProductEntity> fromRepo = productRepository.findByIdAndTakenDownFalse(id);
            if (fromRepo.isPresent()) {
                return hydrateTransientTelemetry(fromRepo.get());
            }
        }
        Product p = store.findProduct(id);
        if (p == null || p.takenDown) return null;
        return enrich(p);
    }

    public ProductEntity findEnrichedProductBySku(String sku) {
        if (sku == null || sku.isBlank()) return null;
        String cleanSku = sku.trim();
        if (productRepository != null) {
            Optional<ProductEntity> fromRepo = productRepository.findBySkuIgnoreCase(cleanSku);
            if (fromRepo.isPresent() && !fromRepo.get().isTakenDown()) {
                return hydrateTransientTelemetry(fromRepo.get());
            }
        }
        for (Product p : store.getProducts()) {
            if (p.takenDown) continue;
            if (cleanSku.equalsIgnoreCase(computeSku(p))) {
                return enrich(p);
            }
        }
        return null;
    }

    public ProductEntity createProduct(User actor, Map<String, Object> body) {
        String rawTitle = String.valueOf(body.getOrDefault("title", body.getOrDefault("name", ""))).trim();
        String category = String.valueOf(body.getOrDefault("category", "components")).trim();
        String description = String.valueOf(body.getOrDefault("description", "")).trim();
        String image = String.valueOf(body.getOrDefault("image", "")).trim();
        double price = Double.parseDouble(String.valueOf(body.getOrDefault("price", "0")));
        int quantity = 8;
        try {
            Object rawQty = body.containsKey("stockQuantity") ? body.get("stockQuantity") : body.getOrDefault("quantity", "8");
            quantity = Math.max(0, Integer.parseInt(String.valueOf(rawQty)));
        } catch (NumberFormatException ignored) {}

        Product p = new Product();
        p.name = rawTitle;
        p.title = rawTitle;
        p.price = price;
        p.category = category;
        p.description = description;
        p.image = image;
        p.stockQuantity = quantity;
        p.quantity = quantity;
        p.stock = quantity;
        p.lowStock = quantity < LOW_STOCK_THRESHOLD;
        p.addedByName = actor.name;
        p.addedByColor = actor.avatarColor;
        p.addedByEmail = actor.email;
        p.official = false;
        p.lastRestockedAt = System.currentTimeMillis();
        p.lastUpdatedBy = actor.name;

        Product created = store.addProduct(p);
        return syncProductToRepository(created);
    }

    public ProductEntity updateProduct(int id, User actor, Map<String, Object> body) {
        Product p = store.findProduct(id);
        if (p == null || p.takenDown) return null;

        if (body.containsKey("name") || body.containsKey("title")) {
            String nextName = String.valueOf(body.getOrDefault("name", body.getOrDefault("title", p.title))).trim();
            if (!nextName.isEmpty()) {
                p.setName(nextName);
            }
        }
        if (body.containsKey("category")) {
            String nextCategory = String.valueOf(body.get("category")).trim();
            if (!nextCategory.isEmpty()) {
                p.setCategory(nextCategory);
            }
        }
        if (body.containsKey("description")) {
            p.setDescription(String.valueOf(body.get("description")).trim());
        }
        if (body.containsKey("image")) {
            String nextImage = String.valueOf(body.get("image")).trim();
            if (!nextImage.isEmpty()) {
                p.setImage(nextImage);
            }
        }
        if (body.containsKey("price")) {
            try {
                double nextPrice = Double.parseDouble(String.valueOf(body.get("price")));
                if (nextPrice > 0) {
                    p.setPrice(roundMoney(nextPrice));
                }
            } catch (NumberFormatException ignored) {}
        }
        if (body.containsKey("stockQuantity") || body.containsKey("quantity") || body.containsKey("stock")) {
            Object rawQty = body.containsKey("stockQuantity")
                    ? body.get("stockQuantity")
                    : (body.containsKey("quantity") ? body.get("quantity") : body.get("stock"));
            try {
                int nextQty = Math.max(0, Integer.parseInt(String.valueOf(rawQty)));
                p.setStockQuantity(nextQty);
            } catch (NumberFormatException ignored) {}
        }
        if (actor != null) {
            p.setLastUpdatedBy(actor.name);
        }
        p.syncPersistenceState();
        store.save();
        return syncProductToRepository(p);
    }

    public ProductEntity updateProductStock(int id, int stockQuantity, String actorName) {
        Product p = store.findProduct(id);
        if (p == null || p.takenDown) return null;
        int nextQty = Math.max(0, stockQuantity);
        boolean nextLowStock = nextQty < LOW_STOCK_THRESHOLD;
        long now = System.currentTimeMillis();
        String updatedBy = (actorName != null && !actorName.isBlank()) ? actorName : p.lastUpdatedBy;
        p.setStockQuantity(nextQty);
        p.setLastRestockedAt(now);
        p.setLastUpdatedBy(updatedBy);
        p.syncPersistenceState();
        store.save();
        if (productRepository != null) {
            try {
                productRepository.updateStockQuantity(id, nextQty, nextLowStock, now, updatedBy);
            } catch (Exception ignored) {}
        }
        return syncProductToRepository(p);
    }

    public boolean takeDownProduct(int id) {
        Product p = store.findProduct(id);
        if (p == null) return false;
        p.takenDown = true;
        store.save();
        if (productRepository != null) {
            try {
                productRepository.softDeleteById(id);
            } catch (Exception ignored) {}
        }
        syncProductToRepository(p);
        return true;
    }
}
