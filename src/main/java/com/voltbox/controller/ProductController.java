package com.voltbox.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.voltbox.Store;
import com.voltbox.model.Product;


@RestController
@RequestMapping("/api")
public class ProductController {

    private final Store store;

    public ProductController(Store store) {
        this.store = store;
    }

    @GetMapping("/products")
    public List<Product> getAllProducts() {
    
        List<Product> shelf = new ArrayList<>();
        for (Product p : store.getProducts()) {
            if (!p.isTakenDown()) {
                shelf.add(p);
            }
        }
        return shelf;
    }
}
