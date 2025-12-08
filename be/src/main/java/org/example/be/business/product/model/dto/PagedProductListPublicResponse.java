package org.example.be.business.product.model.dto;

import lombok.Data;
import java.util.List;

@Data
public class PagedProductListPublicResponse {

    private List<ProductListItemDTO> products;

    private List<BrandListItemResponse> brands;

    private List<SpecificationFilterDTO> specifications;

    private int pageNum;
    private int pageSize;
    private long totalElements;
    private int totalPages;
}
