package org.example.be.business.product.model.dto;

import lombok.Data;

import java.util.List;

@Data
public class HomeProductResponse {

    // Giảm giá sâu nhất
    private List<ProductListItemDTO> deepDiscountProducts;

    // Nhiều đánh giá nhất
    private List<ProductListItemDTO> mostReviewedProducts;

    // Đánh giá cao nhất
    private List<ProductListItemDTO> highestRatedProducts;

    // Bán chạy nhất
    private List<ProductListItemDTO> bestSellingProducts;
}
