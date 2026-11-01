package com.voltbox.controller;

import com.voltbox.CommunitySocket;
import com.voltbox.Store;
import com.voltbox.model.Application;
import com.voltbox.model.Product;
import com.voltbox.model.Report;
import com.voltbox.model.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
public class CommunityController {
    private final Store store;
    private final CommunitySocket socket;

    public CommunityController(Store store, CommunitySocket socket) {
        this.store = store;
        this.socket = socket;
    }

    private User authUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        return store.findByToken(authHeader.substring("Bearer ".length()).trim());
    }

    @PostMapping("/api/products")
    public ResponseEntity<?> addProduct(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));
        if (!"contributor".equals(u.role) && !"moderator".equals(u.role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("ok", false, "message", "Only contributors can add listings."));
        }

        Product p = new Product();
        p.title = String.valueOf(body.getOrDefault("title", "")).trim();
        p.price = Double.parseDouble(String.valueOf(body.getOrDefault("price", "0")));
        p.category = String.valueOf(body.getOrDefault("category", "components")).trim();
        p.image = String.valueOf(body.getOrDefault("image", "")).trim();
        p.description = String.valueOf(body.getOrDefault("description", "")).trim();
        p.quantity = Integer.parseInt(String.valueOf(body.getOrDefault("quantity", "8")));
        p.stock = p.quantity;
        p.lowStock = p.quantity < 5;
        p.addedByName = u.name;
        p.addedByColor = u.avatarColor;
        p.addedByEmail = u.email;
        p.official = false;

        Product created = store.addProduct(p);
        socket.broadcastToAll(Map.of("type", "catalog-changed", "activity", u.name + " added " + created.title));
        return ResponseEntity.ok(Map.of("ok", true, "product", created));
    }

    @GetMapping("/api/applications")
    public ResponseEntity<?> getApplications(@RequestHeader(value = "Authorization", required = false) String auth) {
        User u = authUser(auth);
        if (u == null || !"moderator".equals(u.role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("ok", false));
        }
        List<Application> pending = store.getApplications().stream()
                .filter(a -> "pending".equals(a.status))
                .collect(Collectors.toList());
        return ResponseEntity.ok(pending);
    }

    @GetMapping("/api/reports")
    public ResponseEntity<?> getReports(@RequestHeader(value = "Authorization", required = false) String auth) {
        User u = authUser(auth);
        if (u == null || !"moderator".equals(u.role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("ok", false));
        }
        List<Report> open = store.getReports().stream()
                .filter(r -> "open".equals(r.status))
                .collect(Collectors.toList());
        return ResponseEntity.ok(open);
    }
}
