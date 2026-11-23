package com.fecos.routes;

import java.util.UUID;

/** A stop a driver couldn't deliver. The office reviews these and decides the follow-up. */
public record SkippedStopResponse(
        UUID stopId,
        UUID routeId,
        String routeDate,
        String wellName,
        String leaseName,
        String clientName,
        String skipReason,
        String driverName
) {}
