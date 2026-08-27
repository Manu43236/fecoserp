package com.fecos.routes;

import java.util.List;
import java.util.UUID;

public record RouteStopResponse(
        UUID id,
        UUID routeId,
        UUID leaseId,
        String leaseName,
        UUID wellId,
        String wellName,
        int sequenceOrder,
        RouteStopStatus status,
        String notes,
        String skipReason,
        List<RouteStopItemResponse> items,
        Double deliveryLat,
        Double deliveryLng,
        String deliveryPhotoUrl,
        java.time.LocalDateTime deliveredAt
) {
    public static RouteStopResponse from(RouteStopEntity e, String leaseName, String wellName, List<RouteStopItemResponse> items) {
        return new RouteStopResponse(
                e.getId(), e.getRouteId(), e.getLeaseId(), leaseName,
                e.getWellId(), wellName, e.getSequenceOrder(), e.getStatus(),
                e.getNotes(), e.getSkipReason(), items,
                e.getDeliveryLat(), e.getDeliveryLng(), e.getDeliveryPhotoUrl(), e.getDeliveredAt()
        );
    }
}
