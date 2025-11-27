package org.example.be.business.product.repository;

import org.example.be.business.product.model.entity.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface ProductCategoryRepository extends JpaRepository<ProductCategory, UUID> {
    List<ProductCategory> findByProductIdIn(Collection<UUID> productIds);
    List<ProductCategory> findByProductId(UUID productId);
    @Modifying
    @Query("delete from ProductCategory pc where pc.product.id = :productId")
    void deleteByProductId(@Param("productId") UUID productId);
}
