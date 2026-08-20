package com.fecos.vehicles;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VehicleRequest {

    @NotNull(message = "Vehicle type is required")
    private VehicleType vehicleType;

    @NotBlank(message = "Make is required")
    private String make;

    @NotBlank(message = "Model is required")
    private String model;

    @NotNull(message = "Year is required")
    private Integer year;

    @NotBlank(message = "License plate is required")
    private String licensePlate;

    private String vinNumber;
    private String dotNumber;
    private Integer currentMileage;
    private VehicleStatus status;
    private String notes;
}
