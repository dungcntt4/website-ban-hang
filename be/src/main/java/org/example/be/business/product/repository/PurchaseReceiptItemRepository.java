package org.example.be.business.product.repository;

import jakarta.persistence.LockModeType;
import org.example.be.business.product.model.entity.PurchaseReceiptItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PurchaseReceiptItemRepository extends JpaRepository<PurchaseReceiptItem, UUID> {

    List<PurchaseReceiptItem> findByPurchaseReceiptId(UUID purchaseReceiptId);

    List<PurchaseReceiptItem> findByVariantId(UUID variantId);

    List<PurchaseReceiptItem> findByPurchaseReceiptIdIn(List<UUID> ids);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select p
        from PurchaseReceiptItem p
        where p.variant.id = :variantId
          and p.quantityRemaining > 0
        order by p.createdAt asc
    """)
    List<PurchaseReceiptItem> findAvailableLotsByVariantForUpdate(
            @Param("variantId") UUID variantId
    );
    
}
