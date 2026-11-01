package com.voltbox.model;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class User {
    public int id;
    public String name;
    public String email;
    public String password;
    public String avatarColor;
    public String billEmail;
    public String role = "member";
    public Map<String, Integer> cart = new LinkedHashMap<>();
    public List<Order> orders = new ArrayList<>();
}
