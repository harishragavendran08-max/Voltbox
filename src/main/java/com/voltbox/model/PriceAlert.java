package com.voltbox.model;

/**
 * Represents a user-defined 'Notify Me' price drop alert subscription on a product.
 */
public class PriceAlert {
    public String id;
    public int productId;
    public String productTitle;
    public String sku;
    public String email;
    public double targetPrice;
    public double priceAtCreation;
    public long createdAt;
    public boolean triggered;
    public Long triggeredAt;
    public Double triggeredPrice;
}
