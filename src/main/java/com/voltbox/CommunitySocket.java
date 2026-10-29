package com.voltbox;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voltbox.model.User;

@Component
public class CommunitySocket extends TextWebSocketHandler {

    private final Store store;
    private final ObjectMapper json = new ObjectMapper();


    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

    public CommunitySocket(Store store) {
        this.store = store;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        User user = store.findByToken(tokenFrom(session));
        if (user == null) {
            // no idea who this is — don't keep a connection we can't address
            session.close(CloseStatus.NOT_ACCEPTABLE);
            return;
        }
        session.getAttributes().put("email", user.getEmail());
        session.getAttributes().put("role", user.getRole());
        sessions.add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
    }

   
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        sessions.remove(session);
    }


   
    public void toModerators(Object payload) {
        String text = toJson(payload);
        for (WebSocketSession s : sessions) {
            if ("moderator".equals(s.getAttributes().get("role"))) {
                sendTo(s, text);
            }
        }
    }

    public void toUser(String email, Object payload) {
        String text = toJson(payload);
        for (WebSocketSession s : sessions) {
            if (email != null && email.equalsIgnoreCase((String) s.getAttributes().get("email"))) {
                sendTo(s, text);
            }
        }
    }

    public void toAll(Object payload) {
        String text = toJson(payload);
        for (WebSocketSession s : sessions) {
            sendTo(s, text);
        }
    }


    private void sendTo(WebSocketSession session, String text) {
        try {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(text));
            }
        } catch (IOException e) {
            // the connection died as we were writing — drop it and move on
            sessions.remove(session);
        }
    }

    private String toJson(Object payload) {
        try {
            return json.writeValueAsString(payload);
        } catch (Exception e) {
            return "{}";
        }
    }

    // pull the token out of the connection URL's ?token=... part
    private String tokenFrom(WebSocketSession session) {
        String query = session.getUri() == null ? null : session.getUri().getQuery();
        if (query == null) return null;
        for (String part : query.split("&")) {
            if (part.startsWith("token=")) {
                return part.substring("token=".length());
            }
        }
        return null;
    }
}
