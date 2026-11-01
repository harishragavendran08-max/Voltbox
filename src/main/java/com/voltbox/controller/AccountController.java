package com.voltbox.controller;

import com.voltbox.BillMailer;
import com.voltbox.CommunitySocket;
import com.voltbox.Store;
import com.voltbox.entity.Cart;
import com.voltbox.entity.ProductEntity;
import com.voltbox.model.Order;
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
        res.put("orderCount", u.orders.size());
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
