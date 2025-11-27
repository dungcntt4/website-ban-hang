package org.example.be.business.product.model.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class ProductOptionDetailResponse {

    private UUID id;
    private String name;
    private List<OptionValueInfo> values;

    @Data
    public static class OptionValueInfo {
        private UUID id;
        private String value;
    }
}