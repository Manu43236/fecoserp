package com.fecos.auth;

import com.fecos.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.login(request)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> me(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.ok(authService.me(userId)));
    }

    @PostMapping("/change-pin")
    public ResponseEntity<ApiResponse<Void>> changePin(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody ChangePinRequest request) {
        authService.changePin(userId, request);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
