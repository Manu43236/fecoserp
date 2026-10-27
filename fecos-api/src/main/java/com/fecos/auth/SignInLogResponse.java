package com.fecos.auth;

import java.time.Instant;

public record SignInLogResponse(
        String userId,
        String fullName,
        String mobileNumber,
        String tenantId,
        String tenantName,
        String platform,
        Instant signedInAt
) {}
