package com.fecos.coverage;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

/** Compact coverage selection to assign to an AR. Any list may be empty. */
@Getter
@Setter
public class CoverageRequest {
    private List<UUID> clientIds = List.of();
    private List<UUID> leaseIds  = List.of();
    private List<UUID> wellIds   = List.of();
}
