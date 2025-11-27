package org.example.be.business.product.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
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

    // nếu sau này m join category thì nhét tên category vào đây
    private List<String> categories;

    private long stockOnHand;         // SUM(inventory_item.stock_on_hand) của các variant
    private long skuCount;            // số variant của product

    private Instant createdAt;
    private Instant updatedAt;
}