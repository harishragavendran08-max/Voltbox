package com.voltbox.entity;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Entity representing the real-time inventory state for a single hardware SKU
 * in the Voltbox warehouse, tracking on-hand stock, cart reservations, and
 * low-stock threshold alerts.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InventoryItem {
    private int productId;
    private String sku;
    private String title;
    private String category;
    private String componentGroup;
    private int quantity;
    private int reservedQuantity;
    private int availableQuantity;
    private int reorderThreshold = 5;
    private boolean lowStock;
    private boolean criticalStock;
    private String stockStatus; // "IN_STOCK", "LOW_STOCK", "CRITICAL", "OUT_OF_STOCK"
    private double unitPrice;
    private double inventoryValue;
    private long lastRestockedAt;
    private String lastUpdatedBy;

    public InventoryItem() {}

    public int getProductId() { return productId; }
    public void setProductId(int productId) { this.productId = productId; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getComponentGroup() { return componentGroup; }
    public void setComponentGroup(String componentGroup) { this.componentGroup = componentGroup; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public int getReservedQuantity() { return reservedQuantity; }
    public void setReservedQuantity(int reservedQuantity) { this.reservedQuantity = reservedQuantity; }

    public int getAvailableQuantity() { return availableQuantity; }
    public void setAvailableQuantity(int availableQuantity) { this.availableQuantity = availableQuantity; }

    public int getReorderThreshold() { return reorderThreshold; }
    public void setReorderThreshold(int reorderThreshold) { this.reorderThreshold = reorderThreshold; }

    public boolean isLowStock() { return lowStock; }
    public void setLowStock(boolean lowStock) { this.lowStock = lowStock; }

    public boolean isCriticalStock() { return criticalStock; }
    public void setCriticalStock(boolean criticalStock) { this.criticalStock = criticalStock; }

    public String getStockStatus() { return stockStatus; }
    public void setStockStatus(String stockStatus) { this.stockStatus = stockStatus; }

    public double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(double unitPrice) { this.unitPrice = unitPrice; }

    public double getInventoryValue() { return inventoryValue; }
    public void setInventoryValue(double inventoryValue) { this.inventoryValue = inventoryValue; }

    public long getLastRestockedAt() { return lastRestockedAt; }
    public void setLastRestockedAt(long lastRestockedAt) { this.lastRestockedAt = lastRestockedAt; }

    public String getLastUpdatedBy() { return lastUpdatedBy; }
    public void setLastUpdatedBy(String lastUpdatedBy) { this.lastUpdatedBy = lastUpdatedBy; }
}
