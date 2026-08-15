package com.fecos.leases;

import com.fecos.clients.ClientRepository;
import com.fecos.users.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LeaseService {

    private final LeaseRepository leaseRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    public Page<LeaseResponse> list(String search, UUID clientId, Boolean isActive, int page, int size) {
        UUID tenantId = currentTenantId();
        return leaseRepository
                .search(tenantId, search, clientId, isActive, PageRequest.of(page, size))
                .map(l -> toResponse(l));
    }

    public LeaseResponse findById(UUID id) {
        return toResponse(findForTenant(id));
    }

    @Transactional
    public LeaseResponse create(LeaseRequest req) {
        UUID tenantId = currentTenantId();
        if (leaseRepository.existsByLeaseNameAndClientIdAndTenantIdAndIsDeletedFalse(
                req.getLeaseName(), req.getClientId(), tenantId))
            throw new IllegalArgumentException("A lease with this name already exists for that client");

        LeaseEntity l = new LeaseEntity();
        l.setTenantId(tenantId);
        l.setCreatedBy(currentUserId());
        apply(l, req);
        return toResponse(leaseRepository.save(l));
    }

    @Transactional
    public LeaseResponse update(UUID id, LeaseRequest req) {
        LeaseEntity l = findForTenant(id);
        apply(l, req);
        return toResponse(leaseRepository.save(l));
    }

    @Transactional
    public void delete(UUID id) {
        LeaseEntity l = findForTenant(id);
        l.setDeleted(true);
        leaseRepository.save(l);
    }

    private void apply(LeaseEntity l, LeaseRequest req) {
        l.setClientId(req.getClientId());
        l.setLeaseName(req.getLeaseName());
        l.setCounty(req.getCounty());
        l.setState(req.getState());
        l.setGpsLat(req.getGpsLat());
        l.setGpsLng(req.getGpsLng());
        l.setDirections(req.getDirections());
        l.setActive(req.isActive());
    }

    private LeaseEntity findForTenant(UUID id) {
        return leaseRepository.findByIdAndTenantIdAndIsDeletedFalse(id, currentTenantId())
                .orElseThrow(() -> new EntityNotFoundException("Lease not found"));
    }

    private LeaseResponse toResponse(LeaseEntity l) {
        String clientName = null;
        UUID accountRepId = null;
        String accountRepName = null;
        if (l.getClientId() != null) {
            var clientOpt = clientRepository.findById(l.getClientId());
            if (clientOpt.isPresent()) {
                var client = clientOpt.get();
                clientName = client.getCompanyName();
                accountRepId = client.getAccountRepId();
                if (accountRepId != null) {
                    accountRepName = userRepository.findById(accountRepId)
                            .map(u -> u.getFullName()).orElse(null);
                }
            }
        }
        return LeaseResponse.from(l, clientName, accountRepId, accountRepName);
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
