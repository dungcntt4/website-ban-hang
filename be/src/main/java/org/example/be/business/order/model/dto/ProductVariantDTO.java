package org.example.be.business.order.model.dto;

import lombok.Getter;
import lombok.Setter;
import org.example.be.business.product.model.entity.ProductVariant;

import java.util.UUID;

@Getter
@Setter
public class ProductVariantDTO {

    private UUID id;
    private UUID productId;
    private String productName;

    private String sku;           // ← DÙNG SKU
    private String productImage;

    public static ProductVariantDTO from(ProductVariant variant) {
        ProductVariantDTO dto = new ProductVariantDTO();

        dto.setId(variant.getId());
        dto.setProductId(variant.getProduct().getId());
        dto.setProductName(variant.getProduct().getName());

        dto.setSku(variant.getSku());
        dto.setProductImage(variant.getProduct().getThumbnailUrl());

        return dto;
    }
}
