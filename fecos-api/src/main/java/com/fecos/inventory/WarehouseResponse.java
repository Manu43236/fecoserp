package com.fecos.inventory;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class WarehouseResponse {

    private UUID id;
    private String name;
    private String location;
    private boolean isActive;
    private Instant createdAt;

    public static WarehouseResponse from(WarehouseEntity w) {
        WarehouseResponse r = new WarehouseResponse();
        r.id        = w.getId();
        r.name      = w.getName();
        r.location  = w.getLocation();
        r.isActive  = w.isActive();
        r.createdAt = w.getCreatedAt();
        return r;
    }
}
