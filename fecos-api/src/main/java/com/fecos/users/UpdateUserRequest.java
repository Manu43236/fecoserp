package com.fecos.users;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class UpdateUserRequest {

    @NotBlank
    private String fullName;

    private String email;

    @NotNull
    private Role role;
}
