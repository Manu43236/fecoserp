package com.fecos.yards;

import com.fecos.common.RefNumberService;
import com.fecos.users.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class YardService {

    private final YardRepository yardRepository;
    private final UserRepository userRepository;
    private final RefNumberService refNumberService;

    public Page<YardResponse> list(String search, int page, int size) {
        return yardRepository
                .search(currentTenantId(), search, PageRequest.of(page, size))
                .map(YardResponse::from);
    }

    public List<YardResponse> listActive() {
        return yardRepository
                .findByTenantIdAndIsDeletedFalseAndIsActiveTrue(currentTenantId())
                .stream().map(YardResponse::from).toList();
    }

    public YardResponse findById(UUID id) {
        return YardResponse.from(findForTenant(id));
    }

    @Transactional
    public YardResponse create(YardRequest req) {
        UUID tenantId = currentTenantId();
        if (yardRepository.existsByNameAndTenantIdAndIsDeletedFalse(req.getName(), tenantId))
            throw new IllegalArgumentException("A yard with this name already exists");

        YardEntity y = new YardEntity();
        y.setTenantId(tenantId);
        y.setCreatedBy(currentUserId());
        int seq = yardRepository.maxRefSeq(tenantId) + 1;
        y.setRefSeq(seq);
        y.setRefNumber(refNumberService.next(tenantId, "Y", seq));
        apply(y, req);
        return YardResponse.from(yardRepository.save(y));
    }

    @Transactional
    public YardResponse update(UUID id, YardRequest req) {
        YardEntity y = findForTenant(id);
        apply(y, req);
        return YardResponse.from(yardRepository.save(y));
    }

    @Transactional
    public void delete(UUID id) {
        YardEntity y = findForTenant(id);
        y.setDeleted(true);
        yardRepository.save(y);
    }

    private void apply(YardEntity y, YardRequest req) {
        y.setName(req.getName());
        y.setLocation(req.getLocation());
        y.setActive(req.isActive());
    }

    private YardEntity findForTenant(UUID id) {
        return yardRepository.findByIdAndTenantIdAndIsDeletedFalse(id, currentTenantId())
                .orElseThrow(() -> new EntityNotFoundException("Yard not found"));
    }

    private UUID currentTenantId() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new EntityNotFoundException("Current user not found"))
                .getTenantId();
    }

    private UUID currentUserId() {
        return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());
    }
}
