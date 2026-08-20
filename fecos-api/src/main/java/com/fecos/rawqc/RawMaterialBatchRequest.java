package com.fecos.rawqc;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class RawMaterialBatchRequest {

    @NotBlank
    private String supplierName;

    @NotBlank
    private String materialName;

    @NotNull
    private BigDecimal quantity;

    @NotBlank
    private String unit;

    @NotNull
    private LocalDate receivedDate;

    private String supplierLotNumber;
}
