package org.example.be.business.product.model.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class CategoryListItemResponse {
    private UUID id;
    private String name;
    private String slug;
    private UUID parentId;
    private Integer displayOrder;
}

