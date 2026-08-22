package com.fecos.servicereports;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TreatmentReportResponse(
        UUID id,
        UUID stopId,
        String wellName,
        String leaseName,
        String clientName,
        String techName,
        Instant performedAt,
        BigDecimal gpsLat,
        BigDecimal gpsLng,
        Instant gpsCapturedAt,
        String photoUrl,
        Instant photoCapturedAt,
        boolean soar,
        String soarNote,
        String soarAckByName,
        String soarAckAt,
        String soarAckNote,
        String sampleType,
        String sampleNotes,
        String signatureUrl,
        String signerName,
        Instant signedAt,
        String notes,
        Instant submittedAt,
        List<TreatmentLineResponse> lines
) {
    public record TreatmentLineResponse(
            UUID id,
            UUID planLineId,
            UUID tankId,
            String method,
            Boolean pumpRunning,
            BigDecimal rateFound,
            BigDecimal rateSetTo,
            Boolean onRate,
            Boolean applied,
            String notes,
            Instant recordedAt,
            int sortOrder
    ) {}
}
