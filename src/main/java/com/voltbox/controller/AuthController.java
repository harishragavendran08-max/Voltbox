package com.voltbox.controller;

import com.voltbox.Store;
import com.voltbox.model.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class AuthController {
    private final Store store;

    public AuthController(Store store) {
        this.store = store;
    }

    @PostMapping("/api/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, String> body) {
        String name = body.getOrDefault("name", "").trim();
        String email = body.getOrDefault("email", "").trim();
        String password = body.getOrDefault("password", "");

        if (name.isEmpty() || email.isEmpty() || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "Name, email, and password are all required."));
        }
        if (!email.contains("@")) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "That doesn't look like an email address."));
        }
        if (password.length() < 4) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "Password needs to be at least 4 characters."));
        }
        if (store.findByEmail(email) != null) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "An account with that email already exists."));
        }

        User u = store.add(name, email, password);
        return ResponseEntity.ok(Map.of(
            "ok", true,
            "token", store.startSession(u),
            "name", u.name,
            "email", u.email
        ));
    }

    @PostMapping("/api/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", "").trim();
        String password = body.getOrDefault("password", "");
        User u = store.findByEmail(email);
        if (u != null && u.password.equals(password)) {
            return ResponseEntity.ok(Map.of(
                "ok", true,
                "token", store.startSession(u),
                "name", u.name,
                "email", u.email
            ));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("ok", false, "message", "Wrong email or password."));
    }

    @PostMapping("/api/logout")
    public Map<String, Object> logout(@RequestHeader(value = "Authorization", required = false) String auth) {
        if (auth != null && auth.startsWith("Bearer ")) {
            store.endSession(auth.substring("Bearer ".length()).trim());
        }
        return Map.of("ok", true);
    }
}
