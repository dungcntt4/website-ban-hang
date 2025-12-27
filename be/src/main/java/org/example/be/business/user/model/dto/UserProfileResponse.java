package org.example.be.business.user.model.dto;

import lombok.Builder;

@Builder
public record UserProfileResponse(
        Long id,
        String email,
        String fullName,
        String phoneNumber,
        String address,
        boolean isDefault
) {
}
