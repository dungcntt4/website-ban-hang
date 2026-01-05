package org.example.be.business.product.model.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class DashboardProductVariantDTO {
    private UUID id;
    private String sku;
    private String productName;
    private String productImage;
}
