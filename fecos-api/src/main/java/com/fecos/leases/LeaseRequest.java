package com.fecos.leases;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class LeaseRequest {

    @NotNull(message = "Client is required")
    private UUID clientId;

    @NotBlank(message = "Lease name is required")
    @Size(max = 100)
    private String leaseName;

    @Size(max = 100)
    private String county;

    @Size(max = 50)
    private String state;

    private BigDecimal gpsLat;
    private BigDecimal gpsLng;
    private String directions;
    private boolean isActive = true;
}
