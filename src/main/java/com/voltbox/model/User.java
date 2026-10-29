/*
 * Decompiled with CFR 0.151.
 * 
 * Could not load the following classes:
 *  com.fasterxml.jackson.annotation.JsonIgnore
 */
package com.voltbox.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class User {
    private int id;
    private String name;
    private String email;
    private String password;
    private String avatarColor;
    private String billEmail;
    private String role = "member";
    private Map<String, Integer> cart = new LinkedHashMap<String, Integer>();
    private List<Order> orders = new ArrayList<Order>();

    public User() {
    }

    public User(int id, String name, String email, String password) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
    }

    @JsonIgnore
    public String getInitial() {
        if (this.name == null || this.name.isBlank()) {
            return "?";
        }
        return this.name.trim().substring(0, 1).toUpperCase();
    }

    public int getId() {
        return this.id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return this.email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return this.password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getAvatarColor() {
        return this.avatarColor;
    }

    public void setAvatarColor(String avatarColor) {
        this.avatarColor = avatarColor;
    }

    public String getBillEmail() {
        return this.billEmail;
    }

    public void setBillEmail(String billEmail) {
        this.billEmail = billEmail;
    }

    public String getRole() {
        return this.role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Map<String, Integer> getCart() {
        return this.cart;
    }

    public void setCart(Map<String, Integer> cart) {
        this.cart = cart;
    }

    public List<Order> getOrders() {
        return this.orders;
    }

    public void setOrders(List<Order> orders) {
        this.orders = orders;
    }
}
