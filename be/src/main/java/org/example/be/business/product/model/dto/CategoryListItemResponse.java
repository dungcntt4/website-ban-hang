package org.example.be.business.product.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryListItemResponse {
    private UUID id;
    private String name;
    private String slug;
    private UUID parentId;
    private Integer displayOrder;
}

