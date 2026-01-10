package org.example.be.business.user.model.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class AdminUserResponse {
    private Long id;
    private String email;
    private String role;
    private boolean locked;
    private boolean emailVerified;

    private String fullName;
    private String phoneNumber;
    private boolean profileCompleted;

    // order
    private long totalOrders;
    private BigDecimal totalSpent;
}
