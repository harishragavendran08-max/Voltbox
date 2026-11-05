package com.voltbox.service;

import com.voltbox.Store;
import com.voltbox.entity.Cart;
import com.voltbox.entity.CartItem;
import com.voltbox.model.Product;
import com.voltbox.model.User;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class CartService {
    public static final double DEFAULT_TAX_RATE = 0.0825;
    public static final double RIG_BUNDLE_DISCOUNT_RATE = 0.05;

    public static final Map<String, Double> PROMO_RATES = Map.of(
            "VOLT10", 0.10,
            "BUILDER5", 0.05
    );

    private final Store store;
    private final ProductService productService;
    private final RigPowerEstimatorService powerEstimatorService;

    public CartService(Store store, ProductService productService, RigPowerEstimatorService powerEstimatorService) {
        this.store = store;
        this.productService = productService;
        this.powerEstimatorService = powerEstimatorService;
    }

    public Cart buildCartEntity(User user, String promoCode) {
        Map<String, Integer> rawMap = user.cart != null ? user.cart : new LinkedHashMap<>();
        Map<String, Integer> cleanRaw = new LinkedHashMap<>();
        List<CartItem> items = new ArrayList<>();

        boolean hasCpu = false;
        boolean hasGpu = false;
        boolean hasMotherboard = false;
        boolean hasStorage = false;

        int count = 0;
        double subtotal = 0.0;

        for (Map.Entry<String, Integer> entry : rawMap.entrySet()) {
            int qty = entry.getValue() != null ? entry.getValue() : 0;
            if (qty <= 0) continue;

            int productId;
            try {
                productId = Integer.parseInt(entry.getKey());
            } catch (NumberFormatException e) {
                continue;
            }

            Product p = store.findProduct(productId);
            if (p == null || p.takenDown) continue;

            cleanRaw.put(String.valueOf(p.id), qty);
            String group = productService.classifyComponentGroup(p);
            String sku = productService.computeSku(p);
            int stock = productService.resolveQuantity(p);
            boolean lowStock = stock < ProductService.LOW_STOCK_THRESHOLD;
            double lineSub = ProductService.roundMoney(p.price * qty);

            if ("cpus".equals(group)) hasCpu = true;
            else if ("gpus".equals(group)) hasGpu = true;
            else if ("motherboards".equals(group)) hasMotherboard = true;
            else if ("storage".equals(group)) hasStorage = true;

            count += qty;
            subtotal += p.price * qty;

            items.add(new CartItem(
                    p.id,
                    sku,
                    p.title,
                    p.category,
                    group,
                    p.image,
                    p.price,
                    qty,
                    stock,
                    lowStock,
                    lineSub
            ));
        }

        double roundedSub = ProductService.roundMoney(subtotal);
        int coreCount = (hasCpu ? 1 : 0) + (hasGpu ? 1 : 0) + (hasMotherboard ? 1 : 0) + (hasStorage ? 1 : 0);
        boolean qualifiesForBundle = coreCount >= 3;
        double rigDiscount = qualifiesForBundle ? ProductService.roundMoney(roundedSub * RIG_BUNDLE_DISCOUNT_RATE) : 0.0;

        String cleanPromo = promoCode != null ? promoCode.trim().toUpperCase(Locale.ROOT) : "";
        Double promoRate = PROMO_RATES.get(cleanPromo);
        double promoDiscount = promoRate != null ? ProductService.roundMoney(roundedSub * promoRate) : 0.0;

        double discountTotal = ProductService.roundMoney(Math.min(roundedSub, rigDiscount + promoDiscount));
        double discountedSub = ProductService.roundMoney(Math.max(0.0, roundedSub - discountTotal));
        double tax = ProductService.roundMoney(discountedSub * DEFAULT_TAX_RATE);
        double total = ProductService.roundMoney(discountedSub + tax);

        Cart.RigBundleState rigBundle = new Cart.RigBundleState();
        rigBundle.hasCpu = hasCpu;
        rigBundle.hasGpu = hasGpu;
        rigBundle.hasMotherboard = hasMotherboard;
        rigBundle.hasStorage = hasStorage;
        rigBundle.completedCoreCount = coreCount;
        rigBundle.qualifiesForBundle = qualifiesForBundle;
        rigBundle.discountRate = qualifiesForBundle ? RIG_BUNDLE_DISCOUNT_RATE : 0.0;

        Cart.PowerEstimateState powerEstimate = powerEstimatorService.estimateSystemPower(items);

        Cart cart = new Cart();
        cart.setUserEmail(user.email);
        cart.setRawCart(cleanRaw);
        cart.setItems(items);
        cart.setCount(count);
        cart.setSubtotal(roundedSub);
        cart.setRigDiscount(rigDiscount);
        cart.setPromoDiscount(promoDiscount);
        cart.setDiscountTotal(discountTotal);
        cart.setDiscountedSubtotal(discountedSub);
        cart.setTaxRate(DEFAULT_TAX_RATE);
        cart.setTax(tax);
        cart.setTotal(total);
        cart.setAppliedPromo(promoRate != null ? cleanPromo : null);
        cart.setRigBundle(rigBundle);
        cart.setPowerEstimate(powerEstimate);
        cart.setUpdatedAt(System.currentTimeMillis());
        return cart;
    }

    public synchronized Cart replaceCart(User user, Map<String, Integer> incoming, String promoCode) {
        user.cart.clear();
        if (incoming != null) {
            for (Map.Entry<String, Integer> entry : incoming.entrySet()) {
                Integer val = entry.getValue();
                if (val == null || val <= 0) continue;
                try {
                    int pid = Integer.parseInt(entry.getKey());
                    Product p = store.findProduct(pid);
                    if (p != null && !p.takenDown) {
                        user.cart.put(String.valueOf(pid), val);
                    }
                } catch (NumberFormatException ignored) {}
            }
        }
        store.save();
        return buildCartEntity(user, promoCode);
    }

    public synchronized Cart upsertCartItem(User user, int productId, int quantity, boolean incremental, String promoCode) {
        Product p = store.findProduct(productId);
        if (p == null || p.takenDown) return null;

        String key = String.valueOf(productId);
        int current = user.cart.getOrDefault(key, 0);
        int next = incremental ? (current + quantity) : quantity;

        if (next <= 0) {
            user.cart.remove(key);
        } else {
            user.cart.put(key, next);
        }
        store.save();
        return buildCartEntity(user, promoCode);
    }

    public synchronized Cart removeCartItem(User user, int productId, String promoCode) {
        user.cart.remove(String.valueOf(productId));
        store.save();
        return buildCartEntity(user, promoCode);
    }

    public synchronized Cart clearCart(User user) {
        user.cart.clear();
        store.save();
        return buildCartEntity(user, null);
    }

    public synchronized Cart applyStarterRigBundle(User user, String promoCode) {
        List<Product> starterParts = powerEstimatorService.recommendStarterRigBundle(store.getProducts());
        for (Product part : starterParts) {
            String key = String.valueOf(part.id);
            user.cart.put(key, Math.max(1, user.cart.getOrDefault(key, 0)));
        }
        store.save();
        return buildCartEntity(user, promoCode);
    }
}
