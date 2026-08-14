package com.fecos.inventory;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WarehouseRequest {

    @NotBlank
    @Size(max = 150)
    private String name;

    @Size(max = 255)
    private String location;

    private boolean isActive = true;
}
