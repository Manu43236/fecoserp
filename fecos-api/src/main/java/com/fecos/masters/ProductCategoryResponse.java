package com.fecos.masters;

import java.util.UUID;

public record ProductCategoryResponse(UUID id, String name, int sortOrder, boolean isSystem, boolean isActive) {
    public static ProductCategoryResponse from(ProductCategoryEntity e) {
        return new ProductCategoryResponse(e.getId(), e.getName(), e.getSortOrder(), e.isSystem(), e.isActive());
    }
}
