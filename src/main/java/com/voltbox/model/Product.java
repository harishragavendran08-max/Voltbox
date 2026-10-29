/*
 * Decompiled with CFR 0.151.
 */
package com.voltbox.model;

public class Product {
    private int id;
    private String title;
    private double price;
    private String description;
    private String category;
    private String image;
    private double ratingRate;
    private int ratingCount;
    private String addedByName;
    private String addedByColor;
    private String addedByEmail;
    private boolean official;
    private long createdAt;
    private boolean takenDown;

    public Product() {
    }

    public Product(int id, String title, double price, String description, String category, String image, double ratingRate, int ratingCount) {
        this.id = id;
        this.title = title;
        this.price = price;
        this.description = description;
        this.category = category;
        this.image = image;
        this.ratingRate = ratingRate;
        this.ratingCount = ratingCount;
    }

    public int getId() {
        return this.id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getTitle() {
        return this.title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public double getPrice() {
        return this.price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public String getDescription() {
        return this.description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return this.category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getImage() {
        return this.image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public double getRatingRate() {
        return this.ratingRate;
    }

    public void setRatingRate(double ratingRate) {
        this.ratingRate = ratingRate;
    }

    public int getRatingCount() {
        return this.ratingCount;
    }

    public void setRatingCount(int ratingCount) {
        this.ratingCount = ratingCount;
    }

    public String getAddedByName() {
        return this.addedByName;
    }

    public void setAddedByName(String addedByName) {
        this.addedByName = addedByName;
    }

    public String getAddedByColor() {
        return this.addedByColor;
    }

    public void setAddedByColor(String addedByColor) {
        this.addedByColor = addedByColor;
    }

    public String getAddedByEmail() {
        return this.addedByEmail;
    }

    public void setAddedByEmail(String addedByEmail) {
        this.addedByEmail = addedByEmail;
    }

    public boolean isOfficial() {
        return this.official;
    }

    public void setOfficial(boolean official) {
        this.official = official;
    }

    public long getCreatedAt() {
        return this.createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isTakenDown() {
        return this.takenDown;
    }

    public void setTakenDown(boolean takenDown) {
        this.takenDown = takenDown;
    }
}
