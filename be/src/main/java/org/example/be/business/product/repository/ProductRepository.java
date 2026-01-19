package org.example.be.business.product.repository;

import org.example.be.business.product.model.dto.DashboardStatsResponse;
import org.example.be.business.product.model.dto.TopProductDTO;
import org.example.be.business.product.model.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDateTime;
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
    select p
    from Product p
    join p.productCategories pc
    join pc.category c
    left join p.productSpecificationValues psv
    left join psv.specificationValue sv
    where p.deleted = false
      and p.published = true
      and c.slug = :slug
      and (:brandSlugs is null or p.brand.slug in :brandSlugs)
      and (
            :attrCount = 0
            or sv.id in :specValueIds
      )
    group by p.id
    having (
            :attrCount = 0
            or count(distinct sv.attribute.id) = :attrCount
    )
""")
    Page<Product> findPublishedByCategoryWithFilters(
            @Param("slug") String slug,
            @Param("brandSlugs") List<String> brandSlugs,
            @Param("specValueIds") List<UUID> specValueIds,
            @Param("attrCount") long attrCount,
            Pageable pageable
    );


    @Query("""
        select distinct p from Product p
        left join p.productCategories pc
        where p.deleted = false
          and (:search is null or
               lower(p.name) like lower(concat('%', :search, '%')) or
               lower(p.code) like lower(concat('%', :search, '%')))
          and (:published is null or p.published = :published)
          and (:categoryId is null or pc.category.id = :categoryId)
    """)
    Page<Product> searchAdminProducts(
                @Param("search") String search,
                @Param("published") Boolean published,
                @Param("categoryId") UUID categoryId,
                Pageable pageable
    );

    @Query("""
    SELECT p FROM Product p
    JOIN p.brand b
    WHERE p.deleted = false
      AND p.published = true
      AND (
           LOWER(p.name) LIKE %:keyword%
        OR LOWER(p.code) LIKE %:keyword%
        OR LOWER(b.name) LIKE %:keyword%
      )
""")
    Page<Product> searchPublic(
            @Param("keyword") String keyword,
            Pageable pageable
    );


    long countByDeletedFalse();

    @Query("""
        SELECT new org.example.be.business.product.model.dto.TopProductDTO(
            p.name,
            SUM(oi.quantity)
        )
        FROM OrderItem oi
        JOIN oi.order o
        JOIN oi.productVariant pv
        JOIN pv.product p
        WHERE o.status = 'DA_THANH_TOAN'
          AND o.createdAt BETWEEN :start AND :end
        GROUP BY p.id, p.name
        ORDER BY SUM(oi.quantity) DESC
    """)
    List<TopProductDTO> findTopProducts(Instant start, Instant end);
    // Giảm giá sâu nhất
    @Query("""
        SELECT p FROM Product p
        WHERE p.published = true
          AND p.salePriceMin IS NOT NULL
          AND p.priceMin > p.salePriceMin
        ORDER BY (p.priceMin - p.salePriceMin) / p.priceMin DESC
    """)
    List<Product> findDeepDiscount(Pageable pageable);

    // Nhiều review nhất
    @Query("""
        SELECT p FROM Product p
        WHERE p.published = true
        ORDER BY p.totalReviews DESC
    """)
    List<Product> findMostReviewed(Pageable pageable);

    // Đánh giá cao nhất
    @Query("""
        SELECT p FROM Product p
        WHERE p.published = true
        ORDER BY p.averageRating DESC, p.totalReviews DESC
    """)
    List<Product> findHighestRated(Pageable pageable);

    // Bán chạy nhất
    @Query("""
        SELECT p FROM Product p
        WHERE p.published = true
        ORDER BY p.totalSold DESC
    """)
    List<Product> findBestSelling(Pageable pageable);

    @Query("""
    select p from Product p
    where p.published = true
      and (p.deleted is null or p.deleted = false)
""")
    List<Product> findAllPublished();

}