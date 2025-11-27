package org.example.be.business.product.model.dto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class SpecAttributeDetailResponse {

    private UUID id;
    private String name;
    private List<ValueInfo> values;

    @Data
    public static class ValueInfo {
        private UUID id;

        @JsonProperty("spec_value_text")
        private String specValueText;
    }
}