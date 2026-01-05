package org.example.be.business.product.model.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class DashboardOrderDTO {
    private UUID id;
    private String orderCode;
    private String status;
    private BigDecimal totalAmount;
    private Instant createdAt;
    private String userName;
    private String userPhoneNumber;
    private String shippingAddress;
    private List<DashboardOrderItemDTO> items;
}
