package org.example.be.business.product.model.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class ProductListItemDTO {
    private UUID id;
    private String name;
    private String slug;
    private String thumbnailUrl;

    private BigDecimal priceMin;
    private BigDecimal salePriceMin;

    private long totalSold;
    private long totalReviews;
    private double averageRating;

    private BrandListItemResponse brand;

    // attributeName -> list values
    private Map<String, List<String>> specifications;
}
