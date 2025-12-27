package org.example.be.business.order.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.be.business.product.model.entity.PurchaseReceiptItem;
import org.example.be.common.util.Auditable;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "order_item_cost")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderItemCost extends Auditable {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "binary(16)")
    private UUID id;

    // ===== FK → order_items =====
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    // ===== FK → purchase_receipt_item (lô nhập) =====
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_receipt_item_id", nullable = false)
    private PurchaseReceiptItem purchaseReceiptItem;

    // Số lượng lấy từ lô này
    @Column(nullable = false)
    private Long quantity;

    // Giá nhập tại thời điểm lấy (snapshot)
    @Column(name = "cost_price", precision = 18, scale = 2, nullable = false)
    private BigDecimal costPrice;
}