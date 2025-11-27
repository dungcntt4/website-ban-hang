package org.example.be.business.product.repository;

import org.example.be.business.product.model.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InventoryRepository extends JpaRepository<InventoryItem, UUID> {
    List<InventoryItem> findByVariantProductId(UUID productId);

    @Modifying
    @Query("delete from InventoryItem i where i.variant.product.id = :productId")
    void deleteByVariantProductId(@Param("productId") UUID productId);
    Optional<InventoryItem> findByVariantId(UUID variantId);
}

