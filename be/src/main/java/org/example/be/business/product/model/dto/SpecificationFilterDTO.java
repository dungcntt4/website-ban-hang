package org.example.be.business.product.model.dto;

import lombok.Data;
import java.util.List;

@Data
public class SpecificationFilterDTO {
    private String attribute;
    private List<String> values;
}
