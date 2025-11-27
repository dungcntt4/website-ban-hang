package org.example.be.business.product.service;

import lombok.RequiredArgsConstructor;
import org.example.be.business.product.model.dto.BrandListItemResponse;
import org.example.be.business.product.repository.BrandRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BrandService {

    private final BrandRepository brandRepo;

    public List<BrandListItemResponse> listAll() {
        return brandRepo.findAllByOrderByNameAsc()
                .stream()
                .map(b -> {
                    BrandListItemResponse dto = new BrandListItemResponse();
                    dto.setId(b.getId());
                    dto.setName(b.getName());
                    dto.setSlug(b.getSlug());
                    dto.setImage(b.getImage());
                    return dto;
                })
                .toList();
    }
}

