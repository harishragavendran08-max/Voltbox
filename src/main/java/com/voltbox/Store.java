package com.voltbox;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltbox.model.*;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Component
public class Store {
    private static final File DATA_FILE = new File("voltbox-data.json");
    private static final String BRAND_COLOR = "#ffd23f";
    private static final String[] COLORS = {
        "#ffd23f", "#4dabf7", "#51cf66", "#ff6b6b",
        "#cc5de8", "#ff922b", "#20c997", "#f06595"
    };

    private final ObjectMapper json = new ObjectMapper()
        .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    private List<User> users = new ArrayList<>();
    private int nextId = 1;
    private List<Product> products = new ArrayList<>();
    private int nextProductId = 1;
    private List<Application> applications = new ArrayList<>();
    private int nextApplicationId = 1;
    private List<Report> reports = new ArrayList<>();
    private int nextReportId = 1;
    private List<ChatMessage> messages = new ArrayList<>();
    private int nextMessageId = 1;
    private Map<String, String> sessions = new LinkedHashMap<>();

    public static class Data {
        public int nextId = 1;
        public int nextProductId = 1;
        public int nextApplicationId = 1;
        public int nextReportId = 1;
        public int nextMessageId = 1;
        public List<User> users = new ArrayList<>();
        public Map<String, String> sessions = new LinkedHashMap<>();
        public List<Product> products = new ArrayList<>();
        public List<Application> applications = new ArrayList<>();
        public List<Report> reports = new ArrayList<>();
        public List<ChatMessage> messages = new ArrayList<>();
    }

    @PostConstruct
    public synchronized void load() {
        if (!DATA_FILE.exists()) {
            seed();
            return;
        }
        try {
            Data d = json.readValue(DATA_FILE, Data.class);
            this.users = d.users != null ? d.users : new ArrayList<>();
            this.sessions = d.sessions != null ? d.sessions : new LinkedHashMap<>();
            this.products = d.products != null ? d.products : new ArrayList<>();
            this.applications = d.applications != null ? d.applications : new ArrayList<>();
            this.reports = d.reports != null ? d.reports : new ArrayList<>();
            this.messages = d.messages != null ? d.messages : new ArrayList<>();
            this.nextId = Math.max(d.nextId, 1);
            this.nextProductId = Math.max(d.nextProductId, 1);
            this.nextApplicationId = Math.max(d.nextApplicationId, 1);
            this.nextReportId = Math.max(d.nextReportId, 1);
            this.nextMessageId = Math.max(d.nextMessageId, 1);
        } catch (Exception e) {
            throw new RuntimeException("Couldn't read voltbox-data.json", e);
        }
    }

    public synchronized void save() {
        try {
            Data d = new Data();
            d.nextId = nextId;
            d.nextProductId = nextProductId;
            d.nextApplicationId = nextApplicationId;
            d.nextReportId = nextReportId;
            d.nextMessageId = nextMessageId;
            d.users = users;
            d.sessions = sessions;
            d.products = products;
            d.applications = applications;
            d.reports = reports;
            d.messages = messages;

            File tmp = new File(DATA_FILE.getPath() + ".tmp");
            json.writerWithDefaultPrettyPrinter().writeValue(tmp, d);
            Files.move(tmp.toPath(), DATA_FILE.toPath(), StandardCopyOption.REPLACE_EXISTING);
        } catch (Exception e) {
            throw new RuntimeException("Couldn't save voltbox-data.json", e);
        }
    }

    private void seed() {
        User harish = add("Harish", "harish@voltbox.test", "Harish123");
        harish.role = "moderator";
        sessions.put("ed4a9555-540b-4bb9-a406-b353acded905", harish.email);
        try (InputStream in = getClass().getResourceAsStream("/seed-products.json")) {
            if (in != null) {
                Product[] seeded = json.readValue(in, Product[].class);
                for (Product p : seeded) {
                    p.id = nextProductId++;
                    p.addedByName = "Voltbox";
                    p.addedByColor = BRAND_COLOR;
                    p.official = true;
                    products.add(p);
                }
            }
        } catch (Exception ignored) {}
        save();
    }

    public synchronized String startSession(User u) {
        String token = UUID.randomUUID().toString();
        sessions.put(token, u.email);
        save();
        return token;
    }

    public synchronized User findByToken(String token) {
        if (token == null || token.isBlank()) return null;
        String email = sessions.get(token.trim());
        return email == null ? null : findByEmail(email);
    }

    public synchronized void endSession(String token) {
        if (token != null && sessions.remove(token) != null) save();
    }

    public synchronized User findByEmail(String email) {
        if (email == null) return null;
        for (User u : users) {
            if (u.email.equalsIgnoreCase(email)) return u;
        }
        return null;
    }

    public synchronized User add(String name, String email, String password) {
        User u = new User();
        u.id = nextId;
        u.name = name;
        u.email = email;
        u.password = password;
        u.avatarColor = COLORS[(nextId - 1) % COLORS.length];
        nextId++;
        users.add(u);
        save();
        return u;
    }

    public synchronized List<User> getUsers() { return users; }
    public synchronized List<Product> getProducts() { return products; }
    public synchronized Product findProduct(int id) {
        for (Product p : products) if (p.id == id) return p;
        return null;
    }

    public synchronized Product addProduct(Product p) {
        p.id = nextProductId++;
        p.createdAt = System.currentTimeMillis();
        products.add(p);
        save();
        return p;
    }

    public synchronized List<Application> getApplications() { return applications; }
    public synchronized Application findApplication(int id) {
        for (Application a : applications) if (a.id == id) return a;
        return null;
    }
    public synchronized Application addApplication(Application a) {
        a.id = nextApplicationId++;
        applications.add(a);
        save();
        return a;
    }

    public synchronized List<Report> getReports() { return reports; }
    public synchronized Report findReport(int id) {
        for (Report r : reports) if (r.id == id) return r;
        return null;
    }
    public synchronized Report addReport(Report r) {
        r.id = nextReportId++;
        reports.add(r);
        save();
        return r;
    }

    public synchronized List<ChatMessage> getMessages(String channel) {
        if (channel == null || channel.isBlank() || "all".equalsIgnoreCase(channel)) {
            return new ArrayList<>(messages);
        }
        List<ChatMessage> out = new ArrayList<>();
        for (ChatMessage m : messages) {
            if (channel.equalsIgnoreCase(m.channel)) out.add(m);
        }
        return out;
    }

    public synchronized ChatMessage addMessage(ChatMessage m) {
        m.id = nextMessageId++;
        m.createdAt = System.currentTimeMillis();
        messages.add(m);
        save();
        return m;
    }
}
