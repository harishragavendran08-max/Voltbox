package com.voltbox.repository;

import com.voltbox.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository extending {@link JpaRepository} to handle full CRUD
 * operations, catalog filtering, and atomic stock updates for {@link ProductEntity}
 * records in the relational {@code products} table (H2 or MySQL).
 */
@Repository
public interface ProductRepository extends JpaRepository<ProductEntity, Integer> {

    /**
     * Finds an active (non-taken-down) product by primary key ID.
     */
    Optional<ProductEntity> findByIdAndTakenDownFalse(Integer id);

    /**
     * Finds a product by its unique hardware SKU (case-insensitive).
     */
    Optional<ProductEntity> findBySkuIgnoreCase(String sku);

    /**
     * Checks whether a product with the given SKU already exists.
     */
    boolean existsBySkuIgnoreCase(String sku);

    /**
     * Returns all active catalog products ordered by ID ascending.
     */
    List<ProductEntity> findByTakenDownFalseOrderByIdAsc();

    /**
     * Returns active products matching a specific category (case-insensitive).
     */
    List<ProductEntity> findByCategoryIgnoreCaseAndTakenDownFalseOrderByIdAsc(String category);

    /**
     * Returns active products matching a Rig Builder component group (e.g., gpus, cpus, motherboards, storage).
     */
    List<ProductEntity> findByComponentGroupIgnoreCaseAndTakenDownFalseOrderByIdAsc(String componentGroup);

    /**
     * Returns products contributed by a specific user email ordered newest first.
     */
    List<ProductEntity> findByAddedByEmailIgnoreCaseOrderByCreatedAtDesc(String addedByEmail);

    /**
     * Returns active products flagged as low stock (< 5 units), ordered by lowest stock first.
     */
    List<ProductEntity> findByLowStockTrueAndTakenDownFalseOrderByStockQuantityAsc();

    /**
     * Returns active products whose stockQuantity is strictly below the given threshold.
     */
    List<ProductEntity> findByStockQuantityLessThanAndTakenDownFalseOrderByStockQuantityAsc(int threshold);

    /**
     * Returns active products within an inclusive price range ordered by price ascending.
     */
    List<ProductEntity> findByPriceBetweenAndTakenDownFalseOrderByPriceAsc(double minPrice, double maxPrice);

    /**
     * Counts all active (non-taken-down) products in the catalog.
     */
    long countByTakenDownFalse();

    /**
     * Counts all active products currently in low-stock state.
     */
    long countByLowStockTrueAndTakenDownFalse();

    /**
     * Full-text keyword search across product name, title, SKU, category, and component group.
     */
    @Query(
        "SELECT p FROM Product p WHERE p.takenDown = false AND (" +
        "LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
        "LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
        "LOWER(p.sku) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
        "LOWER(p.category) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
        "LOWER(p.componentGroup) LIKE LOWER(CONCAT('%', :query, '%')))"
    )
    List<ProductEntity> searchActiveCatalog(@Param("query") String query);

    /**
     * Atomically updates stockQuantity, quantity, stock, lowStock flag, and audit fields for a product.
     */
    @Modifying
    @Transactional
    @Query(
        "UPDATE Product p SET " +
        "p.stockQuantity = :stockQuantity, " +
        "p.quantity = :stockQuantity, " +
        "p.stock = :stockQuantity, " +
        "p.lowStock = :lowStock, " +
        "p.lastRestockedAt = :updatedAt, " +
        "p.lastUpdatedBy = :updatedBy " +
        "WHERE p.id = :id"
    )
    int updateStockQuantity(
            @Param("id") Integer id,
            @Param("stockQuantity") int stockQuantity,
            @Param("lowStock") boolean lowStock,
            @Param("updatedAt") long updatedAt,
            @Param("updatedBy") String updatedBy
    );

    /**
     * Soft-deletes (takes down) a product listing by setting takenDown = true.
     */
    @Modifying
    @Transactional
    @Query("UPDATE Product p SET p.takenDown = true WHERE p.id = :id")
    int softDeleteById(@Param("id") Integer id);
}
