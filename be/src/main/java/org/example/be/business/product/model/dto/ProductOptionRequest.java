package org.example.be.business.product.model.dto;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class ProductOptionRequest {

    private OptionDTO option;
    private List<OptionValueDTO> values;

    @Data
    public static class OptionDTO {
        private String name;
    }

    @Data
    public static class OptionValueDTO {
        private String value;
    }
}
