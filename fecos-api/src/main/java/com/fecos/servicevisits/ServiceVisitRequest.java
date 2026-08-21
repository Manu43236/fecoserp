package com.fecos.servicevisits;

import java.time.LocalDate;
import java.util.UUID;

public record ServiceVisitRequest(UUID techId, LocalDate visitDate, String notes) {}
