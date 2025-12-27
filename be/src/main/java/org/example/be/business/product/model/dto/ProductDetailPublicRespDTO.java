package org.example.be.business.product.model.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class ProductDetailPublicRespDTO {

    private UUID id;
    private String name;
    private String slug;
    private String description;
    private String shortDescription;

    private BigDecimal priceMin;
    private BigDecimal salePriceMin;

    private BrandListItemResponse brand;

    private List<ImagePublicRespDTO> images;

    private List<VariantPublicRespDTO> variants;

    private Map<String, List<String>> specifications;

    private double averageRating;
    private long totalReviews;

    private List<ReviewPublicRespDTO> reviews;
}
