package com.fecos.users;

import com.fecos.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "users")
public class UserEntity extends BaseEntity {

    /** Highest-to-lowest precedence used to pick a single "primary" role for nav/dashboards. */
    private static final List<Role> ROLE_PRECEDENCE = List.of(
            Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER,
            Role.ACCOUNT_REP, Role.LAB_TECH, Role.TRUCK_DRIVER, Role.SERVICE_TECH);

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "mobile_number")
    private String mobileNumber;

    @Column(name = "email")
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "pin_hash")
    private String pinHash;

    @Column(name = "pin")
    private String pin;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    private Set<Role> roles = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_yards", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "yard_id")
    private Set<UUID> yardIds = new HashSet<>();

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    /** The single highest-precedence role, used for nav/home/dashboard selection. */
    @Transient
    public Role getPrimaryRole() {
        return ROLE_PRECEDENCE.stream().filter(roles::contains).findFirst().orElse(null);
    }

    public boolean hasRole(Role role) {
        return roles.contains(role);
    }
}
