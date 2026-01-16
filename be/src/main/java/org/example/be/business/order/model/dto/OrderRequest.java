package org.example.be.business.order.model.dto;


import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class OrderRequest {

    /** VNPay | COD | MOMO */
    private String paymentMethod;

    /** Tổng tiền đơn hàng (FE tính) */
    private BigDecimal totalAmount;

    /** Thông tin giao hàng */
    private String receiverName;
    private String receiverPhone;
    private String shippingAddress;
    private List<UUID> cartItemIds;
    /** Danh sách sản phẩm */
    private List<OrderItemRequest> items;

    @Data
    public static class OrderItemRequest {

        /** product_variant.id */
        private UUID productVariantId;

        private int quantity;

        /** giá vốn tại thời điểm bán */
        private BigDecimal costPrice;

        /** giá bán 1 sản phẩm */
        private BigDecimal unitPrice;

        /** quantity × unitPrice */
        private BigDecimal totalPrice;
    }
}
