package org.example.be.business.product.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseReceiptListItemResponse {

    private UUID id;

    private String code;

    private LocalDate importDate;

    private String supplierName;

    private long totalQuantity;       // tổng quantity của các dòng
    private int itemCount;            // số dòng
    private BigDecimal totalAmount;   // sum(quantity * importPrice)

    private Instant createdAt;
}
