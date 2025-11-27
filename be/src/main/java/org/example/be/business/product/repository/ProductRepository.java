package org.example.be.business.product.repository;

import org.example.be.business.product.model.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    // Lấy tất cả product chưa bị xoá
    List<Product> findByDeletedFalse();

    // Lấy chi tiết product chưa bị xoá
    Optional<Product> findByIdAndDeletedFalse(UUID id);

    // Dùng khi cần check tồn tại mà chưa bị xoá
    boolean existsByIdAndDeletedFalse(UUID id);
}