package com.fecos.users;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;

import java.util.Set;
import java.util.UUID;

@Getter
public class UpdateUserRequest {

    @NotBlank
    private String fullName;

    private String email;

    @NotEmpty(message = "At least one role is required")
    private Set<Role> roles;

    private Set<UUID> yardIds;
}
