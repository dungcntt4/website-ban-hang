package org.example.be.business.product.repository;

import org.example.be.business.product.model.entity.PurchaseReceipt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PurchaseReceiptRepository extends JpaRepository<PurchaseReceipt, UUID> {

    long countByCodeStartingWith(String prefix);
    List<PurchaseReceipt> findAllByOrderByCreatedAtDesc();

}
