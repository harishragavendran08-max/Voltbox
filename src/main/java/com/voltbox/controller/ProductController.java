package com.voltbox.controller;

import com.voltbox.Store;
import com.voltbox.model.Product;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
public class ProductController {
    private final Store store;

    public ProductController(Store store) {
        this.store = store;
    }

    @GetMapping("/api/products")
    public List<Product> getProducts() {
        return store.getProducts().stream()
                .filter(p -> !p.takenDown)
                .collect(Collectors.toList());
    }
}
