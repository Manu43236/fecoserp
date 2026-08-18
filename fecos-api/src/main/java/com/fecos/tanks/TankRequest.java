package com.fecos.tanks;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class TankRequest {

    private String serialNumber;

    @NotNull(message = "Capacity is required")
    @Positive(message = "Capacity must be positive")
    private BigDecimal capacityGallons;

    private UUID wellId;

    private TankStatus status;

    private Instant installedAt;
}
