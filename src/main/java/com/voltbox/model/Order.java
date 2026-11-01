package com.voltbox.model;

import java.util.ArrayList;
import java.util.List;

public class Order {
    public String id;
    public long placedAt;
    public int count;
    public double subtotal;
    public double rigDiscount;
    public double promoDiscount;
    public double discountTotal;
    public String promoCode;
    public double tax;
    public double total;
    public List<Line> lines = new ArrayList<>();
    public String shippingName;
    public String shippingAddress;
    public String paymentMethod;
    public String status = "Paid";
    public double amountPaid;

    public static class Line {
        public int productId;
        public String title;
        public String image;
        public double price;
        public int qty;
    }
}
