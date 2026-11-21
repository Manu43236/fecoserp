package com.fecos.users;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;

import java.util.Set;
import java.util.UUID;

@Getter
public class SACreateUserRequest {

    @NotNull
    private UUID tenantId;

    @NotBlank
    private String fullName;

    @NotBlank
    @Pattern(regexp = "^[2-9]\\d{9}$", message = "Enter a valid US 10-digit mobile number")
    private String mobileNumber;

    @NotBlank
    @Pattern(regexp = "^\\d{4}$", message = "PIN must be exactly 4 digits")
    private String pin;

    private String email;

    @NotEmpty(message = "At least one role is required")
    private Set<Role> roles;

    private Set<UUID> yardIds;
}
