package com.fecos.wells;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class WellRequest {

    @NotNull(message = "Lease is required")
    private UUID leaseId;

    @NotBlank(message = "Well name is required")
    @Size(max = 100)
    private String wellName;

    @Size(max = 50)
    private String wellNumber;

    @Size(max = 20)
    private String apiNumber;

    @NotBlank(message = "Pump type is required")
    private String pumpType;

    private boolean isActive = true;
}
