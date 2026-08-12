package com.fecos.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class AuthRequest {

    @NotBlank
    private String mobileNumber;

    @NotBlank
    private String pin;
}
