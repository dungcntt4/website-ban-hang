package org.example.be.business.order.repository;

import org.example.be.business.order.model.entity.OrderItemCost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface OrderItemCostRepository extends JpaRepository<OrderItemCost, UUID> {
}
