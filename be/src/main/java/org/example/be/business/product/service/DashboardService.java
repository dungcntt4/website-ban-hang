package org.example.be.business.product.service;
import lombok.RequiredArgsConstructor;
import org.example.be.business.auth.repository.UserRepository;
import org.example.be.business.order.model.entity.Order;
import org.example.be.business.order.model.entity.OrderItem;
import org.example.be.business.order.model.entity.OrderStatus;
import org.example.be.business.order.repository.OrderItemCostRepository;
import org.example.be.business.order.repository.OrderItemRepository;
import org.example.be.business.order.repository.OrderRepository;
import org.example.be.business.product.model.dto.DashboardOrderDTO;
import org.example.be.business.product.model.dto.DashboardOrderItemDTO;
import org.example.be.business.product.model.dto.DashboardProductVariantDTO;
import org.example.be.business.product.model.dto.DashboardStatsResponse;
import org.example.be.business.product.model.dto.DashboardSummaryResponse;
import org.example.be.business.product.model.dto.TopProductDTO;
import org.example.be.business.product.repository.ProductRepository;
import org.example.be.business.user.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Month;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderItemCostRepository orderItemCostRepository;
    /* ================= SUMMARY ================= */
    public DashboardSummaryResponse getSummary() {

        BigDecimal totalRevenue =
                orderRepository.sumTotalAmountByStatus(OrderStatus.DA_THANH_TOAN)
                        .orElse(BigDecimal.ZERO);

        long totalOrders = orderRepository.count();
        long totalProducts = productRepository.countByDeletedFalse();
        long totalCustomers = userRepository.countCustomers();

        List<Order> recentOrders =
                orderRepository.findTop5ByOrderByCreatedAtDesc();

        List<DashboardOrderDTO> orderDTOs =
                recentOrders.stream()
                        .map(this::mapOrder)
                        .toList();

        return DashboardSummaryResponse.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .totalProducts(totalProducts)
                .totalCustomers(totalCustomers)
                .recentOrders(orderDTOs)
                .build();
    }

    /* ================= MONTHLY REVENUE ================= */
    public Map<String, BigDecimal> getMonthlyRevenue() {

        List<Object[]> raw =
                orderRepository.sumRevenueRaw(OrderStatus.DA_THANH_TOAN);

        Map<Integer, BigDecimal> tmp = new HashMap<>();
        for (Object[] row : raw) {
            Integer month = (Integer) row[0];
            BigDecimal value = (BigDecimal) row[1];
            tmp.put(month, value);
        }

        Map<String, BigDecimal> result = new LinkedHashMap<>();
        for (int m = 1; m <= 12; m++) {
            result.put("T" + m, tmp.getOrDefault(m, BigDecimal.ZERO));
        }

        return result;
    }

    /* ================= MAPPING ================= */
    private DashboardOrderDTO mapOrder(Order o) {

        String userName = "Khách lẻ";
        String userPhone = null;

        if (o.getUser() != null) {
            var profileOpt =
                    userProfileRepository.findByUserIdAndDefaultProfileTrue(o.getUser().getId());

            if (profileOpt.isPresent()) {
                var profile = profileOpt.get();
                userName = profile.getFullName();
                userPhone = profile.getPhoneNumber();
            }
        }

        return DashboardOrderDTO.builder()
                .id(o.getId())
                .orderCode(o.getOrderCode())
                .status(o.getStatus().name())
                .totalAmount(o.getTotalAmount())
                .createdAt(o.getCreatedAt())
                .userName(userName)
                .userPhoneNumber(userPhone)
                .shippingAddress(o.getShippingAddress())
                .items(
                        o.getOrderItems().stream()
                                .map(this::mapItem)
                                .toList()
                )
                .build();
    }


    private DashboardOrderItemDTO mapItem(OrderItem i) {

        return DashboardOrderItemDTO.builder()
                .id(i.getId())
                .quantity(i.getQuantity())
                .unitPrice(i.getUnitPrice())
                .totalPrice(i.getTotalPrice())
                .canReview(false)
                .productVariantDTO(
                        DashboardProductVariantDTO.builder()
                                .id(i.getProductVariant().getId())
                                .sku(i.getProductVariant().getSku())
                                .productName(
                                        i.getProductVariant()
                                                .getProduct()
                                                .getName()
                                )
                                .productImage(
                                        i.getProductVariant()
                                                .getProduct()
                                                .getThumbnailUrl()
                                )
                                .build()
                )
                .build();
    }

    public DashboardStatsResponse getStats(LocalDate startDate, LocalDate endDate) {

        ZoneId zone = ZoneId.systemDefault();

        Instant start = startDate
                .atStartOfDay(zone)
                .toInstant();

        Instant end = endDate
                .plusDays(1)
                .atStartOfDay(zone)
                .toInstant()
                .minusMillis(1);

        BigDecimal revenue =
                orderRepository.sumRevenue(OrderStatus.DA_THANH_TOAN, start, end);

        Long totalOrders =
                orderRepository.countCompletedOrders(OrderStatus.DA_THANH_TOAN, start, end);

        Long productsSold =
                orderItemRepository.sumProductsSold(start, end);

        BigDecimal profit =
                orderItemCostRepository.calculateProfit(start, end);

        // Revenue chart
        List<Object[]> rawRevenue =
                orderRepository.revenueByDate(OrderStatus.DA_THANH_TOAN, start, end);

        List<String> dates = new ArrayList<>();
        List<BigDecimal> values = new ArrayList<>();
        rawRevenue.forEach(r -> {
            dates.add(r[0].toString());
            values.add((BigDecimal) r[1]);
        });

        // Status pie
        Map<String, Long> statusMap = new HashMap<>();
        orderRepository.countByStatus(start, end).forEach(r -> {
            statusMap.put(r[0].toString(), (Long) r[1]);
        });

        // Top products
        List<TopProductDTO> topProducts =
                productRepository.findTopProducts(start, end)
                        .stream().limit(5).toList();

        return DashboardStatsResponse.builder()
                .totalRevenue(revenue)
                .totalOrders(totalOrders)
                .totalProductsSold(productsSold)
                .totalProfit(profit)
                .revenueDates(dates)
                .revenueValues(values)
                .orderStatusRatios(statusMap)
                .topProducts(topProducts)
                .build();
    }
}
