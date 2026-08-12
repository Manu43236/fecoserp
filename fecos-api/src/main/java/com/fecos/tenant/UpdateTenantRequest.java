package com.fecos.tenant;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class UpdateTenantRequest {

    @NotBlank
    private String companyName;

    private String ownerName;
    private String contactPhone;
    private String contactEmail;

    private String primaryColor;
    private String darkColor;
    private String accentColor;

    private String plan;
}
