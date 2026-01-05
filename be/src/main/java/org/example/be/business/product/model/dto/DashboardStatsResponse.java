package org.example.be.business.product.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardStatsResponse {

    private BigDecimal totalRevenue;
    private Long totalOrders;
    private Long totalProductsSold;
    private BigDecimal totalProfit;

    private List<String> revenueDates;
    private List<BigDecimal> revenueValues;

    private Map<String, Long> orderStatusRatios;

    private List<TopProductDTO> topProducts;

}
