package org.example.be.business.product.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductListItemResponse {

    private UUID id;
    private String code;
    private String name;
    private String slug;

    private String thumbnailUrl;

    private boolean published;

    private BigDecimal priceMin;      // product.price_min
    private BigDecimal salePriceMin;  // product.sale_price_min

    private long totalSold;           // product.total_sold
    private long totalReviews;        // product.total_reviews
    private double averageRating;     // product.average_rating

    private String brandName;         // join brand

    // tên các category của product
    private List<CategoryListItemResponse> categories;

    // Tổng tồn kho hiện tại (sau này tính từ bảng lô nhập, không phải inventory_item)
    private long stockOnHand;

    // Số lượng biến thể (SKU) của product
    private long skuCount;

    private Instant createdAt;
    private Instant updatedAt;
}
