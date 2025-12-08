package org.example.be.business.product.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.be.common.util.Auditable;
import org.hibernate.annotations.UuidGenerator;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "category",
        indexes = {
                @Index(name = "idx_category_slug", columnList = "slug", unique = true),
                @Index(name = "idx_category_parent", columnList = "parent_id"),
                @Index(name = "idx_category_name", columnList = "name")
        })
public class Category extends Auditable {
    @Id @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "name", nullable = false, length = 180)
    private String name;

    @Column(name = "slug", nullable = false, length = 255, unique = true)
    private String slug;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parent;

    @Column(name = "display_order")
    private Integer displayOrder;

    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    private List<ProductCategory> productCategories = new ArrayList<>();

}
