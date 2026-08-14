package com.fecos.masters;

import java.util.UUID;

public record ProductUnitResponse(UUID id, String name, int sortOrder, boolean isSystem, boolean isActive) {
    public static ProductUnitResponse from(ProductUnitEntity e) {
        return new ProductUnitResponse(e.getId(), e.getName(), e.getSortOrder(), e.isSystem(), e.isActive());
    }
}
