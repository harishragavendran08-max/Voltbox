package com.voltbox.model;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

public class ChatMessage {
    public int id;
    public String channel = "engineering-desk";
    public String senderName;
    public String senderHandle;
    public String senderEmail;
    public String senderRole;
    public String senderColor;
    public boolean verified;
    public String text;
    public Integer productId;
    public String productTitle;
    public Double productPrice;
    public String productSku;
    public String productImage;
    public String seenStatus = "Seen just now";
    public Map<String, Integer> reactions = new LinkedHashMap<>();
    public long createdAt;

    public static String formatInstagramHandle(String name, String role) {
        String raw = (name != null && !name.isBlank()) ? name.trim().toLowerCase(Locale.ROOT) : "builder";
        String slug = raw.replaceAll("[^a-z0-9]+", ".").replaceAll("^\\.+|\\.+$", "");
        if ("moderator".equalsIgnoreCase(role) || "STAFF_ARCHITECT".equalsIgnoreCase(role)) {
            return "@" + slug + ".voltbox";
        }
        return "@" + slug;
    }

    public synchronized int toggleReaction(String emoji) {
        if (emoji == null || emoji.isBlank()) return 0;
        String clean = emoji.trim();
        int current = reactions.getOrDefault(clean, 0);
        int next = current + 1;
        reactions.put(clean, next);
        return next;
    }
}
