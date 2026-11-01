package com.voltbox.controller;

import com.voltbox.CommunitySocket;
import com.voltbox.Store;
import com.voltbox.entity.InventoryItem;
import com.voltbox.entity.ProductEntity;
import com.voltbox.model.Product;
import com.voltbox.model.User;
import com.voltbox.repository.ProductRepository;
import com.voltbox.service.InventoryService;
import com.voltbox.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Spring Boot REST Controller mapped to {@code /api/products} for handling GET,
 * POST, PUT, PATCH, and DELETE requests for retrieving all products, individual
 * product details by ID or SKU, and real-time inventory updates backed by
 * {@link ProductRepository}, {@link ProductService}, and {@link InventoryService}.
 */
@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {
    private final Store store;
    private final ProductRepository productRepository;
    private final ProductService productService;
    private final InventoryService inventoryService;
    private final CommunitySocket socket;

    @Autowired
    public ProductController(
            Store store,
            @Autowired(required = false) ProductRepository productRepository,
            ProductService productService,
            InventoryService inventoryService,
            CommunitySocket socket) {
        this.store = store;
        this.productRepository = productRepository;
        this.productService = productService;
        this.inventoryService = inventoryService;
        this.socket = socket;
    }

    private User authUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        return store.findByToken(authHeader.substring("Bearer ".length()).trim());
    }

    private boolean canContribute(User u) {
        return u != null && ("contributor".equals(u.role) || "moderator".equals(u.role));
    }

    /**
     * GET /api/products
     * Retrieves all active products from the JPA repository / catalog with optional
     * category, component group, keyword search, and low-stock filtering.
     */
    @GetMapping
    public ResponseEntity<List<ProductEntity>> getAllProducts(
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "group", required = false) String group,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "lowStock", required = false) Boolean lowStock) {
        boolean hasFilters = (category != null && !category.isBlank())
                || (group != null && !group.isBlank())
                || (search != null && !search.isBlank())
                || Boolean.TRUE.equals(lowStock);

        if (!hasFilters && productRepository != null && productRepository.count() > 0) {
            List<ProductEntity> entities = productRepository.findByTakenDownFalseOrderByIdAsc()
                    .stream()
                    .map(productService::hydrateTransientTelemetry)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(entities);
        }

        List<ProductEntity> products = productService.listActiveProducts(category, group, search, lowStock);
        return ResponseEntity.ok(products);
    }

    /**
     * GET /api/products/{id}
     * Retrieves individual product details by ID via ProductRepository and ProductService.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable("id") Integer id) {
        if (id == null || id <= 0) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "Invalid product ID."));
        }
        if (productRepository != null) {
            Optional<ProductEntity> repoHit = productRepository.findByIdAndTakenDownFalse(id);
            if (repoHit.isPresent()) {
                return ResponseEntity.ok(productService.hydrateTransientTelemetry(repoHit.get()));
            }
        }
        ProductEntity product = productService.findEnrichedProduct(id);
        if (product == null || product.isTakenDown()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("ok", false, "message", "Product not found."));
        }
        return ResponseEntity.ok(product);
    }

    /**
     * GET /api/products/low-stock
     * Queries the JPA repository for active products below the low-stock threshold (< 5 units).
     */
    @GetMapping("/low-stock")
    public ResponseEntity<List<ProductEntity>> getLowStockProducts() {
        if (productRepository != null && productRepository.count() > 0) {
            List<ProductEntity> lowStock = productRepository
                    .findByLowStockTrueAndTakenDownFalseOrderByStockQuantityAsc()
                    .stream()
                    .map(productService::hydrateTransientTelemetry)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(lowStock);
        }
        return ResponseEntity.ok(productService.listActiveProducts(null, null, null, true));
    }

    /**
     * GET /api/products/sku/{sku}
     * Retrieves a single product by its unique hardware SKU via ProductRepository.
     */
    @GetMapping("/sku/{sku}")
    public ResponseEntity<?> getProductBySku(@PathVariable("sku") String sku) {
        if (productRepository != null && sku != null && !sku.isBlank()) {
            Optional<ProductEntity> repoHit = productRepository.findBySkuIgnoreCase(sku.trim());
            if (repoHit.isPresent() && !repoHit.get().isTakenDown()) {
                return ResponseEntity.ok(productService.hydrateTransientTelemetry(repoHit.get()));
            }
        }
        ProductEntity product = productService.findEnrichedProductBySku(sku);
        if (product == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("ok", false, "message", "Product SKU not found."));
        }
        return ResponseEntity.ok(product);
    }

    /**
     * GET /api/products/{id}/inventory
     * Retrieves the product entity alongside its warehouse inventory telemetry.
     */
    @GetMapping("/{id}/inventory")
    public ResponseEntity<?> getProductInventory(@PathVariable("id") Integer id) {
        ProductEntity product = productService.findEnrichedProduct(id);
        InventoryItem inventory = inventoryService.getInventoryForProduct(id);
        if (product == null || inventory == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("ok", false, "message", "Product inventory not found."));
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("ok", true);
        payload.put("product", product);
        payload.put("inventory", inventory);
        return ResponseEntity.ok(payload);
    }

    /**
     * POST /api/products
     * Creates and persists a new ProductEntity in the JPA repository and Store,
     * then broadcasts the new listing over WebSocket.
     */
    @PostMapping
    public ResponseEntity<?> createProduct(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "You're not signed in."));
        }
        if (!canContribute(u)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("ok", false, "message", "Only contributors can add listings."));
        }

        String title = String.valueOf(body.getOrDefault("title", body.getOrDefault("name", ""))).trim();
        String category = String.valueOf(body.getOrDefault("category", "")).trim();
        String image = String.valueOf(body.getOrDefault("image", "")).trim();
        if (title.isEmpty() || category.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "A listing needs at least a title and a category."));
        }
        if (image.isEmpty() || (!image.startsWith("http") && !image.startsWith("/"))) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "Add a valid image link for the listing."));
        }

        ProductEntity enriched = productService.createProduct(u, body);
        if (productRepository != null && enriched != null) {
            try {
                productRepository.save(enriched);
            } catch (Exception ignored) {}
        }
        socket.broadcastToAll(Map.of("type", "product-added", "product", enriched));
        socket.broadcastToAll(Map.of(
                "type", "activity-feed",
                "message", String.format("%s listed %s ($%.2f)", u.name, enriched.getTitle(), enriched.getPrice()),
                "timestamp", System.currentTimeMillis()
        ));
        return ResponseEntity.ok(enriched);
    }

    /**
     * POST /api/products/{id}/inventory
     * Handles POST requests for inventory updates on a product (either setting an
     * absolute `stockQuantity`/`quantity` or applying a `delta`/`amount` change),
     * persists the updated entity to the JPA repository, and broadcasts the update.
     */
    @PostMapping("/{id}/inventory")
    public ResponseEntity<?> updateProductInventoryPost(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable("id") Integer id,
            @RequestBody(required = false) Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "You're not signed in."));
        }

        Integer targetQty = null;
        Integer delta = null;
        if (body != null) {
            Object rawTarget = body.containsKey("stockQuantity")
                    ? body.get("stockQuantity")
                    : (body.containsKey("quantity") ? body.get("quantity") : body.get("stock"));
            if (rawTarget != null) {
                try {
                    targetQty = Math.max(0, Integer.parseInt(String.valueOf(rawTarget)));
                } catch (NumberFormatException ignored) {}
            }
            Object rawDelta = body.containsKey("delta") ? body.get("delta") : body.get("amount");
            if (rawDelta != null) {
                try {
                    delta = Integer.parseInt(String.valueOf(rawDelta));
                } catch (NumberFormatException ignored) {}
            }
        }
        if (targetQty == null && delta == null) {
            delta = 3;
        }
        String reason = (body != null && body.get("reason") != null)
                ? String.valueOf(body.get("reason"))
                : "Inventory update via ProductController";

        InventoryItem updatedItem = inventoryService.adjustStock(id, targetQty, delta, u.name, reason);
        if (updatedItem == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("ok", false, "message", "Product not found."));
        }

        ProductEntity enriched = productService.findEnrichedProduct(id);
        if (productRepository != null && enriched != null) {
            try {
                productRepository.save(enriched);
            } catch (Exception ignored) {}
        }

        socket.broadcastToAll(Map.of(
                "type", "product-restocked",
                "product", enriched,
                "added", delta != null ? delta : 0,
                "actor", u.name
        ));

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("ok", true);
        res.put("product", enriched);
        res.put("inventory", updatedItem);
        return ResponseEntity.ok(res);
    }

    /**
     * POST /api/products/{id}/restock
     * Increments product stock quantity, syncs with ProductRepository, and broadcasts
     * a real-time restock event to connected clients.
     */
    @PostMapping("/{id}/restock")
    public ResponseEntity<?> restockProduct(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable("id") Integer id,
            @RequestBody(required = false) Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "You're not signed in."));
        }

        int amount = 3;
        if (body != null && body.get("amount") != null) {
            try {
                amount = Math.max(1, Math.min(20, Integer.parseInt(String.valueOf(body.get("amount")))));
            } catch (NumberFormatException ignored) {}
        }
        String reason = body != null && body.get("reason") != null ? String.valueOf(body.get("reason")) : "Catalog restock";

        ProductEntity enriched = inventoryService.restockProduct(id, amount, u.name, reason);
        if (enriched == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("ok", false, "message", "Couldn't find that listing."));
        }
        if (productRepository != null) {
            try {
                productRepository.save(enriched);
            } catch (Exception ignored) {}
        }

        socket.broadcastToAll(Map.of(
                "type", "product-restocked",
                "product", enriched,
                "added", amount,
                "actor", u.name
        ));
        socket.broadcastToAll(Map.of(
                "type", "activity-feed",
                "message", String.format("%s restocked +%d units of %s", u.name, amount, enriched.getTitle()),
                "timestamp", System.currentTimeMillis()
        ));
        return ResponseEntity.ok(enriched);
    }

    /**
     * PUT /api/products/{id}
     * Updates product metadata and stock quantity, persisting changes to ProductRepository.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable("id") Integer id,
            @RequestBody Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "You're not signed in."));
        }

        Product existing = store.findProduct(id);
        if (existing == null || existing.takenDown) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("ok", false, "message", "Product not found."));
        }

        boolean mine = existing.addedByEmail != null && existing.addedByEmail.equalsIgnoreCase(u.email);
        if (!"moderator".equals(u.role) && !mine) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("ok", false, "message", "You can only update your own listings."));
        }

        ProductEntity updated = productService.updateProduct(id, u, body);
        socket.broadcastToAll(Map.of("type", "product-restocked", "product", updated, "actor", u.name));
        return ResponseEntity.ok(updated);
    }

    /**
     * PATCH /api/products/{id}/stock
     * Updates stockQuantity directly and persists to ProductRepository.
     */
    @PatchMapping("/{id}/stock")
    public ResponseEntity<?> updateProductStock(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable("id") Integer id,
            @RequestBody Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "You're not signed in."));
        }

        Object rawStock = body.containsKey("stockQuantity")
                ? body.get("stockQuantity")
                : body.getOrDefault("quantity", body.get("stock"));
        if (rawStock == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "Provide stockQuantity or quantity."));
        }

        int nextStock;
        try {
            nextStock = Math.max(0, Integer.parseInt(String.valueOf(rawStock)));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "stockQuantity must be a valid integer."));
        }

        ProductEntity updated = productService.updateProductStock(id, nextStock, u.name);
        if (updated == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("ok", false, "message", "Product not found."));
        }
        socket.broadcastToAll(Map.of("type", "product-restocked", "product", updated, "actor", u.name));
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/products/{id}
     * Soft-deletes (takes down) a product listing by ID.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable("id") Integer id) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));
        }

        Product p = store.findProduct(id);
        if (p == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("ok", false, "message", "Couldn't find that listing."));
        }

        boolean mine = p.addedByEmail != null && p.addedByEmail.equalsIgnoreCase(u.email);
        if (!"moderator".equals(u.role) && !mine) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("ok", false, "message", "You can only take down your own listings."));
        }

        productService.takeDownProduct(id);
        socket.broadcastToAll(Map.of("type", "product-taken-down", "productId", id));
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
