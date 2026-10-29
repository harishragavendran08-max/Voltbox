package com.voltbox.controller;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.voltbox.CommunitySocket;
import com.voltbox.Store;
import com.voltbox.model.Application;
import com.voltbox.model.Product;
import com.voltbox.model.Report;
import com.voltbox.model.User;



@RestController
@RequestMapping("/api")
public class CommunityController {

    private final Store store;
    private final CommunitySocket socket;

    public CommunityController(Store store, CommunitySocket socket) {
        this.store = store;
        this.socket = socket;
    }



    @PostMapping("/products")
    public ResponseEntity<?> addProduct(@RequestHeader(value = "Authorization", required = false) String auth,
                                        @RequestBody ProductRequest req) {
        User user = userFrom(auth);
        if (user == null) return notSignedIn();
        if (!canContribute(user)) return forbidden("Only contributors can add listings.");

        String title = trim(req == null ? null : req.title());
        String category = trim(req == null ? null : req.category());
        String description = trim(req == null ? null : req.description());
        String image = trim(req == null ? null : req.image());
        double price = req == null ? -1 : req.price();

        if (isBlank(title) || isBlank(category)) {
            return badRequest("A listing needs at least a title and a category.");
        }
        if (price < 0) {
            return badRequest("Give it a price of zero or more.");
        }
        if (isBlank(image)) {
            return badRequest("Add an image link for the listing — a photo of the part.");
        }
        if (!image.startsWith("http") && !image.startsWith("/")) {
            return badRequest("That image link doesn't look right — it should start with https://");
        }

        Product p = new Product();
        p.setTitle(title);
        p.setPrice(price);
        p.setDescription(description);
        p.setCategory(category);
        p.setImage(image);
        p.setRatingRate(0);
        p.setRatingCount(0);
        p.setOfficial(false);
        p.setAddedByName(user.getName());
        p.setAddedByColor(user.getAvatarColor());
        p.setAddedByEmail(user.getEmail());

        store.addProduct(p);          

        socket.toAll(Map.of("type", "product-added", "product", p));

        return ResponseEntity.ok(p);
    }
    @GetMapping("/my-products")
    public ResponseEntity<?> myProducts(@RequestHeader(value = "Authorization", required = false) String auth) {
        User user = userFrom(auth);
        if (user == null) return notSignedIn();
        if (!canContribute(user)) return forbidden("Only contributors have an upload history.");

        List<Product> mine = new ArrayList<>();
        for (Product p : store.getProducts()) {
            if (user.getEmail().equalsIgnoreCase(p.getAddedByEmail())) {
                mine.add(p);
            }
        }
        Collections.reverse(mine);     // newest first
        return ResponseEntity.ok(mine);
    }
    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> takeDown(@RequestHeader(value = "Authorization", required = false) String auth,
                                      @PathVariable int id) {
        User user = userFrom(auth);
        if (user == null) return notSignedIn();

        Product p = store.findProduct(id);
        if (p == null) return notFound("Couldn't find that listing.");

        boolean mine = user.getEmail().equalsIgnoreCase(p.getAddedByEmail());
        if (!isModerator(user) && !mine) {
            return forbidden("You can only take down your own listings.");
        }

        p.setTakenDown(true);
        store.save();

        // same idea as adding one — everyone's shop should drop it live
        socket.toAll(Map.of("type", "product-taken-down", "productId", id));

        return ResponseEntity.ok(Map.of("ok", true));
    }


    @PostMapping("/applications")
    public ResponseEntity<?> apply(@RequestHeader(value = "Authorization", required = false) String auth,
                                   @RequestBody ApplicationRequest req) {
        User user = userFrom(auth);
        if (user == null) return notSignedIn();

        if (canContribute(user)) {
            return badRequest("You're already a contributor.");
        }
        if (myPendingApplication(user) != null) {
            return badRequest("You've already applied — hang tight while it's reviewed.");
        }

        String workplace = trim(req == null ? null : req.workplace());
        String idCardImage = trim(req == null ? null : req.idCardImage());
        String note = trim(req == null ? null : req.note());

        if (isBlank(workplace) || isBlank(idCardImage)) {
            return badRequest("Tell us where you work in IT and add a link to your work ID.");
        }

        Application app = new Application();
        app.setApplicantEmail(user.getEmail());
        app.setApplicantName(user.getName());
        app.setWorkplace(workplace);
        app.setIdCardImage(idCardImage);
        app.setNote(note);
        app.setStatus("pending");
        app.setSubmittedAt(System.currentTimeMillis());
        store.addApplication(app);

        socket.toModerators(Map.of("type", "application-new", "application", app));

        return ResponseEntity.ok(Map.of("ok", true, "status", "pending"));
    }

    @GetMapping("/applications/mine")
    public ResponseEntity<?> myApplication(@RequestHeader(value = "Authorization", required = false) String auth) {
        User user = userFrom(auth);
        if (user == null) return notSignedIn();

       
        Application latest = null;
        for (Application a : store.getApplications()) {
            if (user.getEmail().equalsIgnoreCase(a.getApplicantEmail())) {
                latest = a;   
            }
        }
        return ResponseEntity.ok(Map.of("application", latest == null ? "" : latest));
    }
    @GetMapping("/applications")
    public ResponseEntity<?> pendingApplications(@RequestHeader(value = "Authorization", required = false) String auth) {
        User user = userFrom(auth);
        if (user == null) return notSignedIn();
        if (!isModerator(user)) return forbidden("Only the moderator reviews applications.");

        List<Application> pending = new ArrayList<>();
        for (Application a : store.getApplications()) {
            if ("pending".equals(a.getStatus())) {
                pending.add(a);
            }
        }
        Collections.reverse(pending);
        return ResponseEntity.ok(pending);
    }

    @PostMapping("/applications/{id}/approve")
    public ResponseEntity<?> approve(@RequestHeader(value = "Authorization", required = false) String auth,
                                     @PathVariable int id) {
        return decide(auth, id, true);
    }
        @PostMapping("/applications/{id}/decline")
    public ResponseEntity<?> decline(@RequestHeader(value = "Authorization", required = false) String auth,
                                     @PathVariable int id) {
        return decide(auth, id, false);
    }

    private ResponseEntity<?> decide(String auth, int id, boolean approved) {
        User mod = userFrom(auth);
        if (mod == null) return notSignedIn();
        if (!isModerator(mod)) return forbidden("Only the moderator can decide applications.");

        Application app = store.findApplication(id);
        if (app == null) return notFound("Couldn't find that application.");
        if (!"pending".equals(app.getStatus())) {
            return badRequest("That application has already been decided.");
        }

        app.setStatus(approved ? "approved" : "declined");
        app.setDecidedAt(System.currentTimeMillis());

        if (approved) {
            User applicant = store.findByEmail(app.getApplicantEmail());
            if (applicant != null && "member".equals(applicant.getRole())) {
                applicant.setRole("contributor");
            }
        }
        store.save();
        socket.toUser(app.getApplicantEmail(), Map.of(
                "type", "application-decided",
                "status", app.getStatus()));

        return ResponseEntity.ok(Map.of("ok", true, "status", app.getStatus()));
    }

    @GetMapping("/contributors")
    public ResponseEntity<?> contributors(@RequestHeader(value = "Authorization", required = false) String auth) {
        User user = userFrom(auth);
        if (user == null) return notSignedIn();
        if (!isModerator(user)) return forbidden("Only the moderator sees the roster.");

        List<Map<String, Object>> list = new ArrayList<>();
        for (User u : store.getUsers()) {
            if (canContribute(u)) {
                list.add(Map.of(
                        "name", u.getName(),
                        "email", u.getEmail(),
                        "color", u.getAvatarColor(),
                        "role", u.getRole()));
            }
        }
        return ResponseEntity.ok(list);
    }

    @PostMapping("/contributors/grant")
    public ResponseEntity<?> grant(@RequestHeader(value = "Authorization", required = false) String auth,
                                   @RequestBody GrantRequest req) {
        User mod = userFrom(auth);
        if (mod == null) return notSignedIn();
        if (!isModerator(mod)) return forbidden("Only the moderator can grant access.");

        String email = trim(req == null ? null : req.email());
        if (isBlank(email)) return badRequest("Whose email?");

        User target = store.findByEmail(email);
        if (target == null) return notFound("No account with that email — they need to sign up first.");
        if (canContribute(target)) return badRequest(target.getName() + " already has access.");

        target.setRole("contributor");
        store.save();

        // if they're online, flip their panel live
        socket.toUser(target.getEmail(), Map.of("type", "role-changed", "role", "contributor"));

        return ResponseEntity.ok(Map.of("ok", true, "name", target.getName()));
    }


    @PostMapping("/reports")
    public ResponseEntity<?> report(@RequestHeader(value = "Authorization", required = false) String auth,
                                    @RequestBody ReportRequest req) {
        User user = userFrom(auth);
        if (user == null) return notSignedIn();

        int productId = req == null ? 0 : req.productId();
        Product p = store.findProduct(productId);
        if (p == null) return notFound("Couldn't find that listing.");

        Report r = new Report();
        r.setProductId(productId);
        r.setProductTitle(p.getTitle());
        r.setReporterName(user.getName());
        r.setReporterEmail(user.getEmail());

        ReportRequest safeReq = req == null ? new ReportRequest(productId, null, null) : req;
        r.setReason(trim(safeReq.reason()));
        r.setNote(trim(safeReq.note()));
        r.setStatus("open");
        r.setCreatedAt(System.currentTimeMillis());
        store.addReport(r);

      
        socket.toModerators(Map.of("type", "report-new", "report", r));

        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/reports")
    public ResponseEntity<?> reports(@RequestHeader(value = "Authorization", required = false) String auth) {
        User user = userFrom(auth);
        if (user == null) return notSignedIn();
        if (!isModerator(user)) return forbidden("Only the moderator sees reports.");

        List<Report> open = new ArrayList<>();
        for (Report r : store.getReports()) {
            if ("open".equals(r.getStatus())) {
                open.add(r);
            }
        }
        Collections.reverse(open);
        return ResponseEntity.ok(open);
    }

    @PostMapping("/reports/{id}/resolve")
    public ResponseEntity<?> resolveReport(@RequestHeader(value = "Authorization", required = false) String auth,
                                           @PathVariable int id,
                                           @RequestBody ResolveRequest req) {
        User mod = userFrom(auth);
        if (mod == null) return notSignedIn();
        if (!isModerator(mod)) return forbidden("Only the moderator can resolve reports.");

        Report r = store.findReport(id);
        if (r == null) return notFound("Couldn't find that report.");

        boolean takedown = req != null && "takedown".equals(trim(req.action()));
        if (takedown) {
            Product p = store.findProduct(r.getProductId());
            if (p != null) p.setTakenDown(true);
            r.setStatus("resolved");
        } else {
            r.setStatus("dismissed");
        }
        store.save();
        return ResponseEntity.ok(Map.of("ok", true, "status", r.getStatus()));
    }



    private User userFrom(String authHeader) {
        return store.findByToken(AuthController.bearerToken(authHeader));
    }

    private static boolean isModerator(User u) {
        return "moderator".equals(u.getRole());
    }

    // contributors and the moderator both count as "can add/manage listings"
    private static boolean canContribute(User u) {
        return "contributor".equals(u.getRole()) || "moderator".equals(u.getRole());
    }

    private Application myPendingApplication(User u) {
        for (Application a : store.getApplications()) {
            if (u.getEmail().equalsIgnoreCase(a.getApplicantEmail()) && "pending".equals(a.getStatus())) {
                return a;
            }
        }
        return null;
    }

    private static boolean isBlank(String s) { return s == null || s.isBlank(); }
    private static String trim(String s) { return s == null ? null : s.trim(); }

    private ResponseEntity<Map<String, Object>> notSignedIn() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("ok", false, "message", "You're not signed in."));
    }

    private ResponseEntity<Map<String, Object>> forbidden(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("ok", false, "message", message));
    }

    private ResponseEntity<Map<String, Object>> badRequest(String message) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("ok", false, "message", message));
    }

    private ResponseEntity<Map<String, Object>> notFound(String message) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("ok", false, "message", message));
    }


    // ── the shapes of the json each form sends us ──

    public record ProductRequest(String title, double price, String description,
                                 String category, String image) {}
    public record ApplicationRequest(String workplace, String idCardImage, String note) {}
    public record GrantRequest(String email) {}
    public record ReportRequest(int productId, String reason, String note) {}
    public record ResolveRequest(String action) {}
}
