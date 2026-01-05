package org.example.be.business.product.controller;

import lombok.RequiredArgsConstructor;
import org.example.be.business.product.model.dto.ProductCreateRequest;
import org.example.be.business.product.model.dto.ProductDetailResponse;
import org.example.be.business.product.model.dto.ProductListItemResponse;
import org.example.be.business.product.service.ProductService;
import org.example.be.common.util.PageResponse;
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
    public ResponseEntity<PageResponse<ProductListItemResponse>> getProductsForAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID categoryId
    ) {
        Boolean published = null;
        if ("published".equalsIgnoreCase(status)) published = true;
        if ("hidden".equalsIgnoreCase(status)) published = false;
        return ResponseEntity.ok(
                productService.getAdminProducts(
                        page,
                        size,
                        search,
                        published,
                        categoryId
                )
        );
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

