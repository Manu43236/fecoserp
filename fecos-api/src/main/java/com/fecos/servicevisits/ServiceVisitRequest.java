package com.fecos.servicevisits;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ServiceVisitRequest(String name, UUID techId, LocalDate visitDate, String notes, List<UUID> wellIds) {}
