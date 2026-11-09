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
    private List<SearchQueryLog> searchLogs = new ArrayList<>();
    private int nextSearchLogId = 1;
    private Map<String, String> sessions = new LinkedHashMap<>();

    public static class Data {
        public int nextId = 1;
        public int nextProductId = 1;
        public int nextApplicationId = 1;
        public int nextReportId = 1;
        public int nextMessageId = 1;
        public int nextSearchLogId = 1;
        public List<User> users = new ArrayList<>();
        public Map<String, String> sessions = new LinkedHashMap<>();
        public List<Product> products = new ArrayList<>();
        public List<Application> applications = new ArrayList<>();
        public List<Report> reports = new ArrayList<>();
        public List<ChatMessage> messages = new ArrayList<>();
        public List<SearchQueryLog> searchLogs = new ArrayList<>();
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
            this.searchLogs = d.searchLogs != null ? d.searchLogs : new ArrayList<>();
            this.nextId = Math.max(d.nextId, 1);
            this.nextProductId = Math.max(d.nextProductId, 1);
            this.nextApplicationId = Math.max(d.nextApplicationId, 1);
            this.nextReportId = Math.max(d.nextReportId, 1);
            this.nextMessageId = Math.max(d.nextMessageId, 1);
            this.nextSearchLogId = Math.max(d.nextSearchLogId, 1);
            ensureDefaultAccounts();
        } catch (Exception e) {
            throw new RuntimeException("Couldn't read voltbox-data.json", e);
        }
    }

    private void ensureDefaultAccounts() {
        boolean changed = false;
        if (findByEmail("alex.chen@gmail.com") == null) {
            User alex = add("Alex Chen", "alex.chen@gmail.com", "Shopper123");
            alex.role = "member";
            changed = true;
        }
        if (findByEmail("maya.lin@icloud.com") == null) {
            User maya = add("Maya Lin", "maya.lin@icloud.com", "AppleId123");
            maya.role = "member";
            changed = true;
        }
        if (changed) {
            save();
        }
    }

    private final com.voltbox.validation.ProductValidator productValidator = new com.voltbox.validation.ProductValidator();

    public synchronized void save() {
        for (Product p : products) {
            if (p != null && !p.takenDown) {
                productValidator.assertValidProductEntity(p, products);
            }
        }
        try {
            Data d = new Data();
            d.nextId = nextId;
            d.nextProductId = nextProductId;
            d.nextApplicationId = nextApplicationId;
            d.nextReportId = nextReportId;
            d.nextMessageId = nextMessageId;
            d.nextSearchLogId = nextSearchLogId;
            d.users = users;
            d.sessions = sessions;
            d.products = products;
            d.applications = applications;
            d.reports = reports;
            d.messages = messages;
            d.searchLogs = searchLogs;

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

        User alex = add("Alex Chen", "alex.chen@gmail.com", "Shopper123");
        alex.role = "member";

        User maya = add("Maya Lin", "maya.lin@icloud.com", "AppleId123");
        maya.role = "member";

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
        productValidator.assertValidProductEntity(p, products);
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

    public synchronized List<SearchQueryLog> getSearchLogs() {
        return new ArrayList<>(searchLogs);
    }

    public synchronized SearchQueryLog addSearchLog(
            String rawQuery,
            String normalizedQuery,
            String categoryFilter,
            int resultCount,
            boolean zeroResultGap,
            String inferredComponentGroup,
            String source,
            String actorName) {
        return addSearchLogAtTimestamp(
                rawQuery,
                normalizedQuery,
                categoryFilter,
                resultCount,
                zeroResultGap,
                inferredComponentGroup,
                source,
                actorName,
                System.currentTimeMillis()
        );
    }

    public synchronized SearchQueryLog addSearchLogAtTimestamp(
            String rawQuery,
            String normalizedQuery,
            String categoryFilter,
            int resultCount,
            boolean zeroResultGap,
            String inferredComponentGroup,
            String source,
            String actorName,
            long timestamp) {
        SearchQueryLog entry = new SearchQueryLog(
                nextSearchLogId++,
                rawQuery,
                normalizedQuery,
                categoryFilter,
                resultCount,
                zeroResultGap,
                inferredComponentGroup,
                source,
                actorName,
                timestamp
        );
        searchLogs.add(entry);
        while (searchLogs.size() > 500) {
            searchLogs.remove(0);
        }
        save();
        return entry;
    }

    public synchronized void clearSearchLogs() {
        searchLogs.clear();
        save();
    }
}
