package org.example.be.business.user.model.dto;

public record SaveUserProfileRequest(
        String fullName,
        String phoneNumber,
        String address
) {
}