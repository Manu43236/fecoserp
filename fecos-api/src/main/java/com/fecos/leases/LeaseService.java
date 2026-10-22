package com.fecos.leases;

import com.fecos.clients.ClientRepository;
import com.fecos.common.BulkResult;
import com.fecos.users.UserRepository;
import com.opencsv.CSVReader;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
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
    public BulkResult bulkCreate(MultipartFile file) throws Exception {
        UUID tenantId = currentTenantId();
        UUID userId   = currentUserId();
        int created   = 0;
        List<BulkResult.RowError> errors = new ArrayList<>();

        // CSV columns: clientCompanyName,leaseName,county,state,gpsLat,gpsLng,directions
        try (var reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            reader.readNext(); // skip header
            String[] row;
            int rowNum = 2;
            while ((row = reader.readNext()) != null) {
                try {
                    if (row.length < 2 || row[0].isBlank() || row[1].isBlank()) { rowNum++; continue; }
                    String clientName = row[0].trim();
                    String leaseName  = row[1].trim();
                    String county     = row.length > 2 ? row[2].trim() : null;
                    String state      = row.length > 3 ? row[3].trim() : null;
                    String latStr     = row.length > 4 ? row[4].trim() : null;
                    String lngStr     = row.length > 5 ? row[5].trim() : null;
                    String directions = row.length > 6 ? row[6].trim() : null;

                    var client = clientRepository.findByCompanyNameAndTenantIdAndIsDeletedFalse(clientName, tenantId)
                            .orElseThrow(() -> new IllegalArgumentException("Client \"" + clientName + "\" not found"));

                    if (leaseRepository.existsByLeaseNameAndClientIdAndTenantIdAndIsDeletedFalse(leaseName, client.getId(), tenantId)) {
                        errors.add(new BulkResult.RowError(rowNum, "\"" + leaseName + "\" already exists for that client"));
                        rowNum++; continue;
                    }

                    LeaseEntity l = new LeaseEntity();
                    l.setTenantId(tenantId);
                    l.setCreatedBy(userId);
                    l.setClientId(client.getId());
                    l.setLeaseName(leaseName);
                    l.setCounty(notBlank(county));
                    l.setState(notBlank(state));
                    l.setGpsLat(parseDec(latStr));
                    l.setGpsLng(parseDec(lngStr));
                    l.setDirections(notBlank(directions));
                    l.setActive(true);
                    leaseRepository.save(l);
                    created++;
                } catch (Exception e) {
                    errors.add(new BulkResult.RowError(rowNum, e.getMessage()));
                }
                rowNum++;
            }
        }
        return new BulkResult(created, errors);
    }

    @Transactional
    public void delete(UUID id) {
        LeaseEntity l = findForTenant(id);
        l.setDeleted(true);
        leaseRepository.save(l);
    }

    private static String notBlank(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private static BigDecimal parseDec(String s) {
        try { return (s == null || s.isBlank()) ? null : new BigDecimal(s); }
        catch (NumberFormatException e) { return null; }
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
