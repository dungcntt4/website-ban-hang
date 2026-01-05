package org.example.be.business.order.controller;

import lombok.RequiredArgsConstructor;
import org.example.be.business.auth.entity.User;
import org.example.be.business.order.model.dto.OrderDetailResponse;
import org.example.be.business.order.model.dto.OrderRequest;
import org.example.be.business.order.model.dto.OrderResponse;
import org.example.be.business.order.model.entity.Order;
import org.example.be.business.order.model.entity.OrderStatus;
import org.example.be.business.order.service.OrderService;
import org.example.be.common.util.PageResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public OrderResponse createOrder(
            @AuthenticationPrincipal User user,
            @RequestBody OrderRequest request
    ) {
        Order order = orderService.createOrder(user, request);

        return new OrderResponse(
                order.getId(),
                order.getOrderCode(),
                order.getStatus(),
                order.getTotalAmount()
        );
    }

    @GetMapping("/me")
    public List<OrderResponse> getMyOrders(
            @AuthenticationPrincipal User user
    ) {
        return orderService.getOrdersByUser(user)
                .stream()
                .map(o -> new OrderResponse(
                        o.getId(),
                        o.getOrderCode(),
                        o.getStatus(),
                        o.getTotalAmount(),
                        o.getCreatedAt(),
                        o.getShippingAddress()
                ))
                .toList();
    }
    @GetMapping("/{orderCode}")
    public OrderDetailResponse getOrderDetail(
            @PathVariable String orderCode,
            @AuthenticationPrincipal User user
    ) {
        return orderService.getOrderDetail(orderCode, user);
    }

    @GetMapping
    public PageResponse<OrderDetailResponse> getOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate
    ) {
        return orderService.getOrders(
                page, size, search, status, fromDate, toDate
        );
    }

    @PutMapping("/{orderCode}/status")
    public void updateStatus(
            @PathVariable String orderCode,
            @RequestBody Map<String, String> body
    ) {
        orderService.updateStatus(orderCode, body.get("newStatus"));
    }
}