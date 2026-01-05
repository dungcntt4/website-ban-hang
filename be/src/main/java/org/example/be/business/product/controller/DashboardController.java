package org.example.be.business.product.controller;

import lombok.RequiredArgsConstructor;
import org.example.be.business.product.model.dto.DashboardStatsResponse;
import org.example.be.business.product.model.dto.DashboardSummaryResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.example.be.business.product.service.DashboardService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public DashboardSummaryResponse summary() {
        return dashboardService.getSummary();
    }

    @GetMapping("/monthly-revenue")
    public Map<String, BigDecimal> monthlyRevenue() {
        return dashboardService.getMonthlyRevenue();
    }
    @GetMapping("/stats")
    public DashboardStatsResponse stats(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate
    ) {
        return dashboardService.getStats(startDate, endDate);
    }
}
