package com.voltbox.controller;

import com.voltbox.BillMailer;
import com.voltbox.CommunitySocket;
import com.voltbox.Store;
import com.voltbox.entity.Cart;
import com.voltbox.entity.ProductEntity;
import com.voltbox.model.Order;
import com.voltbox.model.PriceAlert;
import com.voltbox.model.Product;
import com.voltbox.model.User;
import com.voltbox.service.CartService;
import com.voltbox.service.InventoryService;
import com.voltbox.service.ProductService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
public class AccountController {
    private final Store store;
    private final BillMailer mailer;
    private final CommunitySocket socket;
    private final CartService cartService;
    private final InventoryService inventoryService;
    private final ProductService productService;

    @Value("${voltbox.donate.url:https://share.google/5TT6WxXqXBWnaoSIP}")
    private String donateUrl;

    @Value("${voltbox.donate.upi-id:harishragavendran08@okaxis}")
    private String upiId;

    @Value("${voltbox.donate.qr:donate-qr.jpeg}")
    private String donateQr;

    public AccountController(
            Store store,
            BillMailer mailer,
            CommunitySocket socket,
            CartService cartService,
            InventoryService inventoryService,
            ProductService productService) {
        this.store = store;
        this.mailer = mailer;
        this.socket = socket;
        this.cartService = cartService;
        this.inventoryService = inventoryService;
        this.productService = productService;
    }

    private User authUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        return store.findByToken(authHeader.substring("Bearer ".length()).trim());
    }

    private boolean canContribute(User u) {
        return u != null && ("contributor".equals(u.role) || "moderator".equals(u.role));
    }

    @GetMapping("/api/my-products")
    public ResponseEntity<?> getMyProducts(
            @RequestHeader(value = "Authorization", required = false) String auth) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));
        }
        if (!canContribute(u)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("ok", false, "message", "Only contributors have an upload history."));
        }

        List<ProductEntity> mine = store.getProducts().stream()
                .filter(p -> p.addedByEmail != null && p.addedByEmail.equalsIgnoreCase(u.email))
                .map(productService::enrich)
                .collect(Collectors.toList());
        Collections.reverse(mine);
        return ResponseEntity.ok(mine);
    }

    @GetMapping("/api/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String auth) {
        User u = authUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));

        boolean isAdmin = "moderator".equalsIgnoreCase(u.role) || "admin".equalsIgnoreCase(u.role);
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("name", u.name);
        res.put("email", u.email);
        res.put("initial", u.name.isEmpty() ? "?" : u.name.substring(0, 1).toUpperCase());
        res.put("color", u.avatarColor);
        res.put("avatarColor", u.avatarColor);
        res.put("billEmail", u.billEmail != null ? u.billEmail : "");
        res.put("mailReady", mailer.isReady());
        res.put("role", u.role);
        res.put("isAdmin", isAdmin);
        res.put("canAccessAdminDashboard", isAdmin);
        res.put("donateUrl", donateUrl);
        res.put("upiId", upiId);
        res.put("donateQr", donateQr);
        res.put("donateImages", Collections.emptyList());
        res.put("cart", u.cart);
        res.put("cartDetails", cartService.buildCartEntity(u, null));
        res.put("wishlist", u.wishlist != null ? u.wishlist : Collections.emptyList());
        res.put("priceAlerts", u.priceAlerts != null ? u.priceAlerts : Collections.emptyList());
        res.put("orderCount", u.orders.size());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/api/price-alerts")
    public ResponseEntity<?> getPriceAlerts(@RequestHeader(value = "Authorization", required = false) String auth) {
        User u = authUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));
        List<PriceAlert> alerts = u.priceAlerts != null ? u.priceAlerts : Collections.emptyList();
        return ResponseEntity.ok(Map.of("ok", true, "count", alerts.size(), "alerts", alerts));
    }

    @PostMapping({"/api/price-alerts", "/api/products/{id}/price-alert"})
    public ResponseEntity<?> upsertPriceAlert(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable(value = "id", required = false) Integer pathId,
            @RequestBody Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));

        int productId = pathId != null ? pathId : 0;
        if (productId <= 0 && body.get("productId") != null) {
            try {
                productId = Integer.parseInt(String.valueOf(body.get("productId")));
            } catch (NumberFormatException ignored) {}
        }
        Product p = store.findProduct(productId);
        if (p == null || p.takenDown) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("ok", false, "message", "Product not found."));
        }

        String rawEmail = body.get("email") != null ? String.valueOf(body.get("email")).trim() : "";
        if (rawEmail.isEmpty()) {
            rawEmail = (u.billEmail != null && !u.billEmail.isBlank()) ? u.billEmail : u.email;
        }
        rawEmail = rawEmail.toLowerCase();
        if (!rawEmail.contains("@") || !rawEmail.contains(".")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "Please enter a valid email address to receive price drop alerts."));
        }

        double targetPrice = 0;
        Object rawTarget = body.containsKey("targetPrice") ? body.get("targetPrice") : body.get("threshold");
        if (rawTarget != null) {
            try {
                targetPrice = Math.round(Double.parseDouble(String.valueOf(rawTarget)) * 100.0) / 100.0;
            } catch (NumberFormatException ignored) {}
        }
        if (targetPrice <= 0) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "Please enter a target price threshold greater than $0.00."));
        }

        if (u.priceAlerts == null) u.priceAlerts = new ArrayList<>();
        final int pid = p.id;
        PriceAlert existing = u.priceAlerts.stream().filter(a -> a.productId == pid).findFirst().orElse(null);
        boolean isUpdate = existing != null;
        PriceAlert alert = existing != null ? existing : new PriceAlert();
        if (!isUpdate) {
            alert.id = "PA-" + p.id + "-" + Long.toString(System.currentTimeMillis() % 100000, 36).toUpperCase();
            u.priceAlerts.add(0, alert);
        }
        ProductEntity enriched = productService.enrich(p);
        alert.productId = p.id;
        alert.productTitle = p.title;
        alert.sku = enriched.getSku();
        alert.email = rawEmail;
        alert.targetPrice = targetPrice;
        alert.priceAtCreation = p.price;
        alert.createdAt = System.currentTimeMillis();
        alert.triggered = p.price <= targetPrice;
        alert.triggeredAt = alert.triggered ? alert.createdAt : null;
        alert.triggeredPrice = alert.triggered ? p.price : null;

        Map<String, Object> emailNotification = null;
        if (alert.triggered) {
            emailNotification = mailer.sendPriceDropAlert(alert, p.price);
        }
        store.save();

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("ok", true);
        res.put("isUpdate", isUpdate);
        res.put("subscription", alert);
        res.put("alerts", u.priceAlerts);
        res.put("emailNotification", emailNotification);
        res.put("message", emailNotification != null
                ? String.format("Price alert active & instant email dispatched to %s (%s is already $%.2f!)", rawEmail, p.title, p.price)
                : String.format("Price alert set! We'll email %s as soon as %s drops below $%.2f.", rawEmail, p.title, targetPrice));
        return ResponseEntity.ok(res);
    }

    @DeleteMapping({"/api/price-alerts/{productId}", "/api/products/{productId}/price-alert"})
    public ResponseEntity<?> deletePriceAlert(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable("productId") int productId) {
        User u = authUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));
        boolean removed = u.priceAlerts != null && u.priceAlerts.removeIf(a -> a.productId == productId);
        store.save();
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "removed", removed,
                "productId", productId,
                "alerts", u.priceAlerts != null ? u.priceAlerts : Collections.emptyList(),
                "message", "Price drop alert removed."));
    }

    @PostMapping("/api/price-alerts/{productId}/simulate-drop")
    public ResponseEntity<?> simulatePriceDrop(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable("productId") int productId,
            @RequestBody(required = false) Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));

        Product p = store.findProduct(productId);
        if (p == null || p.takenDown) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("ok", false, "message", "Product not found."));
        }
        if (u.priceAlerts == null) u.priceAlerts = new ArrayList<>();
        PriceAlert alert = u.priceAlerts.stream().filter(a -> a.productId == productId).findFirst().orElse(null);
        if (alert == null) {
            alert = new PriceAlert();
            alert.id = "PA-" + p.id + "-" + Long.toString(System.currentTimeMillis() % 100000, 36).toUpperCase();
            alert.productId = p.id;
            alert.productTitle = p.title;
            alert.sku = productService.enrich(p).getSku();
            alert.email = (u.billEmail != null && !u.billEmail.isBlank()) ? u.billEmail : u.email;
            alert.targetPrice = Math.round(p.price * 0.95 * 100.0) / 100.0;
            alert.priceAtCreation = p.price;
            alert.createdAt = System.currentTimeMillis();
            u.priceAlerts.add(0, alert);
        }

        double previousPrice = p.price;
        double simulatedNewPrice = Math.max(1.0, Math.round((alert.targetPrice - Math.max(1.0, alert.targetPrice * 0.03)) * 100.0) / 100.0);
        if (body != null && body.get("newPrice") != null) {
            try {
                double reqP = Double.parseDouble(String.valueOf(body.get("newPrice")));
                if (reqP > 0) simulatedNewPrice = Math.round(reqP * 100.0) / 100.0;
            } catch (NumberFormatException ignored) {}
        }

        p.price = simulatedNewPrice;
        alert.triggered = simulatedNewPrice <= alert.targetPrice;
        alert.triggeredAt = System.currentTimeMillis();
        alert.triggeredPrice = simulatedNewPrice;

        Map<String, Object> emailNotification = mailer.sendPriceDropAlert(alert, simulatedNewPrice);
        store.save();

        ProductEntity enriched = productService.enrich(p);
        socket.broadcastToAll(Map.of("type", "product-restocked", "product", enriched, "actor", "Voltbox Price Watch"));

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("ok", true);
        res.put("previousPrice", previousPrice);
        res.put("newPrice", simulatedNewPrice);
        res.put("product", enriched);
        res.put("subscription", alert);
        res.put("alerts", u.priceAlerts);
        res.put("emailNotification", emailNotification);
        res.put("message", String.format("Price dropped to $%.2f! Email alert sent to %s.", simulatedNewPrice, alert.email));
        return ResponseEntity.ok(res);
    }

    @PostMapping("/api/checkout")
    public ResponseEntity<?> checkout(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));

        String shippingName = String.valueOf(body.getOrDefault("shippingName", "")).trim();
        String shippingAddress = String.valueOf(body.getOrDefault("shippingAddress", "")).trim();
        String promoCode = body.get("promoCode") != null
                ? String.valueOf(body.get("promoCode")).trim().toUpperCase()
                : null;

        if (shippingName.isEmpty() || shippingAddress.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "Add a name and address before paying."));
        }
        if (u.cart == null || u.cart.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "Your cart is empty."));
        }

        Cart computedCart = cartService.buildCartEntity(u, promoCode);
        if (computedCart.getItems().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "Your cart is empty."));
        }

        long placedAt = System.currentTimeMillis();
        String orderId = String.format("VB-%04X", placedAt & 0xFFFF);

        List<Order.Line> lines = new ArrayList<>();
        for (Map.Entry<String, Integer> e : u.cart.entrySet()) {
            int pid = Integer.parseInt(e.getKey());
            int qty = e.getValue();
            Product p = store.findProduct(pid);
            if (p == null || p.takenDown || qty <= 0) continue;

            Order.Line l = new Order.Line();
            l.productId = p.id;
            l.title = p.title;
            l.image = p.image;
            l.price = p.price;
            l.qty = qty;
            lines.add(l);

            inventoryService.deductStockForOrder(p, qty, u.name, orderId);
        }

        Order o = new Order();
        o.id = orderId;
        o.placedAt = placedAt;
        o.count = computedCart.getCount();
        o.subtotal = computedCart.getSubtotal();
        o.rigDiscount = computedCart.getRigDiscount();
        o.promoDiscount = computedCart.getPromoDiscount();
        o.discountTotal = computedCart.getDiscountTotal();
        o.promoCode = computedCart.getAppliedPromo();
        o.tax = computedCart.getTax();
        o.total = computedCart.getTotal();
        o.lines = lines;
        o.shippingName = shippingName;
        o.shippingAddress = shippingAddress;
        o.paymentMethod = "Fake Pay";
        o.status = "Pending";
        o.amountPaid = computedCart.getTotal();

        u.orders.add(o);
        u.cart.clear();
        store.save();

        socket.broadcastToAll(Map.of(
                "type", "activity-feed",
                "message", String.format("%s checked out %d part%s (%s)", u.name, o.count, o.count == 1 ? "" : "s", o.id),
                "timestamp", placedAt
        ));
        return ResponseEntity.ok(o);
    }

    @GetMapping("/api/orders")
    public ResponseEntity<?> orders(@RequestHeader(value = "Authorization", required = false) String auth) {
        User u = authUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));
        List<Order> copy = new ArrayList<>(u.orders);
        Collections.reverse(copy);
        return ResponseEntity.ok(copy);
    }

    @PutMapping("/api/me/bill-email")
    public ResponseEntity<?> updateBillEmail(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));

        String address = String.valueOf(body.getOrDefault("email", "")).trim();
        if (address.isEmpty()) {
            u.billEmail = null;
            store.save();
            return ResponseEntity.ok(Map.of("ok", true, "billEmail", ""));
        }
        if (!address.contains("@")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "That doesn't look like an email address."));
        }
        u.billEmail = address;
        store.save();
        return ResponseEntity.ok(Map.of("ok", true, "billEmail", address));
    }

    @PostMapping("/api/orders/{orderId}/email")
    public ResponseEntity<?> emailOrder(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable("orderId") String orderId) {
        User u = authUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));

        Order found = u.orders.stream().filter(o -> orderId.equals(o.id)).findFirst().orElse(null);
        if (found == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("ok", false, "message", "Order not found."));
        }
        String recipient = (u.billEmail != null && !u.billEmail.isBlank()) ? u.billEmail : u.email;
        return ResponseEntity.ok(Map.of("ok", true, "sentTo", recipient));
    }
}
