package org.example.be.business.product.repository;
import org.example.be.business.product.model.entity.SpecificationAttribute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SpecificationAttributeRepository extends JpaRepository<SpecificationAttribute, UUID> {

    Optional<SpecificationAttribute> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}
