package com.voltbox.controller;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.voltbox.BillMailer;
import com.voltbox.Store;
import com.voltbox.model.Order;
import com.voltbox.model.Product;
import com.voltbox.model.User;
@RestController
@RequestMapping("/api")
public class AccountController {

    private static final double TAX_RATE = 0.0825;

    private final Store store;
    private final BillMailer mailer;
    @org.springframework.beans.factory.annotation.Value("${voltbox.donate-url:}")
    private String donateUrl;
    @org.springframework.beans.factory.annotation.Value("${voltbox.upi-id:}")
    private String upiId;

    @org.springframework.beans.factory.annotation.Value("${voltbox.donate-qr:}")
    private String donateQr;
    @org.springframework.beans.factory.annotation.Value("${voltbox.donate-images:}")
    private String donateImages;

    public AccountController(Store store, BillMailer mailer) {
        this.store = store;
        this.mailer = mailer;
    }
       @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String auth) {
        User user = store.findByToken(AuthController.bearerToken(auth));
        if (user == null) return notSignedIn();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name",        user.getName());
        body.put("email",       user.getEmail());
        body.put("initial",     user.getInitial());
        body.put("color",       user.getAvatarColor());
        body.put("role",        user.getRole());          // member / contributor / moderator
        body.put("billEmail",   user.getBillEmail());     // null until they link one
        body.put("cart",        user.getCart());
        body.put("orderCount",  user.getOrders().size());
        body.put("mailReady",   mailer.isReady());        // is emailing switched on?
        body.put("donateUrl",   donateUrl == null ? "" : donateUrl);
        body.put("upiId",       upiId == null ? "" : upiId);
        body.put("donateQr",    donateQr == null ? "" : donateQr);
        body.put("donateImages", splitDonateImages(donateImages));
        return ResponseEntity.ok(body);
    }

    private List<String> splitDonateImages(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return List.of();
        }
        String[] parts = raw.split(",");
        List<String> images = new ArrayList<>();
        for (String part : parts) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) {
                images.add(trimmed);
            }
        }
        return images;
    }

    @PutMapping("/cart")
    public ResponseEntity<?> saveCart(@RequestHeader(value = "Authorization", required = false) String auth,
                                      @RequestBody Map<String, Integer> cart) {
        User user = store.findByToken(AuthController.bearerToken(auth));
        if (user == null) return notSignedIn();

        Map<String, Integer> clean = new LinkedHashMap<>();
        if (cart != null) {
            for (Map.Entry<String, Integer> entry : cart.entrySet()) {
                if (entry.getValue() != null && entry.getValue() > 0 && findProduct(entry.getKey()) != null) {
                    clean.put(entry.getKey(), entry.getValue());
                }
            }
        }

        synchronized (store) {
            user.setCart(clean);
            store.save();
        }
        return ResponseEntity.ok(Map.of("ok", true));
    }


   

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestHeader(value = "Authorization", required = false) String auth,
                                      @RequestBody(required = false) CheckoutRequest req) {
        User user = store.findByToken(AuthController.bearerToken(auth));
        if (user == null) return notSignedIn();

        String shippingName = req == null || req.shippingName() == null ? "" : req.shippingName().trim();
        String shippingAddress = req == null || req.shippingAddress() == null ? "" : req.shippingAddress().trim();
        if (shippingName.isEmpty() || shippingAddress.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("ok", false, "message", "Add a name and address before paying."));
        }

        synchronized (store) {
          
            if (!user.getOrders().isEmpty()) {
                Order last = user.getOrders().get(user.getOrders().size() - 1);
                if (System.currentTimeMillis() - last.getPlacedAt() < 2000) {
                    return ResponseEntity.ok(last);
                }
            }

            if (user.getCart().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("ok", false, "message", "Your cart is empty."));
            }

            Order order = new Order();
            order.setPlacedAt(System.currentTimeMillis());
            order.setId(makeOrderId(order.getPlacedAt()));
            order.setShippingName(shippingName);
            order.setShippingAddress(shippingAddress);
            order.setPaymentMethod("Fake Pay");

            int count = 0;
            double subtotal = 0;

            for (Map.Entry<String, Integer> entry : user.getCart().entrySet()) {
                Product p = findProduct(entry.getKey());
                if (p == null) continue;              // product vanished from the shelf
                int qty = entry.getValue();

                order.getLines().add(new Order.Line(p.getId(), p.getTitle(), p.getImage(), p.getPrice(), qty));
                count    += qty;
                subtotal += p.getPrice() * qty;
            }

            double tax = round(subtotal * TAX_RATE);
            order.setCount(count);
            order.setSubtotal(round(subtotal));
            order.setTax(tax);
            order.setTotal(round(subtotal + tax));
            order.setAmountPaid(order.getTotal());
            order.setStatus("Pending");

            user.getOrders().add(order);
            user.getCart().clear();                    
            store.save();

            return ResponseEntity.ok(order);
        }
    }


    @GetMapping("/orders")
    public ResponseEntity<?> orders(@RequestHeader(value = "Authorization", required = false) String auth) {
        User user = store.findByToken(AuthController.bearerToken(auth));
        if (user == null) return notSignedIn();

        List<Order> newestFirst = new ArrayList<>(user.getOrders());
        java.util.Collections.reverse(newestFirst);
        return ResponseEntity.ok(newestFirst);
    }


   
    @PutMapping("/me/bill-email")
    public ResponseEntity<?> setBillEmail(@RequestHeader(value = "Authorization", required = false) String auth,
                                          @RequestBody BillEmailRequest req) {
        User user = store.findByToken(AuthController.bearerToken(auth));
        if (user == null) return notSignedIn();

        String address = req == null || req.email() == null ? "" : req.email().trim();
        if (address.isEmpty()) {
            user.setBillEmail(null);
            store.save();
            return ResponseEntity.ok(Map.of("ok", true, "billEmail", ""));
        }

        if (!address.contains("@")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("ok", false, "message", "That doesn't look like an email address."));
        }

        user.setBillEmail(address);
        store.save();
        return ResponseEntity.ok(Map.of("ok", true, "billEmail", address));
    }


    @PostMapping("/orders/{orderId}/email")
    public ResponseEntity<?> emailBill(@RequestHeader(value = "Authorization", required = false) String auth,
                                       @PathVariable String orderId) {
        User user = store.findByToken(AuthController.bearerToken(auth));
        if (user == null) return notSignedIn();

        Order order = null;
        for (Order o : user.getOrders()) {
            if (o.getId().equals(orderId)) {
                order = o;
                break;
            }
        }
        if (order == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("ok", false, "message", "Order not found."));
        }
        try {
            mailer.send(user.getBillEmail(), user.getName(), order);
            return ResponseEntity.ok(Map.of("ok", true, "sentTo", user.getBillEmail()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("ok", false, "message", "Couldn't send the email."));
        }
    }


    // ── admin: list all orders across users (moderator only)
    @GetMapping("/admin/orders")
    public ResponseEntity<?> adminOrders(@RequestHeader(value = "Authorization", required = false) String auth) {
        User user = store.findByToken(AuthController.bearerToken(auth));
        if (user == null) return notSignedIn();
        if (!"moderator".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("ok", false, "message", "Forbidden"));
        }

        List<Map<String, Object>> out = new ArrayList<>();
        for (User u : store.getUsers()) {
            for (Order o : u.getOrders()) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", o.getId());
                m.put("placedAt", o.getPlacedAt());
                m.put("count", o.getCount());
                m.put("total", o.getTotal());
                m.put("status", o.getStatus());
                m.put("owner", Map.of("email", u.getEmail(), "name", u.getName()));
                out.add(m);
            }
        }
        // newest first
        out.sort((a,b) -> Long.compare((Long)b.get("placedAt"), (Long)a.get("placedAt")));
        return ResponseEntity.ok(out);
    }

    // ── admin: update order status
    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(@RequestHeader(value = "Authorization", required = false) String auth,
                                               @PathVariable String orderId,
                                               @RequestBody Map<String, String> body) {
        User user = store.findByToken(AuthController.bearerToken(auth));
        if (user == null) return notSignedIn();
        if (!"moderator".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("ok", false, "message", "Forbidden"));
        }
        String status = body == null ? null : body.get("status");
        if (status == null || status.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("ok", false, "message", "Missing status"));
        }
        synchronized (store) {
            for (User u : store.getUsers()) {
                for (Order o : u.getOrders()) {
                    if (o.getId().equals(orderId)) {
                        o.setStatus(status.trim());
                        store.save();
                        return ResponseEntity.ok(Map.of("ok", true, "id", orderId, "status", o.getStatus()));
                    }
                }
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("ok", false, "message", "Order not found"));
    }

    private ResponseEntity<Map<String, Object>> notSignedIn() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("ok", false, "message", "You're not signed in."));
    }

    private Product findProduct(String id) {
        int productId;
        try {
            productId = Integer.parseInt(id);
        } catch (NumberFormatException e) {
            return null;
        }
        Product p = store.findProduct(productId);
        return (p == null || p.isTakenDown()) ? null : p;
    }

    private static String makeOrderId(long millis) {
        String seed = Long.toHexString(millis % 65536).toUpperCase();
        while (seed.length() < 4) seed = "0" + seed;
        return "VB-" + seed;
    }

  
    private static double round(double n) {
        return Math.round(n * 100.0) / 100.0;
    }

    public record BillEmailRequest(String email) {}


    public record CheckoutRequest(String shippingName, String shippingAddress) {}
}
