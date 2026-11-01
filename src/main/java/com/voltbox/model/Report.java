package com.voltbox.model;

public class Report {
    public int id;
    public int productId;
    public String productTitle;
    public String reporterName;
    public String reporterEmail;
    public String reason;
    public String note;
    public String status = "open";
    public long createdAt;
}
