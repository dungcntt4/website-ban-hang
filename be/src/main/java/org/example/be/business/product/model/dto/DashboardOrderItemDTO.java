package org.example.be.business.product.model.dto;

import lombok.Builder;
import lombok.Data;
import org.example.be.business.order.model.dto.ProductVariantDTO;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class DashboardOrderItemDTO {
    private UUID id;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
    private DashboardProductVariantDTO productVariantDTO;
    private boolean canReview;
}
