package com.fecos.servicevisits;

import java.util.UUID;

public record ServiceVisitStopRequest(UUID wellId, String notes) {}
