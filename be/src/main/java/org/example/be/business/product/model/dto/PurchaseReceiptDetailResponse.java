package org.example.be.business.product.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseReceiptDetailResponse {

    private UUID id;

    private String code;

    private LocalDate importDate;

    private String supplierName;

    private String note;          // nếu m thêm field này ở entity

    private Instant createdAt;

    private List<ItemDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemDto {

        private UUID id;

        private UUID variantId;

        private String variantSku;

        private String variantName;

        private long quantity;

        private long quantityRemaining;

        private BigDecimal importPrice;

        private BigDecimal lineAmount; // quantity * importPrice
    }
}
