package org.example.be.business.product.repository;

import org.example.be.business.product.model.entity.Product;
import org.example.be.business.product.model.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {
    Optional<ProductVariant> findBySku(String sku);
    List<ProductVariant> findByProductId(UUID productId);
    @Query("""
            select v 
            from ProductVariant v
            join fetch v.product p
            where v.active = true
            order by p.name asc, v.sku asc
            """)
    List<ProductVariant> findAllActiveWithProduct();

    List<ProductVariant> findByProductIn(List<Product> products);
}