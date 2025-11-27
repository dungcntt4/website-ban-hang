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
@Table(name = "specification_attribute",
        uniqueConstraints = @UniqueConstraint(name = "uk_spec_attr_name", columnNames = {"name"}),
        indexes = @Index(name = "idx_spec_attr_name", columnList = "name"))
public class SpecificationAttribute extends Auditable {
    @Id @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "name", nullable = false, length = 180)
    private String name;

    // getters/setters
}
