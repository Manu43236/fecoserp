package com.fecos.finishedqc;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class FinishedProductResultRequest {

    private String appearance;
    private Boolean colorOk;
    private String odor;
    private BigDecimal ph;
    private BigDecimal specificGravity;
    private String notes;

    @NotNull
    private FinishedProductStatus result; // PASSED or FAILED
}
