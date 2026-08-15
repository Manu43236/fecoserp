package com.fecos.routes;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class RouteStopRequest {

    @NotNull(message = "Lease is required")
    private UUID leaseId;

    @NotNull(message = "Well is required")
    private UUID wellId;

    private String notes;

    @Valid
    private List<RouteStopItemRequest> items;
}
