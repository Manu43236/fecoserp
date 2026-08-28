package com.fecos.programs;

import java.time.Instant;

public record PlanHistoryEvent(
        String event,      // CREATED | STARTED | PAUSED | RESUMED | SUPERSEDED | RATE_CHANGE
        String label,
        Instant occurredAt,
        String detail      // null or human-readable description
) {}
