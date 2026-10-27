package com.fecos.auth;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sign_in_logs")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignInLogEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 10)
    private String platform;

    @Column(nullable = false)
    private Instant signedInAt;

    @PrePersist
    void prePersist() {
        if (id == null) id = UUID.randomUUID();
        if (signedInAt == null) signedInAt = Instant.now();
    }
}
