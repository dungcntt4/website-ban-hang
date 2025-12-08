package org.example.be.business.product.service;

import lombok.RequiredArgsConstructor;
import org.example.be.business.product.model.dto.*;
import org.example.be.business.product.model.entity.*;
import org.example.be.business.product.repository.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ProductPublicService {

    private final ProductRepository productRepo;
    private final BrandRepository brandRepo;
    private final SpecificationAttributeRepository specAttrRepo;
    private final SpecificationValueRepository specValueRepo;
    private final ProductSpecificationValueRepository psvRepo;

    // ================== PUBLIC API: /api/public/products/{category} ==================
    @Transactional(readOnly = true)
    public PagedProductListPublicResponse getProductsByCategory(
            String categorySlug,
            List<String> brandSlugs,
            List<UUID> specValueIds,
            int pageNum,
            int pageSize,
            String sort
    ) {

        // ===== Chuẩn hoá tham số =====
        if (pageNum < 1) {
            pageNum = 1;
        }
        if (pageSize <= 0) {
            pageSize = 12;
        }

        if (brandSlugs != null && brandSlugs.isEmpty()) {
            brandSlugs = null;
        }
        if (specValueIds != null && specValueIds.isEmpty()) {
            specValueIds = null;
        }

        // ===== Sort (hiện tại sort theo priceMin) =====
        Sort sortSpec = Sort.unsorted();
        if ("priceAsc".equalsIgnoreCase(sort)) {
            sortSpec = Sort.by(Sort.Direction.ASC, "priceMin");
        } else if ("priceDesc".equalsIgnoreCase(sort)) {
            sortSpec = Sort.by(Sort.Direction.DESC, "priceMin");
        }

        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, sortSpec);

        // ===== 1. Lấy Page<Product> theo category + brand + spec =====
        Page<Product> pageResult = productRepo.findPublishedByCategoryWithFilters(
                categorySlug,
                brandSlugs,
                specValueIds,
                pageable
        );

        List<Product> products = pageResult.getContent();

        // ===== 2. Build filter BRAND cho FE =====
        List<BrandListItemResponse> brandFilters = buildBrandFilter();

        // ===== 3. Build filter SPEC (attribute + list value text) =====
        List<SpecificationFilterDTO> specFilters = buildSpecificationFilter();

        // ===== 4. Map Product -> ProductListItemDTO =====
        List<ProductListItemDTO> productItems = products.stream()
                .map(this::buildProductListItem)
                .toList();

        // ===== 5. Build response =====
        PagedProductListPublicResponse response = new PagedProductListPublicResponse();
        response.setProducts(productItems);
        response.setBrands(brandFilters);
        response.setSpecifications(specFilters);

        response.setPageNum(pageNum);
        response.setPageSize(pageSize);
        response.setTotalElements(pageResult.getTotalElements());
        response.setTotalPages(pageResult.getTotalPages());

        return response;
    }

    // ================== HÀM PHỤ ==================

    private List<BrandListItemResponse> buildBrandFilter() {
        return brandRepo.findAll().stream()
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

    private List<SpecificationFilterDTO> buildSpecificationFilter() {
        return specAttrRepo.findAll().stream()
                .map(attr -> {
                    List<String> values = specValueRepo.findByAttributeId(attr.getId())
                            .stream()
                            .map(SpecificationValue::getValueText)
                            .distinct()
                            .sorted()
                            .toList();

                    SpecificationFilterDTO dto = new SpecificationFilterDTO();
                    dto.setAttribute(attr.getName());
                    dto.setValues(values);
                    return dto;
                })
                .toList();
    }

    private ProductListItemDTO buildProductListItem(Product p) {

        // Lấy tất cả spec-value của product
        List<ProductSpecificationValue> psvList =
                psvRepo.findByProduct_Id(p.getId());

        Map<String, List<String>> specMap = new HashMap<>();

        psvList.forEach(psv -> {
            SpecificationValue sv = psv.getSpecificationValue();
            String attrName = sv.getAttribute().getName();
            String valueText = sv.getValueText();

            specMap
                    .computeIfAbsent(attrName, k -> new ArrayList<>())
                    .add(valueText);
        });

        ProductListItemDTO dto = new ProductListItemDTO();
        dto.setId(p.getId());
        dto.setName(p.getName());
        dto.setSlug(p.getSlug());
        dto.setThumbnailUrl(p.getThumbnailUrl());
        dto.setPriceMin(p.getPriceMin());
        dto.setSalePriceMin(p.getSalePriceMin());
        dto.setTotalReviews(p.getTotalReviews());
        dto.setAverageRating(p.getAverageRating());

        // brand
        BrandListItemResponse brandDto = new BrandListItemResponse();
        brandDto.setId(p.getBrand().getId());
        brandDto.setName(p.getBrand().getName());
        brandDto.setSlug(p.getBrand().getSlug());
        brandDto.setImage(p.getBrand().getImage());
        dto.setBrand(brandDto);

        dto.setSpecifications(specMap);

        return dto;
    }
}
