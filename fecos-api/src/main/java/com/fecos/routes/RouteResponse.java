package com.fecos.routes;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record RouteResponse(
        UUID id,
        UUID driverId,
        String driverName,
        UUID vehicleId,
        String truckNumber,
        UUID warehouseId,
        String warehouseName,
        LocalDate routeDate,
        RouteStatus status,
        String notes,
        int stopCount,
        int completedStopCount,
        List<RouteStopResponse> stops,
        Instant createdAt,
        LocalDateTime loadConfirmedAt,
        LocalDateTime preTripConfirmedAt,
        Boolean preTripHasIssues
) {
    public static RouteResponse from(RouteEntity e, String driverName, String warehouseName,
                                     int stopCount, int completedStopCount, List<RouteStopResponse> stops) {
        return new RouteResponse(
                e.getId(), e.getDriverId(), driverName,
                e.getVehicleId(), e.getTruckNumber(),
                e.getWarehouseId(), warehouseName,
                e.getRouteDate(), e.getStatus(), e.getNotes(), stopCount, completedStopCount, stops,
                e.getCreatedAt(), e.getLoadConfirmedAt(),
                e.getPreTripConfirmedAt(), e.getPreTripHasIssues()
        );
    }
}
