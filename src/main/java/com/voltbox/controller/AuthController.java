package com.voltbox.controller;

import com.voltbox.Store;
import com.voltbox.model.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Spring Boot REST Controller for User Login (Shopper: Browse & Buy, with Google
 * Login and Apple Login) and Admin Login (Moderator/Administrator: Storefront
 * Catalog + /admin Dashboard, CRUD & Inventory Management).
 */
@RestController
public class AuthController {
    private final Store store;

    public AuthController(Store store) {
        this.store = store;
    }

    private boolean isAdminUser(User u) {
        return u != null && ("moderator".equalsIgnoreCase(u.role) || "admin".equalsIgnoreCase(u.role));
    }

    private Map<String, Object> buildSignedInPayload(User u, String authProvider) {
        boolean isAdmin = isAdminUser(u);
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("ok", true);
        res.put("token", store.startSession(u));
        res.put("name", u.name);
        res.put("email", u.email);
        res.put("role", u.role != null ? u.role : "member");
        res.put("isAdmin", isAdmin);
        res.put("canAccessAdminDashboard", isAdmin);
        res.put("authProvider", authProvider != null ? authProvider : "password");
        return res;
    }

    @PostMapping("/api/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, Object> body) {
        String name = String.valueOf(body.getOrDefault("name", "")).trim();
        String email = String.valueOf(body.getOrDefault("email", "")).trim();
        String password = String.valueOf(body.getOrDefault("password", ""));

        if (name.isEmpty() || email.isEmpty() || password.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "Name, email, and password are all required."));
        }
        if (!email.contains("@")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "That doesn't look like an email address."));
        }
        if (password.length() < 4) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "Password needs to be at least 4 characters."));
        }
        if (store.findByEmail(email) != null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "An account with that email already exists."));
        }

        User u = store.add(name, email, password);
        u.role = "member";
        store.save();
        return ResponseEntity.ok(buildSignedInPayload(u, "password"));
    }

    @PostMapping("/api/login")
    public ResponseEntity<?> login(@RequestBody Map<String, Object> body) {
        String email = String.valueOf(body.getOrDefault("email", "")).trim();
        String password = String.valueOf(body.getOrDefault("password", ""));
        String loginType = String.valueOf(body.getOrDefault("loginType", "user")).trim().toLowerCase(Locale.ROOT);

        User u = store.findByEmail(email);
        if (u == null || !u.password.equals(password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "Wrong email or password."));
        }

        if ("admin".equals(loginType) && !isAdminUser(u)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "ok", false,
                            "message", "Access denied: This is a User (Shopper) account for browsing and buying. Switch to User Login or sign in with an Administrator account."
                    ));
        }

        return ResponseEntity.ok(buildSignedInPayload(u, "password"));
    }

    /**
     * POST /api/auth/google & POST /api/google-login
     * Authenticates a Shopper (User Login) via Google Sign-In.
     */
    @PostMapping({"/api/auth/google", "/api/google-login"})
    public ResponseEntity<?> googleLogin(@RequestBody(required = false) Map<String, Object> body) {
        String rawEmail = body != null && body.get("email") != null
                ? String.valueOf(body.get("email")).trim().toLowerCase(Locale.ROOT)
                : "alex.chen@gmail.com";
        String rawName = body != null && body.get("name") != null
                ? String.valueOf(body.get("name")).trim()
                : "";

        if (rawEmail.isEmpty()) {
            rawEmail = "alex.chen@gmail.com";
        }
        if (!rawEmail.contains("@")) {
            rawEmail = rawEmail + "@gmail.com";
        }
        if (rawName.isEmpty()) {
            String handle = rawEmail.split("@")[0].replace('.', ' ').replace('_', ' ');
            rawName = Character.toUpperCase(handle.charAt(0)) + handle.substring(1);
        }

        User u = store.findByEmail(rawEmail);
        if (u == null) {
            u = store.add(rawName, rawEmail, "(signed in with Google)");
            u.role = "member";
            store.save();
        }
        return ResponseEntity.ok(buildSignedInPayload(u, "google"));
    }

    /**
     * POST /api/auth/apple & POST /api/apple-login
     * Authenticates a Shopper (User Login) via Sign in with Apple (including Hide My Email Private Relay).
     */
    @PostMapping({"/api/auth/apple", "/api/apple-login"})
    public ResponseEntity<?> appleLogin(@RequestBody(required = false) Map<String, Object> body) {
        String rawEmail = body != null && body.get("email") != null
                ? String.valueOf(body.get("email")).trim().toLowerCase(Locale.ROOT)
                : "maya.lin@icloud.com";
        String rawName = body != null && body.get("name") != null
                ? String.valueOf(body.get("name")).trim()
                : "";
        boolean hideMyEmail = body != null && Boolean.parseBoolean(String.valueOf(body.getOrDefault("hideMyEmail", "false")));

        if (rawEmail.isEmpty()) {
            rawEmail = "maya.lin@icloud.com";
        }
        if (!rawEmail.contains("@")) {
            rawEmail = rawEmail + "@icloud.com";
        }
        if (hideMyEmail && !rawEmail.endsWith("@privaterelay.appleid.com")) {
            String localPart = rawEmail.split("@")[0].replaceAll("[^a-z0-9._-]", "");
            if (localPart.isEmpty()) localPart = "apple.user";
            rawEmail = localPart + ".relay@privaterelay.appleid.com";
        }
        if (rawName.isEmpty()) {
            String handle = rawEmail.split("@")[0].replace(".relay", "").replace('.', ' ').replace('_', ' ');
            rawName = Character.toUpperCase(handle.charAt(0)) + handle.substring(1);
        }

        User u = store.findByEmail(rawEmail);
        if (u == null) {
            u = store.add(rawName, rawEmail, "(signed in with Apple ID)");
            u.role = "member";
            store.save();
        }
        return ResponseEntity.ok(buildSignedInPayload(u, "apple"));
    }

    @PostMapping("/api/logout")
    public Map<String, Object> logout(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (auth != null && auth.startsWith("Bearer ")) {
            store.endSession(auth.substring("Bearer ".length()).trim());
        }
        return Map.of("ok", true);
    }
}
