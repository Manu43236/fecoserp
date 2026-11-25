package com.fecos.yards;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class YardResponse {

    private UUID id;
    private String refNumber;
    private String name;
    private String location;
    @JsonProperty("isActive")
    private boolean isActive;
    private Instant createdAt;

    public static YardResponse from(YardEntity y) {
        YardResponse r = new YardResponse();
        r.id        = y.getId();
        r.refNumber = y.getRefNumber();
        r.name      = y.getName();
        r.location  = y.getLocation();
        r.isActive  = y.isActive();
        r.createdAt = y.getCreatedAt();
        return r;
    }
}
