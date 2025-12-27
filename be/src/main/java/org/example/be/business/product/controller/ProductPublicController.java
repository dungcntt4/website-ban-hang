package org.example.be.business.product.controller;

import lombok.RequiredArgsConstructor;
import org.example.be.business.product.model.dto.PagedProductListPublicResponse;
import org.example.be.business.product.model.dto.ProductDetailPublicRespDTO;
import org.example.be.business.product.service.ProductPublicService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/public/products")
@RequiredArgsConstructor
public class ProductPublicController {

    private final ProductPublicService productPublicService;

    // ================== GET /api/public/products/{category} ==================
    @GetMapping("/{category}")
    public PagedProductListPublicResponse getProductsByCategory(
            @PathVariable String category,
            @RequestParam(required = false, name = "brand") List<String> brandSlugs,
            @RequestParam(required = false, name = "specificationValue") List<UUID> specValueIds,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "12") int pageSize,
            @RequestParam(required = false) String sort
    ) {
        return productPublicService.getProductsByCategory(
                category,
                brandSlugs,
                specValueIds,
                pageNum,
                pageSize,
                sort
        );
    }

    @GetMapping("/detail/{id}")
    public ProductDetailPublicRespDTO getDetail(@PathVariable UUID id) {
        return productPublicService.getDetail(id);
    }
}
