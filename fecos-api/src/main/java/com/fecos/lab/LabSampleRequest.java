package com.fecos.lab;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class LabSampleRequest {

    @NotNull(message = "Sample type is required")
    private SampleType sampleType;

    @NotNull(message = "Well is required")
    private UUID wellId;

    private UUID collectedById;
    private LocalDateTime collectedAt;

    @NotNull(message = "Received at is required")
    private LocalDateTime receivedAt;

    private SamplePriority priority = SamplePriority.ROUTINE;
    private String testsRequested;
    private LabSampleStatus status;
}
