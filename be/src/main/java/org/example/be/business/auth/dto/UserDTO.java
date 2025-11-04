package org.example.be.business.auth.dto;

import org.example.be.business.auth.entity.User;

public record UserDTO(Long id, String email, User.Role role, boolean emailVerified) {}

