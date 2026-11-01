package com.voltbox.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;

import java.util.ArrayList;
import java.util.List;

/**
 * Primary JPA Entity representing a hardware product in the Voltbox catalog,
 * persisted to the `products` relational table.
 *
 * Maps core relational columns (`id`, `sku`, `name`, `title`, `price`,
 * `stock_quantity`, `quantity`, `stock`, `low_stock`, `category`,
 * `component_group`, `description`, `image`, `rating_rate`, `rating_count`,
 * contributor attribution, and timestamps) while exposing `@Transient`
 * 6-month price history and technical specs for the Voltbox frontend.
 */
@Entity(name = "Product")
@Table(
    name = "products",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_products_sku", columnNames = "sku")
    },
    indexes = {
        @Index(name = "idx_products_sku", columnList = "sku", unique = true),
        @Index(name = "idx_products_category", columnList = "category"),
        @Index(name = "idx_products_component_group", columnList = "component_group"),
        @Index(name = "idx_products_low_stock", columnList = "low_stock")
    }
)
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductEntity {

    public static final int LOW_STOCK_THRESHOLD = 5;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private int id;

    @Column(name = "sku", nullable = false, unique = true, length = 32)
    private String sku;

    @Column(name = "name", nullable = false, length = 180)
    private String name;

    @Column(name = "title", nullable = false, length = 180)
    private String title;

    @Column(name = "price", nullable = false)
    private double price;

    @Column(name = "stock_quantity", nullable = false)
    private int stockQuantity;

    @Column(name = "quantity", nullable = false)
    private int quantity;

    @Column(name = "stock", nullable = false)
    private int stock;

    @Column(name = "low_stock", nullable = false)
    private boolean lowStock;

    @Column(name = "category", nullable = false, length = 64)
    private String category;

    @Column(name = "component_group", length = 32)
    private String componentGroup;

    @Column(name = "description", length = 1024)
    private String description;

    @Column(name = "image", length = 512)
    private String image;

    @Column(name = "rating_rate", nullable = false)
    private double ratingRate;

    @Column(name = "rating_count", nullable = false)
    private int ratingCount;

    @Column(name = "added_by_name", length = 120)
    private String addedByName;

    @Column(name = "added_by_color", length = 24)
    private String addedByColor;

    @Column(name = "added_by_email", length = 180)
    private String addedByEmail;

    @Column(name = "official", nullable = false)
    private boolean official;

    @Column(name = "created_at", nullable = false)
    private long createdAt;

    @Column(name = "taken_down", nullable = false)
    private boolean takenDown;

    @Column(name = "last_restocked_at")
    private long lastRestockedAt;

    @Column(name = "last_updated_by", length = 120)
    private String lastUpdatedBy;

    @Version
    @Column(name = "version")
    private Long version;

    @Transient
    private List<PricePoint> priceHistory = new ArrayList<>();

    @Transient
    private Specs specs;

    public static class PricePoint {
        public String month;
        public double price;
        public double marketAvg;

        public PricePoint() {}

        public PricePoint(String month, double price, double marketAvg) {
            this.month = month;
            this.price = price;
            this.marketAvg = marketAvg;
        }
    }

    public static class Specs {
        public String sku;
        public String group;
        public String groupLabel;
        public String architecture;
        public String interfaceSpec;
        public String powerDraw;
        public String warranty;
        public double lowestPrice;
        public double highestPrice;
        public double avgPrice;
        public double priceDeltaPct;
    }

    public ProductEntity() {}

    public ProductEntity(
            int id,
            String sku,
            String name,
            double price,
            int stockQuantity,
            String category
    ) {
        this.id = id;
        this.sku = sku;
        this.name = name;
        this.title = name;
        this.price = price;
        setStockQuantity(stockQuantity);
        this.category = category;
    }

    @PrePersist
    @PreUpdate
    public void syncInventoryAndNamingState() {
        if ((this.name == null || this.name.isBlank()) && this.title != null && !this.title.isBlank()) {
            this.name = this.title.trim();
        } else if ((this.title == null || this.title.isBlank()) && this.name != null && !this.name.isBlank()) {
            this.title = this.name.trim();
        }
        if (this.name == null || this.name.isBlank()) {
            this.name = "Component";
            this.title = "Component";
        }
        if (this.category == null || this.category.isBlank()) {
            this.category = "components";
        }

        int resolved = this.stockQuantity > 0
                ? this.stockQuantity
                : (this.quantity > 0 ? this.quantity : Math.max(0, this.stock));
        this.stockQuantity = resolved;
        this.quantity = resolved;
        this.stock = resolved;
        this.lowStock = resolved < LOW_STOCK_THRESHOLD;

        if (this.sku == null || this.sku.isBlank()) {
            this.sku = String.format("VB-PRT-%03d", Math.max(0, this.id));
        }
        if (this.createdAt <= 0L) {
            this.createdAt = System.currentTimeMillis();
        }
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getName() {
        return (name != null && !name.isBlank()) ? name : title;
    }

    public void setName(String name) {
        this.name = name;
        if (name != null && !name.isBlank()) {
            this.title = name;
        }
    }

    public String getTitle() {
        return (title != null && !title.isBlank()) ? title : name;
    }

    public void setTitle(String title) {
        this.title = title;
        if (title != null && !title.isBlank()) {
            this.name = title;
        }
    }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public int getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(int stockQuantity) {
        int clean = Math.max(0, stockQuantity);
        this.stockQuantity = clean;
        this.quantity = clean;
        this.stock = clean;
        this.lowStock = clean < LOW_STOCK_THRESHOLD;
    }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) {
        int clean = Math.max(0, quantity);
        this.quantity = clean;
        this.stockQuantity = clean;
        this.stock = clean;
        this.lowStock = clean < LOW_STOCK_THRESHOLD;
    }

    public int getStock() { return stock; }
    public void setStock(int stock) {
        int clean = Math.max(0, stock);
        this.stock = clean;
        this.stockQuantity = clean;
        this.quantity = clean;
        this.lowStock = clean < LOW_STOCK_THRESHOLD;
    }

    public boolean isLowStock() { return lowStock; }
    public void setLowStock(boolean lowStock) { this.lowStock = lowStock; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getComponentGroup() { return componentGroup; }
    public void setComponentGroup(String componentGroup) { this.componentGroup = componentGroup; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public double getRatingRate() { return ratingRate; }
    public void setRatingRate(double ratingRate) { this.ratingRate = ratingRate; }

    public int getRatingCount() { return ratingCount; }
    public void setRatingCount(int ratingCount) { this.ratingCount = ratingCount; }

    public String getAddedByName() { return addedByName; }
    public void setAddedByName(String addedByName) { this.addedByName = addedByName; }

    public String getAddedByColor() { return addedByColor; }
    public void setAddedByColor(String addedByColor) { this.addedByColor = addedByColor; }

    public String getAddedByEmail() { return addedByEmail; }
    public void setAddedByEmail(String addedByEmail) { this.addedByEmail = addedByEmail; }

    public boolean isOfficial() { return official; }
    public void setOfficial(boolean official) { this.official = official; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public boolean isTakenDown() { return takenDown; }
    public void setTakenDown(boolean takenDown) { this.takenDown = takenDown; }

    public long getLastRestockedAt() { return lastRestockedAt; }
    public void setLastRestockedAt(long lastRestockedAt) { this.lastRestockedAt = lastRestockedAt; }

    public String getLastUpdatedBy() { return lastUpdatedBy; }
    public void setLastUpdatedBy(String lastUpdatedBy) { this.lastUpdatedBy = lastUpdatedBy; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public List<PricePoint> getPriceHistory() { return priceHistory; }
    public void setPriceHistory(List<PricePoint> priceHistory) { this.priceHistory = priceHistory; }

    public Specs getSpecs() { return specs; }
    public void setSpecs(Specs specs) { this.specs = specs; }
}
