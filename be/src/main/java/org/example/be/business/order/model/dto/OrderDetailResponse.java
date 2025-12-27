package org.example.be.business.order.model.dto;

import lombok.Getter;
import lombok.Setter;
import org.example.be.business.order.model.entity.Order;
import org.example.be.business.order.model.entity.OrderItem;
import org.example.be.business.order.model.entity.OrderStatus;
import org.example.be.business.product.service.ProductReviewService;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter @Setter
public class OrderDetailResponse {

    private String orderCode;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private String shippingAddress;
    private String userName;
    private String userPhoneNumber;
    private Instant createdAt;
    private List<OrderItemDTO> items;

    public static OrderDetailResponse from(Order order) {
        OrderDetailResponse dto = new OrderDetailResponse();
        dto.setOrderCode(order.getOrderCode());
        dto.setStatus(order.getStatus());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setShippingAddress(order.getShippingAddress());
        dto.setUserName(order.getReceiverName());
        dto.setUserPhoneNumber(order.getReceiverPhone());
        dto.setCreatedAt(order.getCreatedAt());

        dto.setItems(
                order.getOrderItems()
                        .stream()
                        .map(OrderItemDTO::from)
                        .toList()
        );
        return dto;
    }
    public static OrderDetailResponse from(
            Order order,
            Long userId,
            ProductReviewService productReviewService
    ) {
        OrderDetailResponse dto = new OrderDetailResponse();
        dto.setOrderCode(order.getOrderCode());
        dto.setStatus(order.getStatus());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setShippingAddress(order.getShippingAddress());
        dto.setUserName(order.getReceiverName());
        dto.setUserPhoneNumber(order.getReceiverPhone());
        dto.setCreatedAt(order.getCreatedAt());

        dto.setItems(
                order.getOrderItems()
                        .stream()
                        .map(item -> OrderItemDTO.from(
                                item,
                                productReviewService.canReview(userId, item.getId())
                        ))
                        .toList()
        );

        return dto;
    }

}