package com.fecos.users;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record SAUserResponse(
        String id,
        String fullName,
        String mobileNumber,
        String email,
        String role,
        boolean isActive,
        Instant createdAt,
        String tenantId,
        String tenantName,
        String pin
) {
    public static SAUserResponse from(UserEntity u, Map<UUID, String> tenantNames) {
        String tid = u.getTenantId() != null ? u.getTenantId().toString() : null;
        String tname = u.getTenantId() != null ? tenantNames.getOrDefault(u.getTenantId(), "—") : "—";
        return new SAUserResponse(
                u.getId().toString(),
                u.getFullName(),
                u.getMobileNumber(),
                u.getEmail(),
                u.getRole().name(),
                u.isActive(),
                u.getCreatedAt(),
                tid,
                tname,
                u.getPin()
        );
    }
}
