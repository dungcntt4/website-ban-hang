package org.example.be.business.product.model.dto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class SpecAttributeRequest {

    private AttributeDTO attribute;
    private List<ValueDTO> values;

    @Data
    public static class AttributeDTO {
        private String name;
    }

    @Data
    public static class ValueDTO {
        @JsonProperty("spec_value_text")
        private String specValueText;
    }
}