package org.example.be.business.cart.model.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CartItemResponse {

    private UUID id;
    private int quantity;

    private ProductVariantDto productVariant;

    @Data
    public static class ProductVariantDto {
        private UUID id;
        private String name;
        private BigDecimal price;
        private BigDecimal discountPrice;
        private String sku;
        private long stock;
        private boolean deleted;
        private ProductDto product;
    }

    @Data
    public static class ProductDto {
        private UUID id;
        private String name;
        private String slug;
        private String image;
    }
}
