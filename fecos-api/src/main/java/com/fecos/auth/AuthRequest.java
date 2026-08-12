package com.fecos.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;

@Getter
public class AuthRequest {

    @NotBlank
    @Pattern(regexp = "^\\+?1?[2-9]\\d{9}$", message = "Enter a valid US mobile number")
    private String mobileNumber;

    @NotBlank
    @Pattern(regexp = "^\\d{4,6}$", message = "PIN must be 4 to 6 digits")
    private String pin;
}
