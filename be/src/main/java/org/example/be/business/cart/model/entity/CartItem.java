package org.example.be.business.cart.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.example.be.business.auth.entity.User;
import org.example.be.business.product.model.entity.ProductVariant;
import org.example.be.common.util.Auditable;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "cart_item",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_cart_user_variant",
                        columnNames = {"user_id", "product_variant_id"}
                )
        },
        indexes = {
                @Index(name = "idx_cart_user", columnList = "user_id"),
                @Index(name = "idx_cart_variant", columnList = "product_variant_id")
        }
)
public class CartItem extends Auditable {

    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_variant_id", nullable = false)
    private ProductVariant productVariant;

    @Column(name = "quantity", nullable = false)
    private int quantity;
}
