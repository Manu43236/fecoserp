package com.fecos.users;

import com.fecos.common.RefNumberService;
import com.fecos.yards.YardRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final YardRepository yardRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefNumberService refNumberService;

    /** Roles that require the user to belong to at least one yard. */
    private static final Set<Role> YARD_REQUIRED = Set.of(
            Role.SERVICE_TECH, Role.TRUCK_DRIVER, Role.ACCOUNT_REP);

    public List<UserResponse> findAll() {
        UUID tenantId = currentTenantId();
        return userRepository.findAllByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId)
                .stream().map(this::toResponse).toList();
    }

    public List<UserResponse> findByRole(Role role) {
        UUID tenantId = currentTenantId();
        return userRepository.findAllByTenantIdAndRole(tenantId, role)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public UserResponse create(CreateUserRequest req) {
        UUID tenantId = currentTenantId();
        if (userRepository.existsByMobileNumberAndTenantIdAndIsDeletedFalse(req.getMobileNumber(), tenantId))
            throw new IllegalArgumentException("Mobile number already registered in this tenant");

        Set<Role> roles = validateRoles(req.getRoles());
        Set<UUID> yardIds = validateYards(req.getRoles(), req.getYardIds(), tenantId);

        UserEntity user = new UserEntity();
        user.setTenantId(tenantId);
        int seq = userRepository.maxRefSeq(tenantId) + 1;
        user.setRefSeq(seq);
        user.setRefNumber(refNumberService.next(tenantId, "USR", seq));
        user.setFullName(req.getFullName());
        user.setMobileNumber(req.getMobileNumber());
        user.setEmail(req.getEmail());
        user.setRoles(roles);
        user.setYardIds(yardIds);
        user.setPin(req.getPin());
        user.setPinHash(passwordEncoder.encode(req.getPin()));
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse update(UUID id, UpdateUserRequest req) {
        UserEntity user = findForTenant(id);
        user.setFullName(req.getFullName());
        user.setEmail(req.getEmail());
        user.setRoles(validateRoles(req.getRoles()));
        user.setYardIds(validateYards(req.getRoles(), req.getYardIds(), user.getTenantId()));
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void resetPin(UUID id, ResetPinRequest req) {
        UserEntity user = findForTenant(id);
        user.setPin(req.getPin());
        user.setPinHash(passwordEncoder.encode(req.getPin()));
        userRepository.save(user);
    }

    @Transactional
    public UserResponse toggleActive(UUID id) {
        UserEntity user = findForTenant(id);
        user.setActive(!user.isActive());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse createForTenant(SACreateUserRequest req) {
        UUID tenantId = req.getTenantId();
        if (userRepository.existsByMobileNumberAndTenantIdAndIsDeletedFalse(req.getMobileNumber(), tenantId))
            throw new IllegalArgumentException("Mobile number already registered in this tenant");

        Set<Role> roles = validateRoles(req.getRoles());
        Set<UUID> yardIds = validateYards(req.getRoles(), req.getYardIds(), tenantId);

        UserEntity user = new UserEntity();
        user.setTenantId(tenantId);
        int seq2 = userRepository.maxRefSeq(tenantId) + 1;
        user.setRefSeq(seq2);
        user.setRefNumber(refNumberService.next(tenantId, "USR", seq2));
        user.setFullName(req.getFullName());
        user.setMobileNumber(req.getMobileNumber());
        user.setEmail(req.getEmail());
        user.setRoles(roles);
        user.setYardIds(yardIds);
        user.setPin(req.getPin());
        user.setPinHash(passwordEncoder.encode(req.getPin()));
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateById(UUID id, UpdateUserRequest req) {
        UserEntity user = userRepository.findById(id)
                .filter(u -> !u.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        user.setFullName(req.getFullName());
        user.setEmail(req.getEmail());
        user.setRoles(validateRoles(req.getRoles()));
        user.setYardIds(validateYards(req.getRoles(), req.getYardIds(), user.getTenantId()));
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void resetPinById(UUID id, ResetPinRequest req) {
        UserEntity user = userRepository.findById(id)
                .filter(u -> !u.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        user.setPin(req.getPin());
        user.setPinHash(passwordEncoder.encode(req.getPin()));
        userRepository.save(user);
    }

    @Transactional
    public void delete(UUID id) {
        UserEntity user = findForTenant(id);
        String currentId = SecurityContextHolder.getContext().getAuthentication().getName();
        if (user.getId().toString().equals(currentId))
            throw new IllegalArgumentException("Cannot delete your own account");
        user.setDeleted(true);
        userRepository.save(user);
    }

    // ── Validation & response ──────────────────────────────────────────────────

    /** Enforce the allowed role combinations and return a clean set. */
    private Set<Role> validateRoles(Set<Role> requested) {
        if (requested == null || requested.isEmpty())
            throw new IllegalArgumentException("At least one role is required");
        Set<Role> roles = new HashSet<>(requested);
        if (roles.contains(Role.SUPER_ADMIN))
            throw new IllegalArgumentException("SUPER_ADMIN cannot be assigned here");
        if (roles.contains(Role.ACCOUNT_REP) && roles.size() > 1)
            throw new IllegalArgumentException("Account Rep cannot be combined with other roles");
        if (roles.contains(Role.ADMIN) && roles.contains(Role.MANAGER))
            throw new IllegalArgumentException("A user cannot be both Admin and Manager");
        return roles;
    }

    /** A user with a field/field-facing role must belong to at least one (valid) yard. */
    private Set<UUID> validateYards(Set<Role> roles, Set<UUID> requested, UUID tenantId) {
        Set<UUID> yardIds = requested == null ? new HashSet<>() : new HashSet<>(requested);
        boolean yardRequired = roles != null && roles.stream().anyMatch(YARD_REQUIRED::contains);
        if (yardRequired && yardIds.isEmpty())
            throw new IllegalArgumentException("Service techs, drivers, and account reps must be assigned to at least one yard");
        for (UUID yardId : yardIds) {
            yardRepository.findByIdAndTenantIdAndIsDeletedFalse(yardId, tenantId)
                    .orElseThrow(() -> new IllegalArgumentException("Selected yard was not found"));
        }
        return yardIds;
    }

    private UserResponse toResponse(UserEntity u) {
        List<String> yardNames = u.getYardIds().stream()
                .map(id -> yardRepository.findById(id).map(y -> y.getName()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .toList();
        return UserResponse.from(u, yardNames);
    }

    private UserEntity findForTenant(UUID id) {
        UUID tenantId = currentTenantId();
        return userRepository.findById(id)
                .filter(u -> !u.isDeleted() && u.getTenantId().equals(tenantId))
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

    private UUID currentTenantId() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new EntityNotFoundException("Current user not found"))
                .getTenantId();
    }
}
