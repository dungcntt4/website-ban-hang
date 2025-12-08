package org.example.be.business.product.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.example.be.common.util.Auditable;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "product",
        indexes = {
                @Index(name = "idx_product_slug", columnList = "slug", unique = true),
                @Index(name = "idx_product_code", columnList = "code", unique = true),
                @Index(name = "idx_product_brand", columnList = "brand_id"),
                @Index(name = "idx_product_published", columnList = "is_published")
        })
@ToString(exclude = {"brand", "productCategories"})

public class Product extends Auditable {
    @Id @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "code", nullable = false, length = 60, unique = true)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "slug", nullable = false, length = 255, unique = true)
    private String slug;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @Column(name = "is_published", nullable = false)
    private boolean published = false;

    @Column(name = "short_description", columnDefinition = "text")
    private String shortDescription;

    @Column(name = "description", columnDefinition = "longtext")
    private String description;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "price_min", precision = 15, scale = 2)
    private BigDecimal priceMin;

    @Column(name = "sale_price_min", precision = 15, scale = 2)
    private BigDecimal salePriceMin;

    @Column(name = "total_sold", nullable = false)
    private long totalSold = 0;

    @Column(name = "total_reviews", nullable = false)
    private long totalReviews = 0;

    @Column(name = "average_rating", nullable = false)
    private double averageRating = 0.0;

    @Column(name = "is_deleted")
    private boolean deleted = false;

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    private List<ProductCategory> productCategories = new ArrayList<>();

    @OneToMany(mappedBy = "product")
    private List<ProductSpecificationValue> productSpecificationValues;

}
