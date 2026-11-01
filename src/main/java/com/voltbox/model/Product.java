package com.voltbox.model;

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
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;

/**
 * JPA Entity for the Voltbox Product model mapped to the `voltbox_products` table.
 * Synchronizes `name` with `title` and `stockQuantity` with `quantity`/`stock`
 * so both relational JPA persistence and the existing Voltbox frontend contract
 * work seamlessly.
 */
@Entity(name = "ProductModel")
@Table(
    name = "voltbox_products",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_voltbox_products_sku", columnNames = "sku")
    },
    indexes = {
        @Index(name = "idx_voltbox_products_sku", columnList = "sku", unique = true),
        @Index(name = "idx_voltbox_products_category", columnList = "category"),
        @Index(name = "idx_voltbox_products_group", columnList = "component_group"),
        @Index(name = "idx_voltbox_products_low_stock", columnList = "low_stock")
    }
)
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Product {

    public static final int LOW_STOCK_THRESHOLD = 5;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    public int id;

    @Column(name = "sku", nullable = false, unique = true, length = 32)
    public String sku;

    @Column(name = "name", nullable = false, length = 180)
    public String name;

    @Column(name = "title", nullable = false, length = 180)
    public String title;

    @Column(name = "price", nullable = false)
    public double price;

    @Column(name = "stock_quantity", nullable = false)
    public int stockQuantity = 10;

    @Column(name = "quantity", nullable = false)
    public int quantity = 10;

    @Column(name = "stock", nullable = false)
    public int stock = 10;

    @Column(name = "low_stock", nullable = false)
    public boolean lowStock = false;

    @Column(name = "category", nullable = false, length = 64)
    public String category;

    @Column(name = "component_group", length = 32)
    public String componentGroup;

    @Column(name = "description", length = 1024)
    public String description;

    @Column(name = "image", length = 512)
    public String image;

    @Column(name = "rating_rate", nullable = false)
    public double ratingRate;

    @Column(name = "rating_count", nullable = false)
    public int ratingCount;

    @Column(name = "added_by_name", length = 120)
    public String addedByName;

    @Column(name = "added_by_color", length = 24)
    public String addedByColor;

    @Column(name = "added_by_email", length = 180)
    public String addedByEmail;

    @Column(name = "official", nullable = false)
    public boolean official;

    @Column(name = "created_at", nullable = false)
    public long createdAt;

    @Column(name = "taken_down", nullable = false)
    public boolean takenDown;

    @Column(name = "last_restocked_at")
    public long lastRestockedAt;

    @Column(name = "last_updated_by", length = 120)
    public String lastUpdatedBy;

    @Version
    @Column(name = "version")
    public Long version;

    public Product() {}

    public Product(
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
        this.stockQuantity = stockQuantity;
        this.quantity = stockQuantity;
        this.stock = stockQuantity;
        this.lowStock = stockQuantity < LOW_STOCK_THRESHOLD;
        this.category = category;
    }

    @PrePersist
    @PreUpdate
    public void syncPersistenceState() {
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

        int resolvedStock = this.stockQuantity;
        if (resolvedStock == 10 && this.quantity != 10) {
            resolvedStock = this.quantity;
        } else if (resolvedStock == 10 && this.stock != 10) {
            resolvedStock = this.stock;
        }
        resolvedStock = Math.max(0, resolvedStock);
        this.stockQuantity = resolvedStock;
        this.quantity = resolvedStock;
        this.stock = resolvedStock;
        this.lowStock = resolvedStock < LOW_STOCK_THRESHOLD;

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

    public int getStockQuantity() {
        return stockQuantity > 0 ? stockQuantity : (quantity > 0 ? quantity : stock);
    }

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

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getComponentGroup() { return componentGroup; }
    public void setComponentGroup(String componentGroup) { this.componentGroup = componentGroup; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

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
}
