package com.fecos.pumpshop;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PumpRequest {

    @NotBlank
    @Size(max = 100)
    private String serialNumber;

    @Size(max = 100)
    private String make;

    @Size(max = 100)
    private String model;

    @Size(max = 100)
    private String pumpType;

    private PumpOwner owner = PumpOwner.OWN;

    private String notes;
}
