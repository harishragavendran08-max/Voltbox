package com.voltbox.controller;

import com.voltbox.BillMailer;
import com.voltbox.CommunitySocket;
import com.voltbox.Store;
import com.voltbox.model.Order;
import com.voltbox.model.Product;
import com.voltbox.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class AccountController {
    private final Store store;
    private final BillMailer mailer;
    private final CommunitySocket socket;

    @Value("${voltbox.donate.url:https://share.google/5TT6WxXqXBWnaoSIP}")
    private String donateUrl;

    @Value("${voltbox.donate.upi-id:harishragavendran08@okaxis}")
    private String upiId;

    @Value("${voltbox.donate.qr:donate-qr.jpeg}")
    private String donateQr;

    public AccountController(Store store, BillMailer mailer, CommunitySocket socket) {
        this.store = store;
        this.mailer = mailer;
        this.socket = socket;
    }

    private User authUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        return store.findByToken(authHeader.substring("Bearer ".length()).trim());
    }

    @GetMapping("/api/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String auth) {
        User u = authUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("name", u.name);
        res.put("email", u.email);
        res.put("initial", u.name.isEmpty() ? "?" : u.name.substring(0, 1).toUpperCase());
        res.put("avatarColor", u.avatarColor);
        res.put("billEmail", u.billEmail != null ? u.billEmail : "");
        res.put("mailReady", mailer.isReady());
        res.put("role", u.role);
        res.put("donateUrl", donateUrl);
        res.put("upiId", upiId);
        res.put("donateQr", donateQr);
        res.put("donateImages", Collections.emptyList());
        res.put("cart", u.cart);
        res.put("orderCount", u.orders.size());
        return ResponseEntity.ok(res);
    }

    @PutMapping("/api/cart")
    public ResponseEntity<?> saveCart(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody Map<String, Integer> incoming) {
        User u = authUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));

        u.cart.clear();
        if (incoming != null) {
            for (Map.Entry<String, Integer> e : incoming.entrySet()) {
                if (e.getValue() != null && e.getValue() > 0) {
                    u.cart.put(e.getKey(), e.getValue());
                }
            }
        }
        store.save();
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/api/checkout")
    public ResponseEntity<?> checkout(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));

        String shippingName = String.valueOf(body.getOrDefault("shippingName", "")).trim();
        String shippingAddress = String.valueOf(body.getOrDefault("shippingAddress", "")).trim();
        String promoCode = String.valueOf(body.getOrDefault("promoCode", "")).trim().toUpperCase();

        if (shippingName.isEmpty() || shippingAddress.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "Please enter your name and shipping address."));
        }
        if (u.cart.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "Your cart is empty."));
        }

        List<Order.Line> lines = new ArrayList<>();
        int count = 0;
        double sub = 0;
        for (Map.Entry<String, Integer> e : u.cart.entrySet()) {
            int pid = Integer.parseInt(e.getKey());
            int qty = e.getValue();
            Product p = store.findProduct(pid);
            if (p == null || qty <= 0) continue;
            Order.Line l = new Order.Line();
            l.productId = p.id;
            l.title = p.title;
            l.image = p.image;
            l.price = p.price;
            l.qty = qty;
            lines.add(l);
            count += qty;
            sub += p.price * qty;
            p.quantity = Math.max(0, p.quantity - qty);
            p.stock = p.quantity;
            p.lowStock = p.quantity < 5;
        }

        double promoDiscount = "VOLT10".equals(promoCode) ? Math.round(sub * 10.0) / 100.0 : 0.0;
        double discountedSub = Math.max(0, sub - promoDiscount);
        double tax = Math.round(discountedSub * 0.0825 * 100.0) / 100.0;
        double total = Math.round((discountedSub + tax) * 100.0) / 100.0;

        Order o = new Order();
        o.id = String.format("VB-%04X", System.currentTimeMillis() & 0xFFFF);
        o.placedAt = System.currentTimeMillis();
        o.count = count;
        o.subtotal = Math.round(sub * 100.0) / 100.0;
        o.promoDiscount = promoDiscount;
        o.discountTotal = promoDiscount;
        o.promoCode = promoDiscount > 0 ? promoCode : null;
        o.tax = tax;
        o.total = total;
        o.lines = lines;
        o.shippingName = shippingName;
        o.shippingAddress = shippingAddress;
        o.paymentMethod = "Card (demo)";
        o.amountPaid = total;

        u.orders.add(0, o);
        u.cart.clear();
        store.save();

        socket.broadcastToAll(Map.of("type", "catalog-changed", "activity", u.name + " checked out " + count + " item(s)"));
        return ResponseEntity.ok(Map.of("ok", true, "order", o));
    }

    @GetMapping("/api/orders")
    public ResponseEntity<?> orders(@RequestHeader(value = "Authorization", required = false) String auth) {
        User u = authUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));
        return ResponseEntity.ok(u.orders);
    }
}
