package com.fecos.routes;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class RouteRequest {

    // Optional at creation; required only to dispatch/start the route.
    private UUID driverId;

    private UUID vehicleId;

    // Free-text truck number. Lets a dispatcher type any value (incl. 3rd-party
    // trucks not in the fleet); matched fleet trucks also send vehicleId.
    private String truckNumber;

    private UUID warehouseId;

    @NotNull(message = "Route date is required")
    private LocalDate routeDate;

    private RouteStatus status = RouteStatus.PLANNED;

    private String notes;

    // Optional: when present, the route is created with these stops (and their
    // items) in one transaction. Used by the single-step "build whole route" form.
    @Valid
    private List<RouteStopRequest> stops;
}
