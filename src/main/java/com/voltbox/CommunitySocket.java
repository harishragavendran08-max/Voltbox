package com.voltbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltbox.model.User;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.net.URI;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class CommunitySocket extends TextWebSocketHandler {
    private final Store store;
    private final ObjectMapper json = new ObjectMapper();
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

    public CommunitySocket(Store store) {
        this.store = store;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        URI uri = session.getUri();
        String query = uri != null ? uri.getQuery() : null;
        String token = null;
        if (query != null) {
            for (String part : query.split("&")) {
                if (part.startsWith("token=")) {
                    token = part.substring("token=".length());
                    break;
                }
            }
        }
        User u = store.findByToken(token);
        if (u == null) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }
        session.getAttributes().put("email", u.email);
        session.getAttributes().put("role", u.role);
        sessions.add(session);
        broadcastToAll(Map.of("type", "presence-update", "onlineCount", Math.max(1, sessions.size())));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        broadcastToAll(Map.of("type", "presence-update", "onlineCount", Math.max(1, sessions.size())));
    }

    public int getOnlineCount() {
        return Math.max(1, sessions.size());
    }

    public void broadcastToAll(Object payload) {
        sendMatching(payload, s -> true);
    }

    public void broadcastToModerators(Object payload) {
        sendMatching(payload, s -> "moderator".equals(s.getAttributes().get("role")));
    }

    public void broadcastToUser(String email, Object payload) {
        sendMatching(payload, s -> email != null && email.equalsIgnoreCase((String) s.getAttributes().get("email")));
    }

    private void sendMatching(Object payload, java.util.function.Predicate<WebSocketSession> filter) {
        try {
            TextMessage msg = new TextMessage(json.writeValueAsString(payload));
            for (WebSocketSession s : sessions) {
                if (s.isOpen() && filter.test(s)) {
                    s.sendMessage(msg);
                }
            }
        } catch (Exception ignored) {}
    }
}
