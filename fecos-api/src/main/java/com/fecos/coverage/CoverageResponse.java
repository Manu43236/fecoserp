package com.fecos.coverage;

import java.util.List;
import java.util.UUID;

/**
 * The compact coverage an Account Rep holds, split by level.
 * A whole-client entry implies all its leases/wells; a whole-lease entry implies all its wells.
 */
public record CoverageResponse(
        List<Node> clients,
        List<Node> leases,
        List<Node> wells
) {
    /** parent fields are null where not applicable (clients have no parent, leases have only a client). */
    public record Node(
            UUID id,
            String name,
            UUID clientId,
            String clientName,
            UUID leaseId,
            String leaseName
    ) {}
}
