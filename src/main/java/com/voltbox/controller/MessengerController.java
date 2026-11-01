package com.voltbox.controller;

import com.voltbox.CommunitySocket;
import com.voltbox.Store;
import com.voltbox.model.ChatMessage;
import com.voltbox.model.Product;
import com.voltbox.model.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class MessengerController {
    private final Store store;
    private final CommunitySocket socket;

    public MessengerController(Store store, CommunitySocket socket) {
        this.store = store;
        this.socket = socket;
    }

    private User authUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        return store.findByToken(authHeader.substring("Bearer ".length()).trim());
    }

    @GetMapping("/api/messages")
    public ResponseEntity<?> getMessages(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestParam(value = "channel", defaultValue = "all") String channel) {
        User u = authUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));

        return ResponseEntity.ok(Map.of(
            "ok", true,
            "onlineCount", socket.getOnlineCount(),
            "messages", store.getMessages(channel)
        ));
    }

    @PostMapping("/api/messages")
    public ResponseEntity<?> postMessage(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));

        String channel = String.valueOf(body.getOrDefault("channel", "general")).trim().toLowerCase();
        if (!"rig-builds".equals(channel) && !"price-drops".equals(channel)) {
            channel = "general";
        }

        String text = String.valueOf(body.getOrDefault("text", "")).trim();
        Integer productId = null;
        Object rawPid = body.get("productId");
        if (rawPid instanceof Number) {
            productId = ((Number) rawPid).intValue();
        } else if (rawPid instanceof String && !((String) rawPid).isBlank()) {
            try { productId = Integer.parseInt((String) rawPid); } catch (Exception ignored) {}
        }

        if (text.isEmpty() && productId == null) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "Please enter a message or attach a hardware component."));
        }

        Product linked = productId != null ? store.findProduct(productId) : null;
        ChatMessage m = new ChatMessage();
        m.channel = channel;
        m.senderName = u.name;
        m.senderEmail = u.email;
        m.senderRole = u.role;
        m.senderColor = u.avatarColor;
        m.text = text.isEmpty() && linked != null ? ("Shared hardware component: " + linked.title) : text;
        if (linked != null) {
            m.productId = linked.id;
            m.productTitle = linked.title;
            m.productPrice = linked.price;
            m.productSku = String.format("VB-PRT-%03d", linked.id);
            m.productImage = linked.image;
        }

        ChatMessage created = store.addMessage(m);
        socket.broadcastToAll(Map.of(
            "type", "chat-message",
            "message", created,
            "onlineCount", socket.getOnlineCount()
        ));

        return ResponseEntity.ok(Map.of(
            "ok", true,
            "message", created,
            "onlineCount", socket.getOnlineCount()
        ));
    }
}
