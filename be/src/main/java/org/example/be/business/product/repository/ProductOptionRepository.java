package org.example.be.business.product.repository;
import org.example.be.business.product.model.entity.ProductOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProductOptionRepository extends JpaRepository<ProductOption, UUID> {

    Optional<ProductOption> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}
