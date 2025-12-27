package org.example.be.business.product.model.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class ProductReviewRequest {
    private UUID orderItemId;   // dùng để check nghiệp vụ
    private int rating;
    private String comment;
}