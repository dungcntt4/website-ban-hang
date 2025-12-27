package org.example.be.business.product.model.dto;

import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
public class ReviewPublicRespDTO {

    private UUID id;
    private String userName;   // email truncated
    private int rating;
    private String comment;
    private Instant createdAt;
}
