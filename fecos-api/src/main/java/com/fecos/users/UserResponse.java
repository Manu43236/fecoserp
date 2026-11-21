package com.fecos.users;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UserResponse(
        String id,
        String fullName,
        String mobileNumber,
        String email,
        String role,            // primary role — kept for backward compatibility
        List<String> roles,
        List<String> yardIds,
        List<String> yardNames,
        boolean isActive,
        Instant createdAt,
        String pin
) {
    public static UserResponse from(UserEntity u) {
        return from(u, List.of());
    }

    public static UserResponse from(UserEntity u, List<String> yardNames) {
        Role primary = u.getPrimaryRole();
        return new UserResponse(
                u.getId().toString(),
                u.getFullName(),
                u.getMobileNumber(),
                u.getEmail(),
                primary != null ? primary.name() : null,
                u.getRoles().stream().map(Role::name).toList(),
                u.getYardIds().stream().map(UUID::toString).toList(),
                yardNames,
                u.isActive(),
                u.getCreatedAt(),
                u.getPin()
        );
    }
}
