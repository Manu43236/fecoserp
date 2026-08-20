package com.fecos.vehicles;

import java.time.Instant;
import java.util.UUID;

public record VehicleResponse(
        UUID id,
        VehicleType vehicleType,
        String make,
        String model,
        Integer year,
        String licensePlate,
        String vinNumber,
        String dotNumber,
        Integer currentMileage,
        VehicleStatus status,
        String notes,
        Instant createdAt
) {}
