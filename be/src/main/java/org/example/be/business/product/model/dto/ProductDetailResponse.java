package org.example.be.business.product.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class ProductDetailResponse {

    private UUID id; // product id

    private ProductInfo product;
    private List<PictureInfo> pictures;
    private List<SpecificationInfo> specifications;
    private List<VariantInfo> variants;

    @Data
    public static class ProductInfo {
        private String code;
        private String name;
        private String slug;

        @JsonProperty("brand_id")
        private UUID brandId;

        @JsonProperty("is_published")
        private boolean published;

        @JsonProperty("short_description")
        private String shortDescription;

        private String description;

        @JsonProperty("thumbnail_url")
        private String thumbnailUrl;

        private List<UUID> categories;
    }

    @Data
    public static class PictureInfo {
        private String url;

        @JsonProperty("alt_text")
        private String altText;
    }

    @Data
    public static class SpecificationInfo {
        @JsonProperty("specification_attribute_id")
        private UUID specificationAttributeId;

        @JsonProperty("specification_attribute_name")
        private String specificationAttributeName;

        @JsonProperty("specification_value_id")
        private UUID specificationValueId;
    }

    @Data
    public static class VariantInfo {
        private String sku;
        private String name;

        @JsonProperty("discount_price")
        private BigDecimal discountPrice;

        private BigDecimal price;

        @JsonProperty("is_active")
        private boolean active;

        private List<VariantOptionInfo> options;
    }

    @Data
    public static class VariantOptionInfo {

        @JsonProperty("option_id")
        private UUID optionId;

        @JsonProperty("option_value_id")
        private UUID optionValueId;

        @JsonProperty("option_name")
        private String optionName;

        @JsonProperty("option_value_label")
        private String optionValueLabel;
    }


}
