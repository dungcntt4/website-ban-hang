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

    @Data
    public static class ProductDTO {
        private String code;
        private String name;
        private String slug;
        private UUID brand_id;

        @JsonProperty("is_published")
        private boolean published;

        @JsonProperty("short_description")
        private String short_description;

        private String description;

        @JsonProperty("thumbnail_url")
        private String thumbnail_url;

        private List<UUID> categories;
    }

    @Data
    public static class PictureDTO {
        private String url;

        @JsonProperty("alt_text")
        private String alt_text;
    }

    @Data
    public static class SpecDTO {
        @JsonProperty("specification_value_id")
        private UUID specification_value_id;
    }

    @Data
    public static class VariantDTO {
        private String sku;
        private String name;


        @JsonProperty("discount_price")
        private BigDecimal discount_price;

        private BigDecimal price;

        @JsonProperty("is_active")
        private boolean active;

        private List<VariantOptionDTO> options;
    }

    @Data
    public static class VariantOptionDTO {
        @JsonProperty("option_id")
        private UUID option_id;        // id của bảng product_option

        @JsonProperty("option_value_id")
        private UUID option_value_id;  // id của bảng product_option_value
    }
}
