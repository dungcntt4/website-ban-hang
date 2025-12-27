package org.example.be.business.order.controller;

import lombok.RequiredArgsConstructor;
import org.example.be.business.auth.entity.User;
import org.example.be.business.order.model.dto.OrderDetailResponse;
import org.example.be.business.order.model.dto.OrderRequest;
import org.example.be.business.order.model.dto.OrderResponse;
import org.example.be.business.order.model.entity.Order;
import org.example.be.business.order.service.OrderService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}