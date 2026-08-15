package com.fecos.programs;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class TreatmentPlanLineRequest {

    @NotNull(message = "Product is required")
    private UUID productId;

    @NotNull(message = "Rate is required")
    @Positive(message = "Rate must be positive")
    private BigDecimal recRate;

    @NotNull(message = "Method is required")
    private TreatmentPlanMethod method;

    private TreatmentPlanSchedule schedule;

    private String notes;
}
