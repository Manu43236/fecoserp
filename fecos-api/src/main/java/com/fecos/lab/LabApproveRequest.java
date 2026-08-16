package com.fecos.lab;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LabApproveRequest {
    private boolean requiresTreatmentChange;
    private String approvalNotes;
}
