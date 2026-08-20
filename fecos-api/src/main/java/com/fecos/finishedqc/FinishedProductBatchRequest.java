package com.fecos.finishedqc;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class FinishedProductBatchRequest {

    @NotNull
    private UUID productId;

    @NotNull
    private BigDecimal quantity;

    @NotBlank
    private String unit;

    @NotNull
    private LocalDate blendDate;
}
