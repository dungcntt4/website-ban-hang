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
@Table(name = "product_specification_value",
        uniqueConstraints = @UniqueConstraint(name = "uk_product_spec_value", columnNames = {"product_id", "specification_value_id"}),
        indexes = {
                @Index(name = "idx_psv_product", columnList = "product_id"),
                @Index(name = "idx_psv_spec_value", columnList = "specification_value_id")
        })
public class ProductSpecificationValue extends Auditable {
    @Id @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "specification_value_id", nullable = false)
    private SpecificationValue specificationValue;

    // getters/setters
}