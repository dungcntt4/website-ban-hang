package org.example.be.business.product.model.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class VariantPublicRespDTO {

    private UUID id;
    private String name;
    private String sku;
    private BigDecimal price;
    private BigDecimal discountPrice;
    private long stock;
}
