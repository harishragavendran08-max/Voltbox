package com.voltbox.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Aggregate entity representing a user's shopping cart, including line items,
 * Rig Builder 4-slot compatibility bundle status, promo discounts, tax, and total.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Cart {
    private String userEmail;
    private Map<String, Integer> rawCart = new LinkedHashMap<>();
    private List<CartItem> items = new ArrayList<>();
    private int count;
    private double subtotal;
    private double rigDiscount;
    private double promoDiscount;
    private double discountTotal;
    private double discountedSubtotal;
    private double taxRate = 0.0825;
    private double tax;
    private double total;
    private String appliedPromo;
    private RigBundleState rigBundle;
    private PowerEstimateState powerEstimate;
    private long updatedAt;

    public static class RigBundleState {
        public boolean hasCpu;
        public boolean hasGpu;
        public boolean hasMotherboard;
        public boolean hasStorage;
        public int completedCoreCount;
        public boolean qualifiesForBundle;
        public double discountRate;
    }

    public static class PowerEstimateState {
        public int baseSystemWatts;
        public int componentsWatts;
        public int estimatedPeakWatts;
        public int recommendedPsuWatts;
        public String psuTierLabel;
        public int loadPercentage;
        public String headroomStatus;
        public int activeComponentCount;
        public int thermalBtuPerHour;
    }

    public Cart() {}

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public Map<String, Integer> getRawCart() { return rawCart; }
    public void setRawCart(Map<String, Integer> rawCart) { this.rawCart = rawCart; }

    public List<CartItem> getItems() { return items; }
    public void setItems(List<CartItem> items) { this.items = items; }

    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }

    public double getSubtotal() { return subtotal; }
    public void setSubtotal(double subtotal) { this.subtotal = subtotal; }

    public double getRigDiscount() { return rigDiscount; }
    public void setRigDiscount(double rigDiscount) { this.rigDiscount = rigDiscount; }

    public double getPromoDiscount() { return promoDiscount; }
    public void setPromoDiscount(double promoDiscount) { this.promoDiscount = promoDiscount; }

    public double getDiscountTotal() { return discountTotal; }
    public void setDiscountTotal(double discountTotal) { this.discountTotal = discountTotal; }

    public double getDiscountedSubtotal() { return discountedSubtotal; }
    public void setDiscountedSubtotal(double discountedSubtotal) { this.discountedSubtotal = discountedSubtotal; }

    public double getTaxRate() { return taxRate; }
    public void setTaxRate(double taxRate) { this.taxRate = taxRate; }

    public double getTax() { return tax; }
    public void setTax(double tax) { this.tax = tax; }

    public double getTotal() { return total; }
    public void setTotal(double total) { this.total = total; }

    public String getAppliedPromo() { return appliedPromo; }
    public void setAppliedPromo(String appliedPromo) { this.appliedPromo = appliedPromo; }

    public RigBundleState getRigBundle() { return rigBundle; }
    public void setRigBundle(RigBundleState rigBundle) { this.rigBundle = rigBundle; }

    public PowerEstimateState getPowerEstimate() { return powerEstimate; }
    public void setPowerEstimate(PowerEstimateState powerEstimate) { this.powerEstimate = powerEstimate; }

    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
}
