package org.example.be.business.product.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.be.common.util.Auditable;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "inventory_item",
        indexes = {
                @Index(name = "idx_inventory_variant", columnList = "variant_id")
        })
public class InventoryItem extends Auditable {
    @Id @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(name = "stock_on_hand", nullable = false)
    private long stockOnHand = 0;

    @Column(name = "stock_reserved", nullable = false)
    private long stockReserved = 0;

    // getters/setters
}
