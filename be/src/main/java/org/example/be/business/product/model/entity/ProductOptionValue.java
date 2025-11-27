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
@Table(name = "product_option_value",
        uniqueConstraints = @UniqueConstraint(name = "uk_option_value_name", columnNames = {"option_id", "value"}),
        indexes = @Index(name = "idx_pov_option", columnList = "option_id"))
public class ProductOptionValue extends Auditable {
    @Id @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "option_id", nullable = false)
    private ProductOption option;

    @Column(name = "value", nullable = false, length = 120)
    private String value;

}