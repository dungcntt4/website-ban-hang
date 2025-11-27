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
@Table(name = "specification_value",
        indexes = {
                @Index(name = "idx_spec_value_attr", columnList = "spec_attribute_id")
        })
public class SpecificationValue extends Auditable {
    @Id @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "spec_attribute_id", nullable = false)
    private SpecificationAttribute attribute;

    @Column(name = "spec_value_text", nullable = false, length = 255)
    private String valueText;

    // getters/setters
}
