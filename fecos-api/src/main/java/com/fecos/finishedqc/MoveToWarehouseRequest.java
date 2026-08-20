package com.fecos.finishedqc;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class MoveToWarehouseRequest {

    @NotNull
    private UUID warehouseId;
}
