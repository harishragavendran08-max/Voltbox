package com.voltbox.controller;

import com.voltbox.CommunitySocket;
import com.voltbox.Store;
import com.voltbox.entity.InventoryItem;
import com.voltbox.entity.ProductEntity;
import com.voltbox.model.User;
import com.voltbox.service.InventoryService;
import com.voltbox.service.ProductService;
import com.voltbox.validation.ProductValidationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
    private final Store store;
    private final InventoryService inventoryService;
    private final ProductService productService;
    private final CommunitySocket socket;

    public InventoryController(
            Store store,
            InventoryService inventoryService,
            ProductService productService,
            CommunitySocket socket) {
        this.store = store;
        this.inventoryService = inventoryService;
        this.productService = productService;
        this.socket = socket;
    }

    private User authUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        return store.findByToken(authHeader.substring("Bearer ".length()).trim());
    }

    @GetMapping
    public ResponseEntity<?> getInventorySummary() {
        return ResponseEntity.ok(inventoryService.getInventorySummary());
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<InventoryItem>> getLowStockItems() {
        return ResponseEntity.ok(inventoryService.listLowStockInventory());
    }

    @GetMapping("/{productId}")
    public ResponseEntity<?> getProductInventory(@PathVariable("productId") int productId) {
        InventoryItem item = inventoryService.getInventoryForProduct(productId);
        if (item == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("ok", false, "message", "Inventory record not found."));
        }
        return ResponseEntity.ok(item);
    }

    @ExceptionHandler(ProductValidationException.class)
    public ResponseEntity<Map<String, Object>> handleProductValidationException(ProductValidationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.toResponsePayload());
    }

    @PostMapping("/{productId}/restock")
    public ResponseEntity<?> restockInventory(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable("productId") int productId,
            @RequestBody(required = false) Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "You're not signed in."));
        }

        Object rawAmount = (body != null && body.containsKey("amount")) ? body.get("amount") : Integer.valueOf(3);
        String reason = body != null && body.get("reason") != null
                ? String.valueOf(body.get("reason"))
                : "Warehouse restock";

        InventoryItem beforeItem = inventoryService.getInventoryForProduct(productId);
        int prevQty = beforeItem != null ? beforeItem.getQuantity() : 0;

        ProductEntity enriched = inventoryService.restockProduct(productId, rawAmount, u.name, reason);
        if (enriched == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("ok", false, "message", "Product not found."));
        }

        int added = enriched.getStockQuantity() - prevQty;
        InventoryItem inventoryItem = inventoryService.getInventoryForProduct(productId);
        socket.broadcastToAll(Map.of(
                "type", "product-restocked",
                "product", enriched,
                "added", added,
                "actor", u.name
        ));
        socket.broadcastToAll(Map.of(
                "type", "activity-feed",
                "message", String.format("%s restocked +%d units of %s", u.name, added, enriched.getTitle()),
                "timestamp", System.currentTimeMillis()
        ));

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "product", enriched,
                "inventory", inventoryItem
        ));
    }

    @PatchMapping("/{productId}")
    public ResponseEntity<?> adjustInventory(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable("productId") int productId,
            @RequestBody Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "You're not signed in."));
        }

        Object rawTarget = null;
        if (body != null) {
            if (body.containsKey("stockQuantity")) rawTarget = body.get("stockQuantity");
            else if (body.containsKey("quantity")) rawTarget = body.get("quantity");
            else if (body.containsKey("stock")) rawTarget = body.get("stock");
        }
        Object rawDelta = (body != null && body.containsKey("delta")) ? body.get("delta") : null;
        String reason = (body != null && body.get("reason") != null)
                ? String.valueOf(body.get("reason"))
                : "Manual stock adjustment";

        InventoryItem beforeItem = inventoryService.getInventoryForProduct(productId);
        int prevQty = beforeItem != null ? beforeItem.getQuantity() : 0;

        InventoryItem updatedItem = inventoryService.adjustStock(productId, rawTarget, rawDelta, u.name, reason);
        if (updatedItem == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("ok", false, "message", "Product not found."));
        }

        ProductEntity enriched = productService.findEnrichedProduct(productId);
        if (enriched != null) {
            socket.broadcastToAll(Map.of(
                    "type", "product-restocked",
                    "product", enriched,
                    "added", updatedItem.getQuantity() - prevQty,
                    "actor", u.name
            ));
        }

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "inventory", updatedItem,
                "product", enriched
        ));
    }
}
