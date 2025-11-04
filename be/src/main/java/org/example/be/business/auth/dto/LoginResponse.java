package org.example.be.business.auth.dto;

public record LoginResponse(String accessToken, UserDTO user) {}
