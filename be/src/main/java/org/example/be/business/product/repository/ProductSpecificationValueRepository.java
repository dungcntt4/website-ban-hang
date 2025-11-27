package org.example.be.business.product.repository;

import org.example.be.business.product.model.entity.ProductSpecificationValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ProductSpecificationValueRepository extends JpaRepository<ProductSpecificationValue, UUID> {

    List<ProductSpecificationValue> findByProductId(UUID productId);

    @Modifying
    @Query("delete from ProductSpecificationValue psv where psv.product.id = :productId")
    void deleteByProductId(@Param("productId") UUID productId);

    boolean existsBySpecificationValueId(UUID specValueId);

    boolean existsBySpecificationValueAttributeId(UUID attributeId);
}

