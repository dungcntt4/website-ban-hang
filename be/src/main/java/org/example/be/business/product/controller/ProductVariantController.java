package org.example.be.business.product.controller;

import lombok.RequiredArgsConstructor;
import org.example.be.business.product.model.dto.VariantDropdownResponse;
import org.example.be.business.product.service.ProductVariantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/variants")
public class ProductVariantController {

    private final ProductVariantService productVariantService;

    @GetMapping("/dropdown")
    public ResponseEntity<List<VariantDropdownResponse>> getDropdown() {
        return ResponseEntity.ok(productVariantService.getVariantDropdown());
    }
}
