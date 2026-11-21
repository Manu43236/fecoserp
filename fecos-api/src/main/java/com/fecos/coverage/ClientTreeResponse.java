package com.fecos.coverage;

import java.util.List;
import java.util.UUID;

/** A client's leases and their wells, for the "Add coverage" scoped selector. */
public record ClientTreeResponse(
        UUID clientId,
        String clientName,
        List<LeaseNode> leases
) {
    public record LeaseNode(UUID id, String name, List<WellNode> wells) {}
    public record WellNode(UUID id, String name) {}
}
