package com.fecos.pumpshop;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class PumpMaintenanceRequest {

    @NotNull
    private MaintenanceType maintenanceType;

    @NotNull
    private Instant performedAt;

    private String notes;
}
