package com.fecos.users;

import java.time.Instant;

public record UserResponse(
        String id,
        String fullName,
        String mobileNumber,
        String email,
        String role,
        boolean isActive,
        Instant createdAt,
        String pin
) {
    public static UserResponse from(UserEntity u) {
        return new UserResponse(
                u.getId().toString(),
                u.getFullName(),
                u.getMobileNumber(),
                u.getEmail(),
                u.getRole().name(),
                u.isActive(),
                u.getCreatedAt(),
                u.getPin()
        );
    }
}
