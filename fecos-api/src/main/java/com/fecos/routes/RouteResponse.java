package com.fecos.routes;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record RouteResponse(
        UUID id,
        UUID driverId,
        String driverName,
        String truckNumber,
        LocalDate routeDate,
        RouteStatus status,
        String notes,
        int stopCount,
        List<RouteStopResponse> stops,
        Instant createdAt
) {
    public static RouteResponse from(RouteEntity e, String driverName, int stopCount, List<RouteStopResponse> stops) {
        return new RouteResponse(
                e.getId(), e.getDriverId(), driverName, e.getTruckNumber(),
                e.getRouteDate(), e.getStatus(), e.getNotes(), stopCount, stops, e.getCreatedAt()
        );
    }
}
