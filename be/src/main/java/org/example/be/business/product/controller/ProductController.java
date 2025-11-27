package org.example.be.business.product.controller;

import lombok.RequiredArgsConstructor;
import org.example.be.business.product.model.dto.ProductCreateRequest;
import org.example.be.business.product.model.dto.ProductDetailResponse;
import org.example.be.business.product.model.dto.ProductListItemResponse;
import org.example.be.business.product.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody ProductCreateRequest req) {
        UUID id = productService.create(req);
        return ResponseEntity.ok(Map.of("id", id));
    }

    @GetMapping
    public ResponseEntity<List<ProductListItemResponse>> getProductsForAdmin() {
        List<ProductListItemResponse> result = productService.getAdminProducts();
        return ResponseEntity.ok(result);
    }

    // ====== DETAIL ======
    @GetMapping("/{id}")
    public ResponseEntity<ProductDetailResponse> getProductDetail(@PathVariable UUID id) {
        ProductDetailResponse detail = productService.getDetail(id);
        return ResponseEntity.ok(detail);
    }

    // ====== UPDATE ======
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable UUID id,
                                           @RequestBody ProductCreateRequest req) {
        productService.update(id, req);
        return ResponseEntity.ok(Map.of("id", id)); // hoặc noContent() cũng được
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable UUID id) {
        productService.delete(id);
        // có thể trả OK với message, hoặc 204 no content
        return ResponseEntity.ok(Map.of(
                "id", id,
                "message", "Product has been soft-deleted"
        ));
    }
}

