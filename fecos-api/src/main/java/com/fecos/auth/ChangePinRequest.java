package com.fecos.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class ChangePinRequest {

    @NotBlank
    private String currentPin;

    @NotBlank
    @Size(min = 4, max = 4, message = "New PIN must be exactly 4 digits")
    private String newPin;
}
