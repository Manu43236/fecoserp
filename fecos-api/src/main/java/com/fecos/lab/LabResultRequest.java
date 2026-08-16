package com.fecos.lab;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LabResultRequest {

    // Water Analysis
    private Double calcium;
    private Double magnesium;
    private Double sodium;
    private Double chlorides;
    private Double sulfates;
    private Double bicarbonates;
    private Double iron;
    private Double ph;
    private Double tds;
    private Double specificGravity;
    private Double dissolvedOxygen;

    // Bacteriological
    private Double srbCount;
    private Double apbCount;
    private Double treatmentEffectiveness;

    // Scale Analysis
    private String scaleType;
    private ScaleSeverity scaleSeverity;
    private String scaleRemediation;

    // Paraffin
    private Double pourPoint;
    private Double paraffinInhibitorEffectiveness;

    // Corrosion Wheel
    private Double corrosionRate;
    private Double corrosionInhibitorPerformance;

    // Failure Analysis
    private String failureType;
    private String failureRootCause;
    private String failureRecommendation;

    // Oil in Water
    private Double oilContent;

    // Notes
    private String labTechNotes;
}
