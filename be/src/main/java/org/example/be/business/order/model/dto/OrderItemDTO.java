package org.example.be.business.order.model.dto;

import lombok.Getter;
import lombok.Setter;
import org.example.be.business.order.model.entity.OrderItem;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class OrderItemDTO {

    private UUID id;
    private ProductVariantDTO productVariantDTO;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;

    private boolean canReview;

    public static OrderItemDTO from(OrderItem item) {
        OrderItemDTO dto = new OrderItemDTO();
        dto.setId(item.getId());
        dto.setProductVariantDTO(
                ProductVariantDTO.from(item.getProductVariant())
        );
        dto.setQuantity(item.getQuantity());
        dto.setUnitPrice(item.getUnitPrice());
        dto.setTotalPrice(item.getTotalPrice());
        return dto;
    }

    public static OrderItemDTO from(OrderItem item, boolean canReview) {
        OrderItemDTO dto = from(item);
        dto.setCanReview(canReview);
        return dto;
    }
}

