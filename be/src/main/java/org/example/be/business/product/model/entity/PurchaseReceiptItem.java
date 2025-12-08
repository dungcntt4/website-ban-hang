package org.example.be.business.product.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.example.be.common.util.Auditable;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(
        name = "purchase_receipt_item",
        indexes = {
                @Index(name = "idx_pr_variant", columnList = "variant_id"),
                @Index(name = "idx_pr_receipt", columnList = "purchase_receipt_id")
        }
)
public class PurchaseReceiptItem extends Auditable {

    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_receipt_id", nullable = false)
    private PurchaseReceipt purchaseReceipt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(name = "quantity", nullable = false)
    private long quantity;   // số lượng nhập

    @Column(name = "quantity_remaining", nullable = false)
    private long quantityRemaining; // số lượng còn lại của lô này

    @Column(name = "import_price", precision = 18, scale = 2, nullable = false)
    private BigDecimal importPrice;  // giá nhập

}