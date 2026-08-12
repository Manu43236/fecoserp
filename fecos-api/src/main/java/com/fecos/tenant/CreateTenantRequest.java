package com.fecos.tenant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;

@Getter
public class CreateTenantRequest {

    @NotBlank
    private String companyName;

    @NotBlank
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Subdomain must be lowercase alphanumeric with hyphens")
    private String subdomain;

    private String ownerName;
    private String contactPhone;
    private String contactEmail;

    private String primaryColor;
    private String darkColor;
    private String accentColor;

    private String plan;

    // Initial ADMIN user credentials
    @NotBlank
    private String adminFullName;

    @NotBlank
    @Pattern(regexp = "^\\d{10}$", message = "Mobile number must be 10 digits")
    private String adminMobileNumber;

    @NotBlank
    @Pattern(regexp = "^\\d{4,6}$", message = "PIN must be 4-6 digits")
    private String adminPin;
}
