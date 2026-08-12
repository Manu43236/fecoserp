package com.fecos.auth;

import com.fecos.users.Role;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponse {
    private String token;
    private String id;
    private String fullName;
    private String email;
    private Role role;
    private String tenantId;
    private String tenantName;
    private String primaryColor;
    private String darkColor;
    private String accentColor;
}
