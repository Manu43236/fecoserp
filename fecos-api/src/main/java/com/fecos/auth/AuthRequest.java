package com.fecos.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class AuthRequest {

    @NotBlank
    @Email(message = "Enter a valid email address")
    private String email;

    @NotBlank
    private String password;
}
