package com.fecos.inventory;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class WarehouseResponse {

    private UUID id;
    private String refNumber;
    private String name;
    private String location;
    private UUID yardId;
    private String yardName;
    @JsonProperty("isActive")
    private boolean isActive;
    private Instant createdAt;

    public static WarehouseResponse from(WarehouseEntity w) {
        return from(w, null);
    }

    public static WarehouseResponse from(WarehouseEntity w, String yardName) {
        WarehouseResponse r = new WarehouseResponse();
        r.id        = w.getId();
        r.refNumber = w.getRefNumber();
        r.name      = w.getName();
        r.location  = w.getLocation();
        r.yardId    = w.getYardId();
        r.yardName  = yardName;
        r.isActive  = w.isActive();
        r.createdAt = w.getCreatedAt();
        return r;
    }
}
