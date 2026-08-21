package com.fecos.servicevisits;

public record ServiceVisitStopUpdateRequest(ServiceVisitStopStatus status, Boolean sampleCollected, String notes) {}
