package com.fecos.wells;

import com.fecos.leases.LeaseRepository;
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
public class WellService {

    private final WellRepository wellRepository;
    private final LeaseRepository leaseRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    public Page<WellResponse> list(String search, UUID leaseId, Boolean isActive, int page, int size) {
        UUID tenantId = currentTenantId();
        return wellRepository
                .search(tenantId, search, leaseId, isActive, PageRequest.of(page, size))
                .map(w -> resolve(w));
    }

    public WellResponse findById(UUID id) {
        return resolve(findForTenant(id));
    }

    @Transactional
    public WellResponse create(WellRequest req) {
        UUID tenantId = currentTenantId();
        WellEntity w = new WellEntity();
        w.setTenantId(tenantId);
        w.setCreatedBy(currentUserId());
        apply(w, req);
        return resolve(wellRepository.save(w));
    }

    @Transactional
    public WellResponse update(UUID id, WellRequest req) {
        WellEntity w = findForTenant(id);
        apply(w, req);
        return resolve(wellRepository.save(w));
    }

    @Transactional
    public void delete(UUID id) {
        WellEntity w = findForTenant(id);
        w.setDeleted(true);
        wellRepository.save(w);
    }

    private void apply(WellEntity w, WellRequest req) {
        w.setLeaseId(req.getLeaseId());
        w.setWellName(req.getWellName());
        w.setWellNumber(req.getWellNumber());
        w.setApiNumber(req.getApiNumber());
        w.setPumpType(req.getPumpType() != null ? req.getPumpType() : "Rod Pump");
        w.setActive(req.isActive());
    }

    private WellResponse resolve(WellEntity w) {
        var lease = leaseRepository.findById(w.getLeaseId()).orElse(null);
        String leaseName  = lease != null ? lease.getLeaseName() : null;
        String clientName = lease != null
                ? clientRepository.findById(lease.getClientId()).map(c -> c.getCompanyName()).orElse(null)
                : null;
        return WellResponse.from(w, leaseName, clientName);
    }

    private WellEntity findForTenant(UUID id) {
        return wellRepository.findByIdAndTenantIdAndIsDeletedFalse(id, currentTenantId())
                .orElseThrow(() -> new EntityNotFoundException("Well not found"));
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
