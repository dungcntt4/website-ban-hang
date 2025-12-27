package org.example.be.business.cart.repository;

import org.example.be.business.auth.entity.User;
import org.example.be.business.cart.model.entity.CartItem;
import org.example.be.business.product.model.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CartItemRepository extends JpaRepository<CartItem, UUID> {

    List<CartItem> findByUser(User user);

    Optional<CartItem> findByUserAndProductVariant(User user, ProductVariant variant);

    void deleteByUserAndIdIn(User user, List<UUID> ids);
    List<CartItem> findByUserAndIdIn(User user, List<UUID> ids);

}
