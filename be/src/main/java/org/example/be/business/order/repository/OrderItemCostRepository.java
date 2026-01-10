package org.example.be.business.order.repository;

import org.example.be.business.order.model.entity.OrderItemCost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public interface OrderItemCostRepository extends JpaRepository<OrderItemCost, UUID> {
    @Query(value = """
    SELECT COALESCE(
        SUM(oi.total_price) - COALESCE(SUM(cost.totalCost), 0),
        0
    )
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    LEFT JOIN (
        SELECT
            oic.order_item_id AS itemId,
            SUM(oic.cost_price * oic.quantity) AS totalCost
        FROM order_item_cost oic
        GROUP BY oic.order_item_id
    ) cost ON cost.itemId = oi.id
    WHERE o.status = 'DA_THANH_TOAN'
      AND o.created_at BETWEEN :start AND :end
""", nativeQuery = true)
    BigDecimal calculateProfit(Instant start, Instant end);


}
