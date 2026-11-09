package com.voltbox.validation;

import com.voltbox.model.Product;
import com.voltbox.validation.ProductValidationException.FieldViolation;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Server-side validation layer for Voltbox hardware product modifications.
 * Enforces canonical SKU formatting, SKU uniqueness across active catalog items,
 * and warehouse stock level & restock delta constraints before any mutation is
 * persisted to the JSON data store ({@code voltbox-data.json}).
 */
@Component
public class ProductValidator {

    public static final int MIN_STOCK_QUANTITY = 0;
    public static final int MAX_STOCK_QUANTITY = 1000;
    public static final int MIN_RESTOCK_AMOUNT = 1;
    public static final int MAX_RESTOCK_AMOUNT = 500;
    public static final int MAX_STOCK_DELTA = 500;
    public static final double MIN_UNIT_PRICE = 0.0;
    public static final double MAX_UNIT_PRICE = 99999.99;

    public static final Set<String> VALID_SKU_PREFIXES = Set.of(
            "GPU", "CPU", "MBD", "STR", "AUD", "GMG", "PRT"
    );

    /**
     * Canonical Voltbox SKU format:
     * {@code VB-<PREFIX>-<3 to 4 digit sequence>[-<optional 1 to 4 char alphanumeric revision>]}
     * Examples: {@code VB-GPU-019}, {@code VB-CPU-045}, {@code VB-STR-1024}, {@code VB-MBD-021-R2}
     */
    public static final Pattern CANONICAL_SKU_PATTERN = Pattern.compile(
            "^VB-(GPU|CPU|MBD|STR|AUD|GMG|PRT)-(\\d{3,4})(?:-([A-Z0-9]{1,4}))?$"
    );

    private static final Pattern LOOSE_VB_SKU_PATTERN = Pattern.compile(
            "^VB-([A-Z0-9]+)-(\\d+)(?:-(.*))?$"
    );

    public static class ValidationResult {
        private final boolean valid;
        private final String normalizedSku;
        private final Integer normalizedStock;
        private final Double normalizedPrice;
        private final List<FieldViolation> violations;

        public ValidationResult(
                boolean valid,
                String normalizedSku,
                Integer normalizedStock,
                Double normalizedPrice,
                List<FieldViolation> violations) {
            this.valid = valid;
            this.normalizedSku = normalizedSku;
            this.normalizedStock = normalizedStock;
            this.normalizedPrice = normalizedPrice;
            this.violations = violations != null ? violations : List.of();
        }

        public boolean isValid() {
            return valid;
        }

        public String getNormalizedSku() {
            return normalizedSku;
        }

        public Integer getNormalizedStock() {
            return normalizedStock;
        }

        public Double getNormalizedPrice() {
            return normalizedPrice;
        }

        public List<FieldViolation> getViolations() {
            return violations;
        }

        public String getPrimaryMessage() {
            if (violations.isEmpty()) {
                return "Validation passed.";
            }
            return violations.get(0).getMessage();
        }

        public String getPrimaryCode() {
            if (violations.isEmpty()) {
                return "OK";
            }
            return violations.get(0).getCode();
        }

        public void throwIfInvalid() {
            if (!valid) {
                throw new ProductValidationException(getPrimaryCode(), getPrimaryMessage(), violations);
            }
        }

        public Map<String, Object> toMap() {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("ok", valid);
            map.put("code", getPrimaryCode());
            map.put("message", getPrimaryMessage());
            if (normalizedSku != null) map.put("normalizedSku", normalizedSku);
            if (normalizedStock != null) map.put("normalizedStock", normalizedStock);
            if (normalizedPrice != null) map.put("normalizedPrice", normalizedPrice);
            List<Map<String, Object>> errs = new ArrayList<>(violations.size());
            for (FieldViolation v : violations) {
                errs.add(v.toMap());
            }
            map.put("errors", errs);
            return map;
        }
    }

    /**
     * Validates a hardware SKU string against the canonical Voltbox format and checks
     * uniqueness against existing catalog products.
     */
    public ValidationResult validateSku(
            Object rawSkuObj,
            boolean required,
            Integer currentProductId,
            Collection<Product> existingProducts) {
        List<FieldViolation> violations = new ArrayList<>();

        if (rawSkuObj == null) {
            if (required) {
                violations.add(new FieldViolation(
                        "sku",
                        "SKU_REQUIRED",
                        "Product SKU is required (expected format: VB-GPU-019).",
                        null
                ));
            }
            return new ValidationResult(violations.isEmpty(), null, null, null, violations);
        }

        String rawSku = String.valueOf(rawSkuObj).trim();
        if (rawSku.isEmpty()) {
            if (required) {
                violations.add(new FieldViolation(
                        "sku",
                        "SKU_BLANK",
                        "Product SKU cannot be empty. Expected canonical format VB-<GRP>-<001..9999> (e.g. VB-GPU-019).",
                        rawSkuObj
                ));
            }
            return new ValidationResult(violations.isEmpty(), null, null, null, violations);
        }

        if (!rawSku.equals(rawSku.toUpperCase(Locale.ROOT))) {
            violations.add(new FieldViolation(
                    "sku",
                    "SKU_LOWERCASE_NOT_ALLOWED",
                    "SKU '" + rawSku + "' must use uppercase characters (e.g. '" + rawSku.toUpperCase(Locale.ROOT) + "').",
                    rawSku
            ));
            return new ValidationResult(false, null, null, null, violations);
        }

        if (rawSku.length() < 10 || rawSku.length() > 16) {
            violations.add(new FieldViolation(
                    "sku",
                    "SKU_INVALID_LENGTH",
                    "SKU '" + rawSku + "' must be between 10 and 16 characters in format VB-<GRP>-<NNN>.",
                    rawSku
            ));
            return new ValidationResult(false, null, null, null, violations);
        }

        Matcher canonicalMatcher = CANONICAL_SKU_PATTERN.matcher(rawSku);
        if (!canonicalMatcher.matches()) {
            Matcher looseMatcher = LOOSE_VB_SKU_PATTERN.matcher(rawSku);
            if (looseMatcher.matches()) {
                String prefix = looseMatcher.group(1);
                String digits = looseMatcher.group(2);
                if (!VALID_SKU_PREFIXES.contains(prefix)) {
                    violations.add(new FieldViolation(
                            "sku",
                            "SKU_INVALID_PREFIX",
                            "Invalid SKU component group prefix '" + prefix + "' in '" + rawSku
                                    + "'. Allowed prefixes: GPU, CPU, MBD, STR, AUD, GMG, PRT.",
                            rawSku
                    ));
                    return new ValidationResult(false, null, null, null, violations);
                }
                if (digits.length() < 3 || digits.length() > 4) {
                    violations.add(new FieldViolation(
                            "sku",
                            "SKU_INVALID_SEQUENCE_LENGTH",
                            "SKU sequence number '" + digits + "' in '" + rawSku
                                    + "' must be 3 to 4 digits (e.g. VB-" + prefix + "-019).",
                            rawSku
                    ));
                    return new ValidationResult(false, null, null, null, violations);
                }
            }

            violations.add(new FieldViolation(
                    "sku",
                    "SKU_INVALID_FORMAT",
                    "Invalid SKU format '" + rawSku
                            + "'. Must match VB-(GPU|CPU|MBD|STR|AUD|GMG|PRT)-<001..9999> (e.g. VB-GPU-019).",
                    rawSku
            ));
            return new ValidationResult(false, null, null, null, violations);
        }

        String seqDigits = canonicalMatcher.group(2);
        int seqNumber = Integer.parseInt(seqDigits);
        if (seqNumber <= 0) {
            violations.add(new FieldViolation(
                    "sku",
                    "SKU_ZERO_SEQUENCE",
                    "SKU sequence number in '" + rawSku + "' must be greater than zero (001–9999).",
                    rawSku
            ));
            return new ValidationResult(false, null, null, null, violations);
        }

        if (existingProducts != null) {
            for (Product existing : existingProducts) {
                if (existing == null || existing.takenDown) continue;
                if (currentProductId != null && existing.id == currentProductId) continue;
                String existingSku = existing.sku != null && !existing.sku.isBlank()
                        ? existing.sku.trim()
                        : null;
                if (existingSku != null && existingSku.equalsIgnoreCase(rawSku)) {
                    violations.add(new FieldViolation(
                            "sku",
                            "SKU_DUPLICATE",
                            "SKU '" + rawSku + "' is already assigned to active product #"
                                    + existing.id + " (" + existing.getTitle() + ").",
                            rawSku
                    ));
                    return new ValidationResult(false, null, null, null, violations);
                }
            }
        }

        return new ValidationResult(true, rawSku, null, null, violations);
    }

    /**
     * Validates an absolute stock quantity (must be a whole integer within [0, 1000]).
     */
    public ValidationResult validateStockQuantity(Object rawStockObj, boolean required) {
        List<FieldViolation> violations = new ArrayList<>();

        if (rawStockObj == null || String.valueOf(rawStockObj).trim().isEmpty()) {
            if (required) {
                violations.add(new FieldViolation(
                        "stockQuantity",
                        "STOCK_REQUIRED",
                        "Stock quantity is required and must be an integer between "
                                + MIN_STOCK_QUANTITY + " and " + MAX_STOCK_QUANTITY + ".",
                        rawStockObj
                ));
            }
            return new ValidationResult(violations.isEmpty(), null, null, null, violations);
        }

        int parsedStock;
        if (rawStockObj instanceof Number num) {
            double d = num.doubleValue();
            if (Double.isNaN(d) || Double.isInfinite(d) || Math.floor(d) != d) {
                violations.add(new FieldViolation(
                        "stockQuantity",
                        "STOCK_NOT_INTEGER",
                        "Stock quantity must be a whole integer (received " + rawStockObj + ").",
                        rawStockObj
                ));
                return new ValidationResult(false, null, null, null, violations);
            }
            parsedStock = (int) d;
        } else {
            String rawStr = String.valueOf(rawStockObj).trim();
            if (!rawStr.matches("^[+-]?\\d+$")) {
                violations.add(new FieldViolation(
                        "stockQuantity",
                        "STOCK_NOT_INTEGER",
                        "Stock quantity must be a valid whole integer (received '" + rawStr + "').",
                        rawStockObj
                ));
                return new ValidationResult(false, null, null, null, violations);
            }
            try {
                parsedStock = Integer.parseInt(rawStr);
            } catch (NumberFormatException e) {
                violations.add(new FieldViolation(
                        "stockQuantity",
                        "STOCK_NOT_INTEGER",
                        "Stock quantity is out of integer bounds (received '" + rawStr + "').",
                        rawStockObj
                ));
                return new ValidationResult(false, null, null, null, violations);
            }
        }

        if (parsedStock < MIN_STOCK_QUANTITY) {
            violations.add(new FieldViolation(
                    "stockQuantity",
                    "STOCK_NEGATIVE",
                    "Stock quantity cannot be negative (received " + parsedStock
                            + "). Minimum allowed stock is " + MIN_STOCK_QUANTITY + " units.",
                    parsedStock
            ));
            return new ValidationResult(false, null, null, null, violations);
        }

        if (parsedStock > MAX_STOCK_QUANTITY) {
            violations.add(new FieldViolation(
                    "stockQuantity",
                    "STOCK_EXCEEDS_MAX",
                    "Stock quantity cannot exceed warehouse bin capacity of " + MAX_STOCK_QUANTITY
                            + " units per SKU (received " + parsedStock + ").",
                    parsedStock
            ));
            return new ValidationResult(false, null, null, null, violations);
        }

        return new ValidationResult(true, null, parsedStock, null, violations);
    }

    /**
     * Validates a stock mutation (either setting an absolute target quantity or applying a relative delta/restock).
     * Rejects negative target quantities, fractional quantities, deltas out of range, stock underflows (< 0),
     * and stock overflows (> 1000).
     */
    public ValidationResult validateStockAdjustment(
            int currentStock,
            Object rawTargetStock,
            Object rawDelta,
            boolean isRestockOnly) {
        List<FieldViolation> violations = new ArrayList<>();

        if (rawTargetStock != null && !String.valueOf(rawTargetStock).trim().isEmpty()) {
            return validateStockQuantity(rawTargetStock, true);
        }

        if (rawDelta == null || String.valueOf(rawDelta).trim().isEmpty()) {
            violations.add(new FieldViolation(
                    "delta",
                    "STOCK_MUTATION_REQUIRED",
                    "Provide either a valid stockQuantity (0–1000) or an integer stock delta.",
                    null
            ));
            return new ValidationResult(false, null, null, null, violations);
        }

        int parsedDelta;
        if (rawDelta instanceof Number num) {
            double d = num.doubleValue();
            if (Double.isNaN(d) || Double.isInfinite(d) || Math.floor(d) != d) {
                violations.add(new FieldViolation(
                        "delta",
                        "DELTA_NOT_INTEGER",
                        "Stock adjustment delta must be a whole integer (received " + rawDelta + ").",
                        rawDelta
                ));
                return new ValidationResult(false, null, null, null, violations);
            }
            parsedDelta = (int) d;
        } else {
            String rawStr = String.valueOf(rawDelta).trim();
            if (!rawStr.matches("^[+-]?\\d+$")) {
                violations.add(new FieldViolation(
                        "delta",
                        "DELTA_NOT_INTEGER",
                        "Stock adjustment delta must be a valid whole integer (received '" + rawStr + "').",
                        rawDelta
                ));
                return new ValidationResult(false, null, null, null, violations);
            }
            try {
                parsedDelta = Integer.parseInt(rawStr);
            } catch (NumberFormatException e) {
                violations.add(new FieldViolation(
                        "delta",
                        "DELTA_NOT_INTEGER",
                        "Stock adjustment delta is out of integer bounds.",
                        rawDelta
                ));
                return new ValidationResult(false, null, null, null, violations);
            }
        }

        if (isRestockOnly) {
            if (parsedDelta < MIN_RESTOCK_AMOUNT || parsedDelta > MAX_RESTOCK_AMOUNT) {
                violations.add(new FieldViolation(
                        "amount",
                        "RESTOCK_OUT_OF_RANGE",
                        "Restock amount must be between " + MIN_RESTOCK_AMOUNT
                                + " and " + MAX_RESTOCK_AMOUNT + " units (received " + parsedDelta + ").",
                        parsedDelta
                ));
                return new ValidationResult(false, null, null, null, violations);
            }
        } else {
            if (parsedDelta < -MAX_STOCK_DELTA || parsedDelta > MAX_STOCK_DELTA) {
                violations.add(new FieldViolation(
                        "delta",
                        "DELTA_OUT_OF_RANGE",
                        "Stock adjustment delta must be between -" + MAX_STOCK_DELTA
                                + " and +" + MAX_STOCK_DELTA + " units (received " + parsedDelta + ").",
                        parsedDelta
                ));
                return new ValidationResult(false, null, null, null, violations);
            }
        }

        int resultingStock = currentStock + parsedDelta;
        if (resultingStock < MIN_STOCK_QUANTITY) {
            violations.add(new FieldViolation(
                    "stockQuantity",
                    "STOCK_UNDERFLOW",
                    "Stock adjustment of " + parsedDelta + " units on current stock (" + currentStock
                            + ") would result in negative stock (" + resultingStock + ").",
                    resultingStock
            ));
            return new ValidationResult(false, null, null, null, violations);
        }

        if (resultingStock > MAX_STOCK_QUANTITY) {
            violations.add(new FieldViolation(
                    "stockQuantity",
                    "STOCK_OVERFLOW",
                    "Stock adjustment of +" + parsedDelta + " units on current stock (" + currentStock
                            + ") would exceed warehouse bin capacity of " + MAX_STOCK_QUANTITY
                            + " units (resulting in " + resultingStock + ").",
                    resultingStock
            ));
            return new ValidationResult(false, null, null, null, violations);
        }

        return new ValidationResult(true, null, resultingStock, null, violations);
    }

    /**
     * Validates a complete product create or update payload (title, SKU formatting & uniqueness,
     * stock level bounds, and unit price bounds) before any state modification occurs.
     */
    public ValidationResult validateProductModification(
            Map<String, Object> body,
            boolean isCreate,
            Integer currentProductId,
            Collection<Product> existingProducts) {
        List<FieldViolation> violations = new ArrayList<>();
        if (body == null) {
            violations.add(new FieldViolation(
                    "body",
                    "PAYLOAD_REQUIRED",
                    "Request payload is required for product modification.",
                    null
            ));
            return new ValidationResult(false, null, null, null, violations);
        }

        // 1. Validate title if creating or if explicitly provided on update
        if (isCreate || body.containsKey("title") || body.containsKey("name")) {
            Object rawTitleObj = body.containsKey("title") ? body.get("title") : body.get("name");
            String cleanTitle = rawTitleObj != null ? String.valueOf(rawTitleObj).trim() : "";
            if (cleanTitle.isEmpty()) {
                violations.add(new FieldViolation(
                        "title",
                        "TITLE_REQUIRED",
                        "Product name/title cannot be blank.",
                        rawTitleObj
                ));
            } else if (cleanTitle.length() > 180) {
                violations.add(new FieldViolation(
                        "title",
                        "TITLE_TOO_LONG",
                        "Product name/title cannot exceed 180 characters.",
                        cleanTitle.length()
                ));
            }
        }

        // 2. Validate SKU if present in payload
        String normalizedSku = null;
        if (body.containsKey("sku")) {
            Object rawSkuObj = body.get("sku");
            boolean skuRequired = !isCreate && rawSkuObj != null;
            if (rawSkuObj != null && !String.valueOf(rawSkuObj).trim().isEmpty()) {
                ValidationResult skuRes = validateSku(rawSkuObj, true, currentProductId, existingProducts);
                if (!skuRes.isValid()) {
                    violations.addAll(skuRes.getViolations());
                } else {
                    normalizedSku = skuRes.getNormalizedSku();
                }
            } else if (skuRequired) {
                violations.add(new FieldViolation(
                        "sku",
                        "SKU_BLANK",
                        "Product SKU cannot be cleared to an empty string. Provide a valid SKU (e.g. VB-GPU-019).",
                        rawSkuObj
                ));
            }
        }

        // 3. Validate Stock Quantity if present in payload
        Integer normalizedStock = null;
        boolean hasStockField = body.containsKey("stockQuantity")
                || body.containsKey("quantity")
                || body.containsKey("stock");
        if (hasStockField) {
            Object rawStockObj = body.containsKey("stockQuantity")
                    ? body.get("stockQuantity")
                    : (body.containsKey("quantity") ? body.get("quantity") : body.get("stock"));
            ValidationResult stockRes = validateStockQuantity(rawStockObj, true);
            if (!stockRes.isValid()) {
                violations.addAll(stockRes.getViolations());
            } else {
                normalizedStock = stockRes.getNormalizedStock();
            }
        }

        // 4. Validate Price if creating or if present in payload
        Double normalizedPrice = null;
        if (isCreate || body.containsKey("price")) {
            Object rawPriceObj = body.get("price");
            if (rawPriceObj == null || String.valueOf(rawPriceObj).trim().isEmpty()) {
                if (isCreate) {
                    violations.add(new FieldViolation(
                            "price",
                            "PRICE_REQUIRED",
                            "Unit price is required.",
                            null
                    ));
                }
            } else {
                try {
                    double parsedPrice = Double.parseDouble(String.valueOf(rawPriceObj).trim());
                    if (Double.isNaN(parsedPrice) || Double.isInfinite(parsedPrice)) {
                        violations.add(new FieldViolation(
                                "price",
                                "PRICE_INVALID",
                                "Unit price must be a finite number.",
                                rawPriceObj
                        ));
                    } else if (parsedPrice < MIN_UNIT_PRICE || parsedPrice > MAX_UNIT_PRICE) {
                        violations.add(new FieldViolation(
                                "price",
                                "PRICE_OUT_OF_RANGE",
                                String.format(Locale.US, "Unit price must be between $%.2f and $%.2f (received %.2f).",
                                        MIN_UNIT_PRICE, MAX_UNIT_PRICE, parsedPrice),
                                parsedPrice
                        ));
                    } else {
                        normalizedPrice = Math.round(parsedPrice * 100.0) / 100.0;
                    }
                } catch (NumberFormatException e) {
                    violations.add(new FieldViolation(
                            "price",
                            "PRICE_INVALID",
                            "Unit price must be a valid numeric amount (received '" + rawPriceObj + "').",
                            rawPriceObj
                    ));
                }
            }
        }

        return new ValidationResult(
                violations.isEmpty(),
                normalizedSku,
                normalizedStock,
                normalizedPrice,
                violations
        );
    }

    /**
     * Final pre-persistence guard invoked before writing a {@link Product} to the JSON data store.
     */
    public void assertValidProductEntity(Product product, Collection<Product> existingProducts) {
        if (product == null) {
            throw new ProductValidationException("product", "PRODUCT_NULL", "Product entity cannot be null.", null);
        }
        List<FieldViolation> violations = new ArrayList<>();
        if (product.sku != null && !product.sku.isBlank()) {
            ValidationResult skuRes = validateSku(product.sku, true, product.id, existingProducts);
            if (!skuRes.isValid()) {
                violations.addAll(skuRes.getViolations());
            }
        }
        ValidationResult stockRes = validateStockQuantity(product.stockQuantity, true);
        if (!stockRes.isValid()) {
            violations.addAll(stockRes.getViolations());
        }
        if (!violations.isEmpty()) {
            throw new ProductValidationException(
                    violations.get(0).getCode(),
                    violations.get(0).getMessage(),
                    violations
            );
        }
    }
}
