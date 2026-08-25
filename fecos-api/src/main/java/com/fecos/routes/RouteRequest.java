package com.fecos.routes;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class RouteRequest {

    @NotNull(message = "Driver is required")
    private UUID driverId;

    private UUID vehicleId;

    @NotNull(message = "Route date is required")
    private LocalDate routeDate;

    private RouteStatus status = RouteStatus.PLANNED;

    private String notes;
}
