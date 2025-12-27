package org.example.be.business.order.repository;

import org.example.be.business.order.model.entity.Order;
import org.example.be.business.order.model.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {
    List<OrderItem> findByOrder(Order order);
}
