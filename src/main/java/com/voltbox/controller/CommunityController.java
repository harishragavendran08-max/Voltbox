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

    private boolean isModerator(User u) {
        return u != null && "moderator".equals(u.role);
    }

    private boolean canContribute(User u) {
        return u != null && ("contributor".equals(u.role) || "moderator".equals(u.role));
    }

    @PostMapping("/api/applications")
    public ResponseEntity<?> submitApplication(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));
        if (canContribute(u)) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "You're already a contributor."));
        }

        String workplace = String.valueOf(body.getOrDefault("workplace", "")).trim();
        String idCardImage = String.valueOf(body.getOrDefault("idCardImage", "")).trim();
        String note = String.valueOf(body.getOrDefault("note", "")).trim();
        if (workplace.isEmpty() || idCardImage.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "Tell us where you work in IT and add a link to your work ID."));
        }

        Application a = new Application();
        a.applicantEmail = u.email;
        a.applicantName = u.name;
        a.workplace = workplace;
        a.idCardImage = idCardImage;
        a.note = note;
        a.status = "pending";
        a.submittedAt = System.currentTimeMillis();
        Application created = store.addApplication(a);

        socket.broadcastToModerators(Map.of("type", "application-new", "application", created));
        return ResponseEntity.ok(Map.of("ok", true, "status", "pending"));
    }

    @GetMapping("/api/applications/mine")
    public ResponseEntity<?> getMyApplication(@RequestHeader(value = "Authorization", required = false) String auth) {
        User u = authUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));
        Application latest = null;
        for (Application a : store.getApplications()) {
            if (a.applicantEmail != null && a.applicantEmail.equalsIgnoreCase(u.email)) {
                latest = a;
            }
        }
        return ResponseEntity.ok(Map.of("application", latest != null ? latest : ""));
    }

    @GetMapping("/api/applications")
    public ResponseEntity<?> getApplications(@RequestHeader(value = "Authorization", required = false) String auth) {
        User u = authUser(auth);
        if (!isModerator(u)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("ok", false));
        }
        List<Application> pending = store.getApplications().stream()
                .filter(a -> "pending".equals(a.status))
                .collect(Collectors.toList());
        return ResponseEntity.ok(pending);
    }

    @PostMapping("/api/applications/{id}/approve")
    public ResponseEntity<?> approveApplication(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable("id") int id) {
        return decideApplication(auth, id, true);
    }

    @PostMapping("/api/applications/{id}/decline")
    public ResponseEntity<?> declineApplication(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable("id") int id) {
        return decideApplication(auth, id, false);
    }

    private ResponseEntity<?> decideApplication(String auth, int id, boolean approved) {
        User mod = authUser(auth);
        if (!isModerator(mod)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("ok", false));
        }
        Application appRecord = store.findApplication(id);
        if (appRecord == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("ok", false));
        }
        appRecord.status = approved ? "approved" : "declined";
        appRecord.decidedAt = System.currentTimeMillis();
        if (approved) {
            User applicant = store.findByEmail(appRecord.applicantEmail);
            if (applicant != null && "member".equals(applicant.role)) {
                applicant.role = "contributor";
            }
        }
        store.save();
        socket.broadcastToUser(appRecord.applicantEmail, Map.of("type", "application-decided", "status", appRecord.status));
        return ResponseEntity.ok(Map.of("ok", true, "status", appRecord.status));
    }

    @GetMapping("/api/reports")
    public ResponseEntity<?> getReports(@RequestHeader(value = "Authorization", required = false) String auth) {
        User u = authUser(auth);
        if (!isModerator(u)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("ok", false));
        }
        List<Report> open = store.getReports().stream()
                .filter(r -> "open".equals(r.status))
                .collect(Collectors.toList());
        return ResponseEntity.ok(open);
    }

    @PostMapping("/api/reports")
    public ResponseEntity<?> submitReport(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestBody Map<String, Object> body) {
        User u = authUser(auth);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("ok", false));

        int productId = Integer.parseInt(String.valueOf(body.getOrDefault("productId", "0")));
        Product p = store.findProduct(productId);
        if (p == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("ok", false));

        Report r = new Report();
        r.productId = productId;
        r.productTitle = p.title;
        r.reporterName = u.name;
        r.reporterEmail = u.email;
        r.reason = String.valueOf(body.getOrDefault("reason", "")).trim();
        r.note = String.valueOf(body.getOrDefault("note", "")).trim();
        r.status = "open";
        r.createdAt = System.currentTimeMillis();
        Report created = store.addReport(r);

        socket.broadcastToModerators(Map.of("type", "report-new", "report", created));
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/api/reports/{id}/resolve")
    public ResponseEntity<?> resolveReport(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable("id") int id,
            @RequestBody Map<String, Object> body) {
        User mod = authUser(auth);
        if (!isModerator(mod)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("ok", false));
        }
        Report r = store.findReport(id);
        if (r == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("ok", false));

        String action = String.valueOf(body.getOrDefault("action", "")).trim();
        if ("takedown".equals(action)) {
            Product p = store.findProduct(r.productId);
            if (p != null) p.takenDown = true;
            r.status = "resolved";
        } else {
            r.status = "dismissed";
        }
        store.save();
        return ResponseEntity.ok(Map.of("ok", true, "status", r.status));
    }
}
