package org.example.be.business.product.repository;

import org.example.be.business.product.model.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    // Lấy tất cả product chưa bị xoá
    List<Product> findByDeletedFalse();

    // Lấy chi tiết product chưa bị xoá
    Optional<Product> findByIdAndDeletedFalse(UUID id);

    // Dùng khi cần check tồn tại mà chưa bị xoá
    boolean existsByIdAndDeletedFalse(UUID id);
    List<Product> findByDeletedFalseAndPublishedTrue();

    @Query("""
        select distinct p
        from Product p
        join p.productCategories pc
        join pc.category c
        left join p.productSpecificationValues psv
        left join psv.specificationValue sv
        where p.deleted = false
          and p.published = true
          and c.slug = :slug
          and (:brandSlugs is null or p.brand.slug in :brandSlugs)
          and (:specValueIds is null or sv.id in :specValueIds)
    """)
    Page<Product> findPublishedByCategoryWithFilters(
            @Param("slug") String slug,
            @Param("brandSlugs") List<String> brandSlugs,
            @Param("specValueIds") List<UUID> specValueIds,
            Pageable pageable
    );

}