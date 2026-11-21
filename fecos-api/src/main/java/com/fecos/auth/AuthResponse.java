package com.fecos.auth;

import com.fecos.users.Role;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AuthResponse {
    private String token;
    private String id;
    private String fullName;
    private String email;
    private Role role;            // primary role — kept for backward compatibility
    private List<String> roles;
    private String tenantId;
    private String tenantName;
    private String primaryColor;
    private String darkColor;
    private String accentColor;
}
