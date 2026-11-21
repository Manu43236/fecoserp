package com.fecos.inventory;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class WarehouseRequest {

    @NotBlank
    @Size(max = 150)
    private String name;

    @Size(max = 255)
    private String location;

    @NotNull(message = "Yard is required")
    private UUID yardId;

    @JsonProperty("isActive")
    private boolean isActive = true;
}
