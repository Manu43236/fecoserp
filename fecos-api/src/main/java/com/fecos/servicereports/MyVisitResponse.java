package com.fecos.servicereports;

import java.util.List;
import java.util.UUID;

public record MyVisitResponse(
        UUID id,
        String name,
        String visitDate,
        String status,
        List<MyVisitStopResponse> stops
) {}
