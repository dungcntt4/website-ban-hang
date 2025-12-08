package org.example.be.business.product.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class PurchaseReceiptCreateRequest {

    private String code;  // có thể null, BE tự gen

    @JsonProperty("import_date")
    private LocalDate importDate;

    @JsonProperty("supplier_name")
    private String supplierName;

    private String note;

    @JsonProperty("items")
    private List<ItemDTO> items;

    @Data
    public static class ItemDTO {

        @JsonProperty("variant_id")
        private UUID variantId;   // join sang ProductVariant

        private long quantity;

        @JsonProperty("import_price")
        private BigDecimal importPrice;
    }
}
