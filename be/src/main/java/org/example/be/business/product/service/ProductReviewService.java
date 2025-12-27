package org.example.be.business.product.service;

import lombok.RequiredArgsConstructor;
import org.example.be.business.order.model.entity.Order;
import org.example.be.business.order.model.entity.OrderItem;
import org.example.be.business.order.model.entity.OrderStatus;
import org.example.be.business.order.repository.OrderItemRepository;
import org.example.be.business.product.model.entity.Product;
import org.example.be.business.product.model.entity.ProductReview;
import org.example.be.business.product.repository.ProductReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductReviewService {

    private final ProductReviewRepository reviewRepository;
    private final OrderItemRepository orderItemRepository;

    /**
     * Đánh giá sản phẩm
     * - Logic theo order_item
     * - Lưu review theo product
     * - Cập nhật totalReviews + averageRating
     */
    public void reviewProduct(
            Long userId,
            UUID orderItemId,
            int rating,
            String comment
    ) {

        // 1. Lấy order item
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new RuntimeException("Order item không tồn tại"));

        Order order = orderItem.getOrder();

        // 2. Check order thuộc user
        if (!order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Không phải đơn hàng của bạn");
        }

        // 3. Check trạng thái đơn
        if (order.getStatus() != OrderStatus.DA_THANH_TOAN) {
            throw new RuntimeException("Đơn hàng chưa giao thành công");
        }

        // 4. Lấy product từ variant
        Product product = orderItem.getProductVariant().getProduct();

        // 5. Check user đã review product này chưa
        boolean reviewed =
                reviewRepository.existsByUserIdAndProductId(userId, product.getId());

        if (reviewed) {
            throw new RuntimeException("Bạn đã đánh giá sản phẩm này");
        }

        // 6. Lưu review
        ProductReview review = new ProductReview();
        review.setRating(rating);
        review.setComment(comment);
        review.setUserId(userId);
        review.setProduct(product);

        reviewRepository.save(review);

        // 7. Cập nhật totalReviews + averageRating
        long oldTotalReviews = product.getTotalReviews();
        double oldAverageRating = product.getAverageRating();

        double newAverageRating =
                (oldAverageRating * oldTotalReviews + rating)
                        / (oldTotalReviews + 1);

        product.setTotalReviews(oldTotalReviews + 1);
        product.setAverageRating(newAverageRating);
        // KHÔNG cần productRepository.save(product)
        // vì product đang managed entity
    }

    /**
     * Check có được phép đánh giá hay không (cho UI)
     */
    @Transactional(readOnly = true)
    public boolean canReview(Long userId, UUID orderItemId) {

        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new RuntimeException("Order item không tồn tại"));

        Order order = orderItem.getOrder();

        if (!order.getUser().getId().equals(userId)) return false;
        if (order.getStatus() != OrderStatus.DA_THANH_TOAN) return false;

        UUID productId = orderItem.getProductVariant().getProduct().getId();

        return !reviewRepository.existsByUserIdAndProductId(userId, productId);
    }
}
