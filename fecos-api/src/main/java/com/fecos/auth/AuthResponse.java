package com.fecos.auth;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponse {
    private String token;
    private String role;
    private String fullName;
    private String mobile;
}
