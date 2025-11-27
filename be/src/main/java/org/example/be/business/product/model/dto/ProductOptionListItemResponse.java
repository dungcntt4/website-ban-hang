package org.example.be.business.product.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class ProductOptionListItemResponse {

    private UUID id;
    private String name;

    // toàn bộ giá trị của option (dùng để hiển thị badge)
    private List<String> values;

    @JsonProperty("value_count")
    private int valueCount;

    @JsonProperty("sku_used")
    private long skuUsed; // số SKU đang dùng option này
}