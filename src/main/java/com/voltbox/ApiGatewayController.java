package com.voltbox;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/gateway")
public class ApiGatewayController {

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("API gateway healthy");
    }

    @GetMapping("/routes")
    public ResponseEntity<List<String>> routes() {
        return ResponseEntity.ok(List.of("/api/products", "/api/login", "/api/signup", "/ws/community"));
    }
}
