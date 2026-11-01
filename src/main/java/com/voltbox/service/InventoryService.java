package com.voltbox.service;

import com.voltbox.Store;
import com.voltbox.entity.InventoryItem;
import com.voltbox.entity.InventoryTransaction;
import com.voltbox.entity.ProductEntity;
import com.voltbox.model.Product;
import com.voltbox.model.User;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Service
public class InventoryService {
    public static final int LOW_STOCK_THRESHOLD = 5;
    public static final int CRITICAL_STOCK_THRESHOLD = 2;

    private final Store store;
    private final ProductService productService;
    private final List<InventoryTransaction> transactions = new CopyOnWriteArrayList<>();

    public InventoryService(Store store, ProductService productService) {
        this.store = store;
        this.productService = productService;
    }

    public int computeReservedQuantity(int productId) {
        String key = String.valueOf(productId);
        int reserved = 0;
        for (User u : store.getUsers()) {
            if (u.cart != null) {
                Integer inCart = u.cart.get(key);
                if (inCart != null && inCart > 0) {
                    reserved += inCart;
                }
            }
        }
        return reserved;
    }

    public InventoryItem toInventoryItem(Product p) {
        int qty = productService.resolveQuantity(p);
        int reserved = computeReservedQuantity(p.id);
        int available = qty >= LOW_STOCK_THRESHOLD ? Math.max(0, qty - reserved) : qty;
        boolean lowStock = available < LOW_STOCK_THRESHOLD;
        boolean critical = available <= CRITICAL_STOCK_THRESHOLD;
        String status = available == 0 ? "OUT_OF_STOCK"
                : critical ? "CRITICAL"
                : lowStock ? "LOW_STOCK"
                : "IN_STOCK";

        InventoryItem item = new InventoryItem();
        item.setProductId(p.id);
        item.setSku(productService.computeSku(p));
        item.setTitle(p.title);
        item.setCategory(p.category);
        item.setComponentGroup(productService.classifyComponentGroup(p));
        item.setQuantity(qty);
        item.setReservedQuantity(reserved);
        item.setAvailableQuantity(available);
        item.setReorderThreshold(LOW_STOCK_THRESHOLD);
        item.setLowStock(lowStock);
        item.setCriticalStock(critical);
        item.setStockStatus(status);
        item.setUnitPrice(p.price);
        item.setInventoryValue(ProductService.roundMoney(qty * p.price));
        item.setLastRestockedAt(p.lastRestockedAt > 0 ? p.lastRestockedAt : p.createdAt);
        item.setLastUpdatedBy(p.lastUpdatedBy != null ? p.lastUpdatedBy : (p.addedByName != null ? p.addedByName : "Voltbox"));
        return item;
    }

    public List<InventoryItem> listAllInventory() {
        return store.getProducts().stream()
                .filter(p -> !p.takenDown)
                .map(this::toInventoryItem)
                .collect(Collectors.toList());
    }

    public List<InventoryItem> listLowStockInventory() {
        return listAllInventory().stream()
                .filter(InventoryItem::isLowStock)
                .collect(Collectors.toList());
    }

    public InventoryItem getInventoryForProduct(int productId) {
        Product p = store.findProduct(productId);
        if (p == null || p.takenDown) return null;
        return toInventoryItem(p);
    }

    public Map<String, Object> getInventorySummary() {
        List<InventoryItem> items = listAllInventory();
        int totalSkus = items.size();
        int totalUnits = items.stream().mapToInt(InventoryItem::getQuantity).sum();
        int reservedUnits = items.stream().mapToInt(InventoryItem::getReservedQuantity).sum();
        long lowStockCount = items.stream().filter(InventoryItem::isLowStock).count();
        long criticalCount = items.stream().filter(InventoryItem::isCriticalStock).count();
        long outOfStockCount = items.stream().filter(i -> i.getAvailableQuantity() == 0).count();
        double totalValue = ProductService.roundMoney(
                items.stream().mapToDouble(InventoryItem::getInventoryValue).sum()
        );

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("ok", true);
        summary.put("totalSkus", totalSkus);
        summary.put("totalUnitsInStock", totalUnits);
        summary.put("reservedUnitsInCarts", reservedUnits);
        summary.put("lowStockCount", lowStockCount);
        summary.put("criticalStockCount", criticalCount);
        summary.put("outOfStockCount", outOfStockCount);
        summary.put("totalInventoryValue", totalValue);
        summary.put("items", items);
        summary.put("recentTransactions", transactions.stream().limit(20).collect(Collectors.toList()));
        return summary;
    }

    public synchronized ProductEntity restockProduct(int productId, int amount, String actorName, String reason) {
        Product p = store.findProduct(productId);
        if (p == null || p.takenDown) return null;

        int addQty = Math.max(1, Math.min(50, amount > 0 ? amount : 3));
        int prevQty = productService.resolveQuantity(p);
        int nextQty = prevQty + addQty;
        long now = System.currentTimeMillis();

        p.setStockQuantity(nextQty);
        p.lastRestockedAt = now;
        p.lastUpdatedBy = actorName;
        store.save();

        recordTransaction(p, "RESTOCK", addQty, prevQty, nextQty, actorName,
                reason != null && !reason.isBlank() ? reason : "Manual bench restock");

        return productService.syncProductToRepository(p);
    }

    public synchronized InventoryItem adjustStock(int productId, Integer targetQuantity, Integer delta, String actorName, String reason) {
        Product p = store.findProduct(productId);
        if (p == null || p.takenDown) return null;

        int prevQty = productService.resolveQuantity(p);
        int nextQty;
        if (targetQuantity != null) {
            nextQty = Math.max(0, targetQuantity);
        } else if (delta != null) {
            nextQty = Math.max(0, prevQty + delta);
        } else {
            nextQty = prevQty;
        }

        long now = System.currentTimeMillis();
        p.setStockQuantity(nextQty);
        p.lastRestockedAt = now;
        p.lastUpdatedBy = actorName;
        store.save();
        productService.syncProductToRepository(p);

        recordTransaction(p, "MANUAL_ADJUSTMENT", nextQty - prevQty, prevQty, nextQty, actorName,
                reason != null && !reason.isBlank() ? reason : "Inventory stock adjustment");

        return toInventoryItem(p);
    }

    public synchronized void deductStockForOrder(Product p, int qty, String buyerName, String orderId) {
        int prevQty = productService.resolveQuantity(p);
        int nextQty = Math.max(0, prevQty - Math.max(0, qty));
        p.setStockQuantity(nextQty);
        p.lastUpdatedBy = buyerName;
        productService.syncProductToRepository(p);

        recordTransaction(p, "CHECKOUT_DEDUCTION", -(prevQty - nextQty), prevQty, nextQty, buyerName,
                "Order checkout " + orderId);
    }

    private void recordTransaction(
            Product p,
            String type,
            int delta,
            int prevStock,
            int newStock,
            String actorName,
            String reason) {
        long now = System.currentTimeMillis();
        String txId = String.format("INV-%04X", now & 0xFFFF);
        InventoryTransaction tx = new InventoryTransaction(
                txId,
                p.id,
                productService.computeSku(p),
                p.title,
                type,
                delta,
                prevStock,
                newStock,
                actorName != null ? actorName : "System",
                reason,
                now
        );
        transactions.add(0, tx);
        while (transactions.size() > 50) {
            transactions.remove(transactions.size() - 1);
        }
    }
}
