package com.fecos.users;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> findAll() {
        UUID tenantId = currentTenantId();
        return userRepository.findAllByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId)
                .stream().map(UserResponse::from).toList();
    }

    @Transactional
    public UserResponse create(CreateUserRequest req) {
        UUID tenantId = currentTenantId();
        if (userRepository.existsByMobileNumberAndTenantIdAndIsDeletedFalse(req.getMobileNumber(), tenantId))
            throw new IllegalArgumentException("Mobile number already registered in this tenant");

        UserEntity user = new UserEntity();
        user.setTenantId(tenantId);
        user.setFullName(req.getFullName());
        user.setMobileNumber(req.getMobileNumber());
        user.setEmail(req.getEmail());
        user.setRole(req.getRole());
        user.setPin(req.getPin());
        user.setPinHash(passwordEncoder.encode(req.getPin()));
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse update(UUID id, UpdateUserRequest req) {
        UserEntity user = findForTenant(id);
        user.setFullName(req.getFullName());
        user.setEmail(req.getEmail());
        user.setRole(req.getRole());
        return UserResponse.from(userRepository.save(user));
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
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse createForTenant(SACreateUserRequest req) {
        UUID tenantId = req.getTenantId();
        if (userRepository.existsByMobileNumberAndTenantIdAndIsDeletedFalse(req.getMobileNumber(), tenantId))
            throw new IllegalArgumentException("Mobile number already registered in this tenant");

        UserEntity user = new UserEntity();
        user.setTenantId(tenantId);
        user.setFullName(req.getFullName());
        user.setMobileNumber(req.getMobileNumber());
        user.setEmail(req.getEmail());
        user.setRole(req.getRole());
        user.setPin(req.getPin());
        user.setPinHash(passwordEncoder.encode(req.getPin()));
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateById(UUID id, UpdateUserRequest req) {
        UserEntity user = userRepository.findById(id)
                .filter(u -> !u.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        user.setFullName(req.getFullName());
        user.setEmail(req.getEmail());
        user.setRole(req.getRole());
        return UserResponse.from(userRepository.save(user));
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
