package org.example.be.business.auth.dto;

public record ResetPasswordRequest(String token, String newPassword) {}
