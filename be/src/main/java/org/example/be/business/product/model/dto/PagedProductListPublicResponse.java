package org.example.be.business.product.model.dto;

import lombok.Data;
import java.util.List;

@Data
public class PagedProductListPublicResponse {

    private List<ProductListItemDTO> products;

    private List<BrandListItemResponse> brands;

    private List<SpecificationFilterDTO> specifications;
    private List<CategoryBreadcrumbDTO> breadcrumb;
    private int pageNum;
    private int pageSize;
    private long totalElements;
    private int totalPages;

    public static class CategoryBreadcrumbDTO {
        private String name;
        private String slug;

        public CategoryBreadcrumbDTO() {
        }

        public CategoryBreadcrumbDTO(String name, String slug) {
            this.name = name;
            this.slug = slug;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getSlug() {
            return slug;
        }

        public void setSlug(String slug) {
            this.slug = slug;
        }
    }
}
