package org.example.be.business.product.service;

import lombok.RequiredArgsConstructor;
import org.example.be.business.product.model.dto.VariantDropdownResponse;
import org.example.be.business.product.repository.ProductVariantRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductVariantService {

    private final ProductVariantRepository variantRepo;

    public List<VariantDropdownResponse> getVariantDropdown() {
        return variantRepo.findAllActiveWithProduct()
                .stream()
                .map(v -> new VariantDropdownResponse(
                        v.getId(),
                        v.getSku(),
                        v.getProduct().getName(),
                        v.getName()
                ))
                .toList();
    }
}
