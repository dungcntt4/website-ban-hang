package org.example.be.business.order.repository;

import org.example.be.business.auth.entity.User;
import org.example.be.business.order.model.entity.Order;
import org.example.be.business.order.model.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

    @Query("""
select distinct o from Order o
join fetch o.user
left join fetch o.orderItems oi
left join fetch oi.productVariant pv
left join fetch pv.product
order by o.createdAt desc
""")
    List<Order> findAllWithUser();

    @Query("""
select o from Order o
join o.user u
where
(:search is null or
 lower(o.orderCode) like lower(concat('%', :search, '%')) or
 lower(o.receiverName) like lower(concat('%', :search, '%')) or
 o.receiverPhone like concat('%', :search, '%')
)
and (:status is null or o.status = :status)
and (:fromDate is null or o.createdAt >= :fromDate)
and (:toDate is null or o.createdAt <= :toDate)
""")
    Page<Order> searchOrders(
            @Param("search") String search,
            @Param("status") OrderStatus status,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate,
            Pageable pageable
    );

    @Query("""
select distinct o from Order o
join fetch o.user
left join fetch o.orderItems oi
left join fetch oi.productVariant pv
left join fetch pv.product
where o.id in :ids
""")
    List<Order> fetchDetailsByIds(@Param("ids") List<UUID> ids);


    @Query("""
        SELECT SUM(o.totalAmount)
        FROM Order o
        WHERE o.status = :status
    """)
    Optional<BigDecimal> sumTotalAmountByStatus(OrderStatus status);

    List<Order> findTop5ByOrderByCreatedAtDesc();

    @Query("""
        SELECT MONTH(o.createdAt), SUM(o.totalAmount)
        FROM Order o
        WHERE o.status = :status
        GROUP BY MONTH(o.createdAt)
        ORDER BY MONTH(o.createdAt)
    """)
    List<Object[]> sumRevenueRaw(OrderStatus status);

    default Map<Integer, BigDecimal> sumRevenueGroupByMonth(OrderStatus status) {
        Map<Integer, BigDecimal> map = new LinkedHashMap<>();
        for (Object[] r : sumRevenueRaw(status)) {
            map.put((Integer) r[0], (BigDecimal) r[1]);
        }
        return map;
    }

    @Query("""
        SELECT COALESCE(SUM(o.totalAmount), 0)
        FROM Order o
        WHERE o.status = :status
          AND o.createdAt BETWEEN :start AND :end
    """)
    BigDecimal sumRevenue(OrderStatus status, Instant start, Instant end);

    @Query("""
        SELECT COUNT(o)
        FROM Order o
        WHERE o.status = :status
          AND o.createdAt BETWEEN :start AND :end
    """)
    Long countCompletedOrders(OrderStatus status, Instant start, Instant end);

    @Query("""
        SELECT DATE(o.createdAt), SUM(o.totalAmount)
        FROM Order o
        WHERE o.status = :status
          AND o.createdAt BETWEEN :start AND :end
        GROUP BY DATE(o.createdAt)
        ORDER BY DATE(o.createdAt)
    """)
    List<Object[]> revenueByDate(OrderStatus status, Instant start, Instant end);

    @Query("""
        SELECT o.status, COUNT(o)
        FROM Order o
        WHERE o.createdAt BETWEEN :start AND :end
        GROUP BY o.status
    """)
    List<Object[]> countByStatus(Instant start, Instant end);

    long countByUserIdAndStatus(Long userId, OrderStatus status);


    @Query("""
    select coalesce(sum(o.totalAmount), 0)
    from Order o
    where o.user.id = :userId
      and o.status = :status
""")
    BigDecimal sumTotalAmountByUserIdAndStatus(
            @Param("userId") Long userId,
            @Param("status") OrderStatus status
    );
}
