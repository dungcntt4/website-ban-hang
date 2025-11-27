package org.example.be.business.product.repository;

import org.example.be.business.product.model.entity.ProductOptionValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductOptionValueRepository extends JpaRepository<ProductOptionValue, UUID> {
    List<ProductOptionValue> findByOptionId(UUID optionId);

    List<ProductOptionValue> findByOptionIdIn(List<UUID> optionIds);
}
