package com.voltbox.entity;

/**
 * Audit transaction entity recording restocks, checkout deductions, and manual
 * stock adjustments in the Voltbox inventory ledger.
 */
public class InventoryTransaction {
    private String id;
    private int productId;
    private String sku;
    private String productTitle;
    private String type; // "RESTOCK", "CHECKOUT_DEDUCTION", "MANUAL_ADJUSTMENT"
    private int delta;
    private int previousStock;
    private int newStock;
    private String actorName;
    private String reason;
    private long timestamp;

    public InventoryTransaction() {}

    public InventoryTransaction(
            String id,
            int productId,
            String sku,
            String productTitle,
            String type,
            int delta,
            int previousStock,
            int newStock,
            String actorName,
            String reason,
            long timestamp) {
        this.id = id;
        this.productId = productId;
        this.sku = sku;
        this.productTitle = productTitle;
        this.type = type;
        this.delta = delta;
        this.previousStock = previousStock;
        this.newStock = newStock;
        this.actorName = actorName;
        this.reason = reason;
        this.timestamp = timestamp;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public int getProductId() { return productId; }
    public void setProductId(int productId) { this.productId = productId; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getProductTitle() { return productTitle; }
    public void setProductTitle(String productTitle) { this.productTitle = productTitle; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public int getDelta() { return delta; }
    public void setDelta(int delta) { this.delta = delta; }

    public int getPreviousStock() { return previousStock; }
    public void setPreviousStock(int previousStock) { this.previousStock = previousStock; }

    public int getNewStock() { return newStock; }
    public void setNewStock(int newStock) { this.newStock = newStock; }

    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
