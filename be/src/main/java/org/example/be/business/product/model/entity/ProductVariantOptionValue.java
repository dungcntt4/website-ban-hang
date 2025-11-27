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
@Table(name = "product_variant_option_value",
        uniqueConstraints = {
                // Mỗi variant chỉ có 1 giá trị cho một option nhất định
                @UniqueConstraint(name = "uk_variant_option", columnNames = {"variant_id", "option_id"}),
                // Tránh lặp cặp (variant, option_value)
                @UniqueConstraint(name = "uk_variant_option_value", columnNames = {"variant_id", "option_value_id"})
        },
        indexes = {
                @Index(name = "idx_vov_variant", columnList = "variant_id"),
                @Index(name = "idx_vov_option", columnList = "option_id"),
                @Index(name = "idx_vov_option_value", columnList = "option_value_id")
        })
public class ProductVariantOptionValue extends Auditable {
    @Id @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "option_id", nullable = false)
    private ProductOption option;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "option_value_id", nullable = false)
    private ProductOptionValue optionValue;

    // getters/setters
}