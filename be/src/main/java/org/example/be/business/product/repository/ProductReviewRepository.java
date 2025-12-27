package org.example.be.business.product.repository;

import org.example.be.business.product.model.entity.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ProductReviewRepository extends JpaRepository<ProductReview, UUID> {
    @Query("""
        SELECT r.id AS id,
               r.rating AS rating,
               r.comment AS comment,
               r.createdAt AS createdAt,
               u.email AS userEmail
        FROM ProductReview r
        JOIN User u ON u.id = r.userId
        WHERE r.product.id = :productId
        ORDER BY r.createdAt DESC
    """)
    List<ReviewUserProjection> findReviewsWithUser(UUID productId);

    interface ReviewUserProjection {
        UUID getId();
        int getRating();
        String getComment();
        Instant getCreatedAt();
        String getUserEmail();
    }

    boolean existsByUserIdAndProductId(Long userId, UUID productId);

}
