package org.example.be.business.order.repository;

import org.example.be.business.auth.entity.User;
import org.example.be.business.order.model.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    Order findByOrderCode(String orderCode);
    List<Order> findByUserOrderByCreatedAtDesc(User user);

    Optional<Order> findByOrderCodeAndUser(String orderCode, User user);
    @Query("""
    select distinct o from Order o
    left join fetch o.orderItems oi
    left join fetch oi.productVariant pv
    left join fetch pv.product p
    where o.orderCode = :orderCode
""")
    Optional<Order> findDetailByOrderCode(
            @Param("orderCode") String orderCode
    );
}
