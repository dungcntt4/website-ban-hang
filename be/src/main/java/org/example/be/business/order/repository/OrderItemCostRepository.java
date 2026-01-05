package org.example.be.business.order.repository;

import org.example.be.business.order.model.entity.OrderItemCost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public interface OrderItemCostRepository extends JpaRepository<OrderItemCost, UUID> {
    @Query("""
    SELECT COALESCE(
        SUM(oi.totalPrice) - SUM(cost.totalCost),
        0
    )
    FROM OrderItem oi
    JOIN oi.order o
    JOIN (
        SELECT c.orderItem.id AS itemId,
               SUM(c.costPrice * c.quantity) AS totalCost
        FROM OrderItemCost c
        GROUP BY c.orderItem.id
    ) cost ON cost.itemId = oi.id
    WHERE o.status = 'DA_THANH_TOAN'
      AND o.createdAt BETWEEN :start AND :end
""")
    BigDecimal calculateProfit(Instant start, Instant end);
}
