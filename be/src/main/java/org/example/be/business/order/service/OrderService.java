package org.example.be.business.order.service;

import lombok.RequiredArgsConstructor;
import org.example.be.business.auth.entity.User;
import org.example.be.business.order.model.dto.OrderDetailResponse;
import org.example.be.business.order.model.dto.OrderRequest;
import org.example.be.business.order.model.entity.Order;
import org.example.be.business.order.model.entity.OrderItem;
import org.example.be.business.order.model.entity.OrderItemCost;
import org.example.be.business.order.model.entity.OrderStatus;
import org.example.be.business.order.repository.OrderItemCostRepository;
import org.example.be.business.order.repository.OrderItemRepository;
import org.example.be.business.order.repository.OrderRepository;
import org.example.be.business.product.model.entity.InventoryItem;
import org.example.be.business.product.model.entity.ProductVariant;
import org.example.be.business.product.model.entity.PurchaseReceiptItem;
import org.example.be.business.product.repository.InventoryItemRepository;
import org.example.be.business.product.repository.ProductVariantRepository;
import org.example.be.business.product.repository.PurchaseReceiptItemRepository;
import org.example.be.business.product.service.ProductReviewService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductVariantRepository productVariantRepository; // ✅ ADD
    private final InventoryItemRepository inventoryItemRepository;
    private final PurchaseReceiptItemRepository purchaseReceiptItemRepository;
    private final OrderItemCostRepository orderItemCostRepository;
    private final ProductReviewService productReviewService;

    @Transactional
    public Order createOrder(User user, OrderRequest req) {

        Order order = new Order();
        order.setOrderCode(generateCode());
        order.setUser(user);
        order.setStatus(OrderStatus.CHO_THANH_TOAN);
        order.setTotalAmount(req.getTotalAmount());
        order.setPaymentMethod(req.getPaymentMethod());
        order.setReceiverName(req.getReceiverName());
        order.setReceiverPhone(req.getReceiverPhone());
        order.setShippingAddress(req.getShippingAddress());
        orderRepository.save(order);

        for (OrderRequest.OrderItemRequest i : req.getItems()) {

            ProductVariant variant = productVariantRepository
                    .findById(i.getProductVariantId())
                    .orElseThrow(() -> new RuntimeException("Product variant not found"));

            // 1️⃣ CHECK TỒN (NHANH – DÙNG INVENTORY)
            InventoryItem inv = inventoryItemRepository
                    .findByVariant(variant)
                    .orElseThrow(() -> new RuntimeException("Inventory not found"));

            long available = inv.getStockOnHand() - inv.getStockReserved();
            if (available < i.getQuantity()) {
                throw new RuntimeException("Not enough stock for " + variant.getSku());
            }

            // 2️⃣ TẠO ORDER ITEM
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProductVariant(variant);
            item.setQuantity(i.getQuantity());
            item.setUnitPrice(i.getUnitPrice());
            item.setTotalPrice(i.getTotalPrice());
            orderItemRepository.save(item);

            // 3️⃣ RESERVE KHO (CHỈ CỘNG)
            inv.setStockReserved(inv.getStockReserved() + i.getQuantity());
            inventoryItemRepository.save(inv);
        }

        return order;
    }

    private String generateCode() {
        return "ORD-" + System.currentTimeMillis();
    }
    @Transactional
    public void markPaid(String orderCode) {

        Order o = orderRepository.findByOrderCode(orderCode);

        // idempotent
        if (o.getStatus() == OrderStatus.DA_THANH_TOAN) return;

        for (OrderItem item : o.getOrderItems()) {

            ProductVariant variant = item.getProductVariant();

            InventoryItem inv = inventoryItemRepository
                    .findByVariant(variant)
                    .orElseThrow(() -> new RuntimeException("Inventory not found"));

            long remaining = item.getQuantity();

            List<PurchaseReceiptItem> lots =
                    purchaseReceiptItemRepository
                            .findAvailableLotsByVariantForUpdate(variant.getId());

            for (PurchaseReceiptItem lot : lots) {
                if (remaining <= 0) break;

                long take = Math.min(lot.getQuantityRemaining(), remaining);

                OrderItemCost cost = new OrderItemCost();
                cost.setOrderItem(item);
                cost.setPurchaseReceiptItem(lot);
                cost.setQuantity(take);
                cost.setCostPrice(lot.getImportPrice());
                orderItemCostRepository.save(cost);

                lot.setQuantityRemaining(lot.getQuantityRemaining() - take);
                remaining -= take;
            }

            if (remaining > 0) {
                throw new RuntimeException("Not enough stock for " + variant.getSku());
            }

            inv.setStockOnHand(inv.getStockOnHand() - item.getQuantity());
            inv.setStockReserved(inv.getStockReserved() - item.getQuantity());
        }

        o.setStatus(OrderStatus.DA_THANH_TOAN);
    }

    @Transactional
    public void markPaymentCancelled(String orderCode) {

        Order o = orderRepository.findByOrderCode(orderCode);

        if (o.getStatus() != OrderStatus.CHO_THANH_TOAN) return;

        for (OrderItem item : o.getOrderItems()) {
            InventoryItem inv = inventoryItemRepository
                    .findByVariant(item.getProductVariant())
                    .orElseThrow();

            inv.setStockReserved(inv.getStockReserved() - item.getQuantity());
        }

        o.setStatus(OrderStatus.HUY_THANH_TOAN);
    }

    @Transactional
    public void markPaymentFailed(String orderCode) {

        Order o = orderRepository.findByOrderCode(orderCode);

        if (o.getStatus() != OrderStatus.CHO_THANH_TOAN) return;

        for (OrderItem item : o.getOrderItems()) {
            InventoryItem inv = inventoryItemRepository
                    .findByVariant(item.getProductVariant())
                    .orElseThrow();

            inv.setStockReserved(inv.getStockReserved() - item.getQuantity());
        }

        o.setStatus(OrderStatus.THANH_TOAN_THAT_BAI);
    }
    @Transactional(readOnly = true)
    public List<Order> getOrdersByUser(User user) {
        return orderRepository.findByUserOrderByCreatedAtDesc(user);
    }
    @Transactional(readOnly = true)
    public OrderDetailResponse getOrderDetail(String orderCode, User user) {

        Order order = orderRepository
                .findDetailByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        // 🔥 TRUYỀN userId + service để set canReview
        return OrderDetailResponse.from(
                order,
                user.getId(),
                productReviewService
        );
    }
}
