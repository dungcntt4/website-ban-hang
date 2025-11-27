package org.example.be.business.product.controller;

import lombok.RequiredArgsConstructor;
import org.example.be.business.product.model.dto.ProductOptionDetailResponse;
import org.example.be.business.product.model.dto.ProductOptionListItemResponse;
import org.example.be.business.product.model.dto.ProductOptionRequest;
import org.example.be.business.product.service.ProductOptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/product-options")
@RequiredArgsConstructor
public class ProductOptionController {

    private final ProductOptionService productOptionService;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ProductOptionRequest req) {
        UUID id = productOptionService.create(req);
        return ResponseEntity.ok(Map.of("id", id));
    }

    @GetMapping
    public ResponseEntity<List<ProductOptionListItemResponse>> list() {
        return ResponseEntity.ok(productOptionService.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductOptionDetailResponse> detail(@PathVariable UUID id) {
        return ResponseEntity.ok(productOptionService.getDetail(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable UUID id,
                                    @RequestBody ProductOptionRequest req) {
        productOptionService.update(id, req);
        return ResponseEntity.ok(Map.of("id", id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id) {
        productOptionService.delete(id);
        return ResponseEntity.ok(Map.of("id", id));
    }
}