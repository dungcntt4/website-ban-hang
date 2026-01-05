package org.example.be.business.product.repository;

import jakarta.persistence.LockModeType;
import org.example.be.business.product.model.entity.InventoryItem;
import org.example.be.business.product.model.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<InventoryItem> findByVariant(ProductVariant variant);
    List<InventoryItem> findByVariantIn(List<ProductVariant> variants);

}
