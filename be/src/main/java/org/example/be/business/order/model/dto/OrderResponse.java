package org.example.be.business.order.model.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.be.business.order.model.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderResponse {
    private UUID id;
    private String orderCode;
    private OrderStatus status;
    private BigDecimal totalAmount;

    private Instant createdAt;
    private String shippingAddress;

    public OrderResponse(UUID id, String orderCode, OrderStatus status, BigDecimal totalAmount) {
        this.id = id;
        this.orderCode = orderCode;
        this.status = status;
        this.totalAmount = totalAmount;
    }
}