package com.fecos.tanks;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
public class TankEventRequest {

    @NotNull(message = "Event type is required")
    private TankEventType eventType;

    private BigDecimal amountGallons;

    private BigDecimal recRate;

    private BigDecimal levelPct;

    @NotNull(message = "Event timestamp is required")
    private Instant eventAt;

    private String notes;
}
