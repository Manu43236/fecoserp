package com.fecos.users;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record SAUserResponse(
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
        String tenantId,
        String tenantName,
        String pin,
        Instant lastSignedInAt
) {
    public static SAUserResponse from(UserEntity u, Map<UUID, String> tenantNames, Map<UUID, Instant> lastSignIns) {
        String tid = u.getTenantId() != null ? u.getTenantId().toString() : null;
        String tname = u.getTenantId() != null ? tenantNames.getOrDefault(u.getTenantId(), "—") : "—";
        Role primary = u.getPrimaryRole();
        return new SAUserResponse(
                u.getId().toString(),
                u.getFullName(),
                u.getMobileNumber(),
                u.getEmail(),
                primary != null ? primary.name() : null,
                u.getRoles().stream().map(Role::name).toList(),
                u.getYardIds().stream().map(UUID::toString).toList(),
                List.of(),   // yard names not shown in the SA cross-tenant view
                u.isActive(),
                u.getCreatedAt(),
                tid,
                tname,
                u.getPin(),
                lastSignIns.get(u.getId())
        );
    }
}
