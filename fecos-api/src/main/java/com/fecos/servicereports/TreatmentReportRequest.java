package com.fecos.servicereports;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TreatmentReportRequest(
        Instant performedAt,
        BigDecimal gpsLat,
        BigDecimal gpsLng,
        Instant gpsCapturedAt,
        String photoUrl,
        Instant photoCapturedAt,
        boolean soar,
        String soarNote,
        String sampleType,
        String sampleNotes,
        String signatureUrl,
        String signerName,
        Instant signedAt,
        String notes,
        List<TreatmentLineRequest> lines
) {
    public record TreatmentLineRequest(
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
