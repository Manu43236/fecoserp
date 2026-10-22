package com.fecos.common;

import java.util.List;

public record BulkResult(int created, List<RowError> errors) {
    public record RowError(int row, String message) {}
}
