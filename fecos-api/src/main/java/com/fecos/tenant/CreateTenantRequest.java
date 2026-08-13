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
    @Pattern(regexp = "^[2-9]\\d{9}$", message = "Enter a valid US 10-digit mobile number")
    private String adminMobileNumber;

    @NotBlank
    @Pattern(regexp = "^\\d{4}$", message = "PIN must be exactly 4 digits")
    private String adminPin;
}
