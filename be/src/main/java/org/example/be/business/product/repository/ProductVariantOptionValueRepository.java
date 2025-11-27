package org.example.be.business.product.repository;

import org.example.be.business.product.model.entity.ProductVariantOptionValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductVariantOptionValueRepository extends JpaRepository<ProductVariantOptionValue, UUID> {
    List<ProductVariantOptionValue> findByVariantIdIn(List<UUID> variantIds);

    void deleteByVariantIdIn(List<UUID> variantIds);

    boolean existsByOptionId(UUID optionId);

    boolean existsByOptionValueId(UUID optionValueId);

    List<ProductVariantOptionValue> findByOptionIdIn(List<UUID> optionIds);
}
