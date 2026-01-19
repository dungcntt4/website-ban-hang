package org.example.be.business.product.repository;

import org.example.be.business.product.model.entity.SpecificationValue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SpecificationValueRepository extends JpaRepository<SpecificationValue, UUID> {
    List<SpecificationValue> findByAttributeId(UUID attributeId);
    List<SpecificationValue> findAllByIdIn(List<UUID> specificationValueIds);
}

