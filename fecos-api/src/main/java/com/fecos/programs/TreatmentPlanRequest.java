package com.fecos.programs;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class TreatmentPlanRequest {

    @NotNull(message = "Well is required")
    private UUID wellId;

    private UUID accountRepId;

    private TreatmentPlanStatus status = TreatmentPlanStatus.DRAFT;

    private String notes;

    private LocalDate startDate;

    private LocalDate endDate;
}
