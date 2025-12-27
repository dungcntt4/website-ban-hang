package org.example.be.business.payment.model.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class VNPayCreateRequest {
    private String orderCode;        // ORD-...
    private BigDecimal amount;       // VND (FE tính)
    private String orderInfo;        // "Thanh toán đơn hàng #ORD-..."
    private String orderType;        // "fashion"
    private String language;         // "vn"
}
