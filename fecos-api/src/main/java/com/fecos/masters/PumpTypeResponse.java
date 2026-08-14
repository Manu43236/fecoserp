package com.fecos.masters;

import java.util.UUID;

public record PumpTypeResponse(UUID id, String name, int sortOrder, boolean isSystem, boolean isActive) {

    public static PumpTypeResponse from(PumpTypeEntity e) {
        return new PumpTypeResponse(e.getId(), e.getName(), e.getSortOrder(), e.isSystem(), e.isActive());
    }
}
