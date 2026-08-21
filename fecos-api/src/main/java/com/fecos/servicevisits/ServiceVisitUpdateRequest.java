package com.fecos.servicevisits;

import java.time.LocalDate;
import java.util.UUID;

public record ServiceVisitUpdateRequest(UUID techId, LocalDate visitDate, ServiceVisitStatus status, String notes) {}
