package org.example.be.business.product.repository;

import org.example.be.business.product.model.entity.PurchaseReceiptItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface PurchaseReceiptItemRepository extends JpaRepository<PurchaseReceiptItem, UUID> {

    List<PurchaseReceiptItem> findByPurchaseReceiptId(UUID purchaseReceiptId);

    List<PurchaseReceiptItem> findByVariantId(UUID variantId);

    List<PurchaseReceiptItem> findByPurchaseReceiptIdIn(List<UUID> ids);

}
