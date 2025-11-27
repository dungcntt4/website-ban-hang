package org.example.be.business.product.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class ProductCreateRequest {

    private ProductDTO product;
    private List<PictureDTO> pictures;
    private List<SpecDTO> specifications;
    private List<VariantDTO> variants;
    private List<InventoryDTO> inventory;

    @Data
    public static class ProductDTO {
        private String code;
        private String name;
        private String slug;
        private UUID brand_id;
        @JsonProperty("is_published")
        private boolean published;
        private String short_description;
        private String description;
        private String thumbnail_url;
        private List<UUID> categories;

    }

    @Data
    public static class PictureDTO {
        private String url;
        private String alt_text;
    }

    @Data
    public static class SpecDTO {
        private UUID specification_value_id;
    }

    @Data
    public static class VariantDTO {
        private String sku;
        private String name;
        private BigDecimal cost_price;
        private BigDecimal discount_price;
        private BigDecimal price;
        @JsonProperty("is_active")
        private boolean active;
        private List<VariantOptionDTO> options;
    }

    @Data
    public static class InventoryDTO {
        private String variant_sku;
        private Long stock_on_hand;
        private Long stock_reserved;
    }

    @Data
    public static class VariantOptionDTO {
        private UUID option_id;        // id của bảng product_option
        private UUID option_value_id;  // id của bảng product_option_value
    }
}
