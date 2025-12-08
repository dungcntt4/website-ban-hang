package org.example.be.business.product.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.be.common.util.Auditable;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "brand",
        indexes = {
                @Index(name = "idx_brand_slug", columnList = "slug", unique = true),
                @Index(name = "idx_brand_name", columnList = "name")
        })
public class Brand extends Auditable {
    @Id @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "name", nullable = false, length = 180)
    private String name;

    @Column(name = "slug", nullable = false, length = 255, unique = true)
    private String slug;

    @Column(name = "image", length = 500)
    private String image;

    // getters/setters

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }
}
