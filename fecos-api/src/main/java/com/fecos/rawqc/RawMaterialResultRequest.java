package com.fecos.rawqc;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class RawMaterialResultRequest {

    private String appearance;
    private Boolean colorOk;
    private String odor;
    private BigDecimal ph;
    private BigDecimal specificGravity;
    private String notes;

    @NotNull
    private RawMaterialStatus result; // PASSED or FAILED
}
