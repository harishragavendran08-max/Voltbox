package com.voltbox.controller;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltbox.Store;
import com.voltbox.model.User;


@RestController
@RequestMapping("/api")
public class AuthController {

    private final Store store;

    public AuthController(Store store) {
        this.store = store;
    }


    @Value("${google.client-id:}")
    private String googleClientId;




    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody SignupRequest req) {

        String name     = req == null ? null : trim(req.name());
        String email    = req == null ? null : trim(req.email());
        String password = req == null ? null : req.password();

      
        if (isBlank(name) || isBlank(email) || isBlank(password)) {
            return badRequest("Name, email, and password are all required.");
        }
        if (!email.contains("@")) {
            return badRequest("That doesn't look like an email address.");
        }
        if (password.length() < 4) {
            return badRequest("Password needs to be at least 4 characters.");
        }
        if (store.findByEmail(email) != null) {
            return badRequest("An account with that email already exists.");
        }

        User user = store.add(name, email, password);

        // signing up logs you straight in — no separate "now go log in" step
        return ResponseEntity.ok(signedIn(user));
    }


    // ── sign in to an existing account ──

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest req) {

        String email    = req == null ? null : trim(req.email());
        String password = req == null ? null : req.password();

        User user = store.findByEmail(email);
        boolean ok = user != null && user.getPassword().equals(password);

        if (ok) {
            // 200 OK + a fresh session token the shop will use from now on
            return ResponseEntity.ok(signedIn(user));
        }

        // 401 Unauthorized — wrong email or password (or no such account)
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("ok", false, "message", "Wrong email or password."));
    }



    @PostMapping("/google-login")
    public ResponseEntity<Map<String, Object>> googleLogin(@RequestBody GoogleLoginRequest req) {

        String credential = req == null ? null : req.credential();

        if (isBlank(credential)) {
            return badRequest("Missing Google credential.");
        }
        if (isBlank(googleClientId)) {
           
            return badRequest("Google sign-in isn't set up on this server yet.");
        }

        Map<?, ?> payload;
        try {
            payload = verifyGoogleToken(credential);
        } catch (Exception e) {
            return badRequest("Couldn't verify that Google sign-in — try again.");
        }

        if (!googleClientId.equals(payload.get("aud"))) {
            return badRequest("That Google sign-in wasn't meant for this app.");
        }

        String email = (String) payload.get("email");
        String name  = (String) payload.get("name");

        if (isBlank(email)) {
            return badRequest("Google didn't give us an email to sign in with.");
        }

        User user = store.findByEmail(email);
        if (user == null) {
            user = store.add(isBlank(name) ? email : name, email, "(signed in with Google)");
        }

        return ResponseEntity.ok(signedIn(user));
    }



    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        store.endSession(bearerToken(authHeader));
        return ResponseEntity.ok(Map.of("ok", true));
    }


    private Map<?, ?> verifyGoogleToken(String credential) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + credential))
                .GET()
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new IllegalStateException("Google rejected the token: " + response.statusCode());
        }
        return new ObjectMapper().readValue(response.body(), Map.class);
    }


    private Map<String, Object> signedIn(User user) {
        return Map.of(
                "ok",    true,
                "token", store.startSession(user),
                "name",  user.getName(),
                "email", user.getEmail());
    }

 
    static String bearerToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        return authHeader.substring("Bearer ".length()).trim();
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static String trim(String s) {
        return s == null ? null : s.trim();
    }

    private ResponseEntity<Map<String, Object>> badRequest(String message) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("ok", false, "message", message));
    }


    public record SignupRequest(String name, String email, String password) {}
    public record LoginRequest(String email, String password) {}
    public record GoogleLoginRequest(String credential) {}
}
