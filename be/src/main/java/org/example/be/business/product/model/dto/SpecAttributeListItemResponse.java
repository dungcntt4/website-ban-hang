package org.example.be.business.product.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class SpecAttributeListItemResponse {
    private UUID id;
    private String name;

    @JsonProperty("value_count")
    private int valueCount;

    @JsonProperty("values_preview")
    private List<String> valuesPreview;
}