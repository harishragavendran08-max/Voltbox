/*
 * Decompiled with CFR 0.151.
 * 
 * Could not load the following classes:
 *  com.fasterxml.jackson.core.type.TypeReference
 *  com.fasterxml.jackson.databind.ObjectMapper
 *  com.fasterxml.jackson.databind.SerializationFeature
 *  jakarta.annotation.PostConstruct
 *  org.springframework.stereotype.Component
 */
package com.voltbox;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.voltbox.model.Application;
import com.voltbox.model.Product;
import com.voltbox.model.Report;
import com.voltbox.model.User;
import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

@Component
public class Store {
    private static final File FILE = new File("voltbox-data.json");
    private static final String SEED_PRODUCTS = "/seed-products.json";
    private static final String BRAND_COLOR = "#ffd23f";
    private static final String[] COLORS = new String[]{"#ffd23f", "#4dabf7", "#51cf66", "#ff6b6b", "#cc5de8", "#ff922b", "#20c997", "#f06595"};
    private final ObjectMapper json = new ObjectMapper();
    private List<User> users = new ArrayList<User>();
    private int nextId = 1;
    private List<Product> products = new ArrayList<Product>();
    private int nextProductId = 1;
    private List<Application> applications = new ArrayList<Application>();
    private int nextApplicationId = 1;
    private List<Report> reports = new ArrayList<Report>();
    private int nextReportId = 1;
    private Map<String, String> sessions = new LinkedHashMap<String, String>();

    @PostConstruct
    public void load() {
        this.json.enable(SerializationFeature.INDENT_OUTPUT);
        if (!FILE.exists()) {
            this.seed();
            return;
        }
        try {
            Data data = this.json.readValue(FILE, Data.class);
            this.users = data.users == null ? new ArrayList<>() : data.users;
            this.sessions = data.sessions == null ? new LinkedHashMap<>() : data.sessions;
            this.products = data.products == null ? new ArrayList<>() : data.products;
            this.applications = data.applications == null ? new ArrayList<>() : data.applications;
            this.reports = data.reports == null ? new ArrayList<>() : data.reports;
            this.nextId = Math.max(data.nextId, 1);
            this.nextProductId = Math.max(data.nextProductId, 1);
            this.nextApplicationId = Math.max(data.nextApplicationId, 1);
            this.nextReportId = Math.max(data.nextReportId, 1);
        }
        catch (IOException e) {
            throw new IllegalStateException("couldn't read " + FILE.getName() + " \u2014 fix the json or delete the file to start over. (" + e.getMessage() + ")", e);
        }
    }

    public synchronized void save() {
        try {
            Data data = new Data();
            data.users = this.users;
            data.sessions = this.sessions;
            data.products = this.products;
            data.applications = this.applications;
            data.reports = this.reports;
            data.nextId = this.nextId;
            data.nextProductId = this.nextProductId;
            data.nextApplicationId = this.nextApplicationId;
            data.nextReportId = this.nextReportId;
            File tmp = new File(FILE.getAbsoluteFile().getParentFile(), FILE.getName() + ".tmp");
            this.json.writeValue(tmp, (Object)data);
            Files.move(tmp.toPath(), FILE.toPath(), StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        }
        catch (IOException e) {
            throw new IllegalStateException("couldn't write " + FILE.getName(), e);
        }
    }

    private void seed() {
        this.users = new ArrayList<User>();
        this.sessions = new LinkedHashMap<String, String>();
        this.products = new ArrayList<Product>();
        this.applications = new ArrayList<Application>();
        this.reports = new ArrayList<Report>();
        this.nextId = 1;
        this.nextProductId = 1;
        this.nextApplicationId = 1;
        this.nextReportId = 1;
        User harish = this.add("Harish", "harish@voltbox.test", "Harish123");
        harish.setRole("moderator");
        this.seedProducts();
        this.save();
    }

    private void seedProducts() {
        try (InputStream in = this.getClass().getResourceAsStream(SEED_PRODUCTS)) {
            if (in == null) {
                System.err.println("voltbox: /seed-products.json not found \u2014 starting with no catalog.");
                return;
            }
            List<Product> seeded = this.json.readValue(in, new TypeReference<List<Product>>() {});
            for (Product p : seeded) {
                p.setId(this.nextProductId++);
                p.setOfficial(true);
                p.setAddedByName("Voltbox");
                p.setAddedByColor(BRAND_COLOR);
                this.products.add(p);
            }
        } catch (IOException e) {
            throw new IllegalStateException("couldn't read the built-in catalog (/seed-products.json)", e);
        }
    }

    public String startSession(User user) {
        String token = UUID.randomUUID().toString();
        this.sessions.put(token, user.getEmail());
        this.save();
        return token;
    }

    public User findByToken(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        String email = this.sessions.get(token);
        if (email == null) {
            return null;
        }
        return this.findByEmail(email);
    }

    public void endSession(String token) {
        if (token == null) {
            return;
        }
        if (this.sessions.remove(token) != null) {
            this.save();
        }
    }

    public List<User> getUsers() {
        return this.users;
    }

    public User findByEmail(String email) {
        if (email == null) {
            return null;
        }
        for (User u : this.users) {
            if (!u.getEmail().equalsIgnoreCase(email)) continue;
            return u;
        }
        return null;
    }

    @CacheEvict(value = "users", allEntries = true)
    public User add(String name, String email, String password) {
        User user = new User(this.nextId, name, email, password);
        user.setAvatarColor(COLORS[(this.nextId - 1) % COLORS.length]);
        ++this.nextId;
        this.users.add(user);
        this.save();
        return user;
    }

    @Cacheable(value = "products", key = "'all'")
    public List<Product> getProducts() {
        return this.products;
    }

    public Product findProduct(int id) {
        for (Product p : this.products) {
            if (p.getId() != id) continue;
            return p;
        }
        return null;
    }

    public Product addProduct(Product product) {
        product.setId(this.nextProductId++);
        product.setCreatedAt(System.currentTimeMillis());
        this.products.add(product);
        this.save();
        return product;
    }

    public List<Application> getApplications() {
        return this.applications;
    }

    public Application findApplication(int id) {
        for (Application a : this.applications) {
            if (a.getId() != id) continue;
            return a;
        }
        return null;
    }

    public Application addApplication(Application application) {
        application.setId(this.nextApplicationId++);
        this.applications.add(application);
        this.save();
        return application;
    }

    public List<Report> getReports() {
        return this.reports;
    }

    public Report findReport(int id) {
        for (Report r : this.reports) {
            if (r.getId() != id) continue;
            return r;
        }
        return null;
    }

    public Report addReport(Report report) {
        report.setId(this.nextReportId++);
        this.reports.add(report);
        this.save();
        return report;
    }

    public static class Data {
        public int nextId = 1;
        public int nextProductId = 1;
        public int nextApplicationId = 1;
        public int nextReportId = 1;
        public List<User> users = new ArrayList<User>();
        public Map<String, String> sessions = new LinkedHashMap<String, String>();
        public List<Product> products = new ArrayList<Product>();
        public List<Application> applications = new ArrayList<Application>();
        public List<Report> reports = new ArrayList<Report>();
    }
}
