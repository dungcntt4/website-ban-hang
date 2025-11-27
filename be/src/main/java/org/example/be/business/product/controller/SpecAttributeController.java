package org.example.be.business.product.controller;

import lombok.RequiredArgsConstructor;
import org.example.be.business.product.model.dto.SpecAttributeDetailResponse;
import org.example.be.business.product.model.dto.SpecAttributeListItemResponse;
import org.example.be.business.product.model.dto.SpecAttributeRequest;
import org.example.be.business.product.service.SpecAttributeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/spec-attributes")
@RequiredArgsConstructor
public class SpecAttributeController {

    private final SpecAttributeService specAttributeService;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody SpecAttributeRequest req) {
        UUID id = specAttributeService.create(req);
        return ResponseEntity.ok(Map.of("id", id));
    }

    @GetMapping
    public ResponseEntity<List<SpecAttributeListItemResponse>> list() {
        return ResponseEntity.ok(specAttributeService.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SpecAttributeDetailResponse> detail(@PathVariable UUID id) {
        return ResponseEntity.ok(specAttributeService.getDetail(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable UUID id,
                                    @RequestBody SpecAttributeRequest req) {
        specAttributeService.update(id, req);
        return ResponseEntity.ok(Map.of("id", id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id) {
        specAttributeService.delete(id);
        return ResponseEntity.ok(Map.of("id", id));
    }
}