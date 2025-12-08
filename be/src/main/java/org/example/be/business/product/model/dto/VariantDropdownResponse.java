package org.example.be.business.product.model.dto;

import java.util.UUID;

public record VariantDropdownResponse(
        UUID id,
        String sku,
        String productName,
        String variantName
) {}
