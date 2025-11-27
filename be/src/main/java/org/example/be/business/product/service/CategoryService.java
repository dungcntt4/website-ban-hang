package org.example.be.business.product.service;

import lombok.RequiredArgsConstructor;
import org.example.be.business.product.model.dto.CategoryListItemResponse;
import org.example.be.business.product.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepo;

    public List<CategoryListItemResponse> listAll() {
        return categoryRepo.findAllByOrderByDisplayOrderAscNameAsc()
                .stream()
                .map(c -> {
                    CategoryListItemResponse dto = new CategoryListItemResponse();
                    dto.setId(c.getId());
                    dto.setName(c.getName());
                    dto.setSlug(c.getSlug());
                    dto.setParentId(c.getParent() != null ? c.getParent().getId() : null);
                    dto.setDisplayOrder(c.getDisplayOrder());
                    return dto;
                })
                .toList();
    }
}


