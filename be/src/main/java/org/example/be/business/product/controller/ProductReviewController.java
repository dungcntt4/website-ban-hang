package org.example.be.business.product.controller;

import lombok.RequiredArgsConstructor;
import org.example.be.business.auth.entity.User;
import org.example.be.business.product.service.ProductReviewService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.example.be.business.product.model.dto.ProductReviewRequest;

import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ProductReviewController {

    private final ProductReviewService reviewService;

    // FE check có được đánh giá orderItem không
    @GetMapping("/can-review")
    public boolean canReview(
            @RequestParam UUID orderItemId,
            @AuthenticationPrincipal User user
    ) {
        return reviewService.canReview(user.getId(), orderItemId);
    }

    // FE submit đánh giá
    @PostMapping
    public void createReview(
            @RequestBody ProductReviewRequest request,
            @AuthenticationPrincipal User user
    ) {
        reviewService.reviewProduct(
                user.getId(),
                request.getOrderItemId(),
                request.getRating(),
                request.getComment()
        );
    }
}
