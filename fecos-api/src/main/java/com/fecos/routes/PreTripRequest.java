package com.fecos.routes;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PreTripRequest {
    private boolean hasIssues;
    private String notes;
}
