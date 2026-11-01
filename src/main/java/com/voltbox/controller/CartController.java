package com.voltbox.controller;

import com.voltbox.Store;
import com.voltbox.entity.Cart;
import com.voltbox.model.User;
import com.voltbox.service.CartService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CartController {
    private final Store store;
    private final CartService cartService;

    public CartController(Store store, CartService cartService) {
        this.store = store;
        this.cartService = cartService;
    }

    private User authUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        return store.findByToken(authHeader.substring("Bearer ".length()).trim());
    }

    @GetMapping
    public ResponseEntity<?> getCart(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestParam(value = "promoCode", required = false) String promoCode) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "You're not signed in."));
        }
        Cart cart = cartService.buildCartEntity(u, promoCode);
        return ResponseEntity.ok(cart);
    }

    @PutMapping
    public ResponseEntity<?> replaceCart(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestParam(value = "promoCode", required = false) String promoCode,
            @RequestBody(required = false) Map<String, Integer> incoming) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "You're not signed in."));
        }
        Cart updated = cartService.replaceCart(u, incoming, promoCode);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("ok", true);
        response.put("cart", updated);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/items")
    public ResponseEntity<?> addCartItem(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "You're not signed in."));
        }

        int productId;
        int quantity = 1;
        try {
            productId = Integer.parseInt(String.valueOf(body.getOrDefault("productId", "0")));
            if (body.get("quantity") != null) {
                quantity = Integer.parseInt(String.valueOf(body.get("quantity")));
            }
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "Invalid product ID or quantity."));
        }

        String promoCode = body.get("promoCode") != null ? String.valueOf(body.get("promoCode")) : null;
        Cart updated = cartService.upsertCartItem(u, productId, quantity, true, promoCode);
        if (updated == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("ok", false, "message", "Product not found."));
        }
        return ResponseEntity.ok(Map.of("ok", true, "cart", updated));
    }

    @PatchMapping("/items/{productId}")
    public ResponseEntity<?> updateCartItemQuantity(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable("productId") int productId,
            @RequestBody Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "You're not signed in."));
        }

        int quantity;
        try {
            quantity = Integer.parseInt(String.valueOf(body.getOrDefault("quantity", "0")));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "Invalid quantity."));
        }

        String promoCode = body.get("promoCode") != null ? String.valueOf(body.get("promoCode")) : null;
        Cart updated = cartService.upsertCartItem(u, productId, quantity, false, promoCode);
        if (updated == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("ok", false, "message", "Product not found."));
        }
        return ResponseEntity.ok(Map.of("ok", true, "cart", updated));
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<?> removeCartItem(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable("productId") int productId,
            @RequestParam(value = "promoCode", required = false) String promoCode) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "You're not signed in."));
        }
        Cart updated = cartService.removeCartItem(u, productId, promoCode);
        return ResponseEntity.ok(Map.of("ok", true, "cart", updated));
    }

    @DeleteMapping
    public ResponseEntity<?> clearCart(
            @RequestHeader(value = "Authorization", required = false) String auth) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "You're not signed in."));
        }
        Cart cleared = cartService.clearCart(u);
        return ResponseEntity.ok(Map.of("ok", true, "cart", cleared));
    }

    @PostMapping("/promo")
    public ResponseEntity<?> evaluatePromo(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "You're not signed in."));
        }
        String promoCode = body != null && body.get("promoCode") != null
                ? String.valueOf(body.get("promoCode")).trim().toUpperCase()
                : "";
        Cart evaluated = cartService.buildCartEntity(u, promoCode);
        boolean valid = promoCode.isEmpty() || evaluated.getAppliedPromo() != null;
        return ResponseEntity.ok(Map.of(
                "ok", valid,
                "appliedPromo", evaluated.getAppliedPromo() != null ? evaluated.getAppliedPromo() : "",
                "cart", evaluated
        ));
    }
}
