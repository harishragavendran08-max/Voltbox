package com.voltbox.entity;

/**
 * Entity representing a single line item inside a user's Voltbox shopping cart.
 */
public class CartItem {
    private int productId;
    private String sku;
    private String title;
    private String category;
    private String componentGroup;
    private String image;
    private double unitPrice;
    private int quantity;
    private int availableStock;
    private boolean lowStock;
    private double lineSubtotal;

    public CartItem() {}

    public CartItem(
            int productId,
            String sku,
            String title,
            String category,
            String componentGroup,
            String image,
            double unitPrice,
            int quantity,
            int availableStock,
            boolean lowStock,
            double lineSubtotal) {
        this.productId = productId;
        this.sku = sku;
        this.title = title;
        this.category = category;
        this.componentGroup = componentGroup;
        this.image = image;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.availableStock = availableStock;
        this.lowStock = lowStock;
        this.lineSubtotal = lineSubtotal;
    }

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

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(double unitPrice) { this.unitPrice = unitPrice; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public int getAvailableStock() { return availableStock; }
    public void setAvailableStock(int availableStock) { this.availableStock = availableStock; }

    public boolean isLowStock() { return lowStock; }
    public void setLowStock(boolean lowStock) { this.lowStock = lowStock; }

    public double getLineSubtotal() { return lineSubtotal; }
    public void setLineSubtotal(double lineSubtotal) { this.lineSubtotal = lineSubtotal; }
}
