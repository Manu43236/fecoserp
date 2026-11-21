package com.fecos.clients;

import com.fecos.common.BulkResult;
import com.fecos.users.UserRepository;
import com.fecos.yards.YardRepository;
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final YardRepository yardRepository;

    public Page<ClientResponse> list(String search, UUID accountRepId, Boolean isActive, int page, int size) {
        UUID tenantId = currentTenantId();
        return clientRepository
                .search(tenantId, search, accountRepId, isActive, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    public ClientResponse findById(UUID id) {
        return toResponse(findForTenant(id));
    }

    @Transactional
    public ClientResponse create(ClientRequest req) {
        UUID tenantId = currentTenantId();
        if (clientRepository.existsByCompanyNameAndTenantIdAndIsDeletedFalse(req.getCompanyName(), tenantId))
            throw new IllegalArgumentException("A client with this company name already exists");

        ClientEntity c = new ClientEntity();
        c.setTenantId(tenantId);
        c.setCreatedBy(currentUserId());
        applyRequest(c, req);
        return toResponse(clientRepository.save(c));
    }

    @Transactional
    public ClientResponse update(UUID id, ClientRequest req) {
        ClientEntity c = findForTenant(id);
        applyRequest(c, req);
        return toResponse(clientRepository.save(c));
    }

    @Transactional
    public BulkResult bulkCreate(MultipartFile file) throws Exception {
        UUID tenantId = currentTenantId();
        UUID userId   = currentUserId();
        int created   = 0;
        List<BulkResult.RowError> errors = new ArrayList<>();

        try (var reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            reader.readNext(); // skip header
            String[] row;
            int rowNum = 2;
            while ((row = reader.readNext()) != null) {
                try {
                    if (row.length == 0 || row[0].isBlank()) { rowNum++; continue; }
                    String companyName    = row[0].trim();
                    String contactName    = row.length > 1 ? row[1].trim() : null;
                    String contactPhone   = row.length > 2 ? row[2].trim() : null;
                    String contactEmail   = row.length > 3 ? row[3].trim() : null;
                    String billingAddress = row.length > 4 ? row[4].trim() : null;

                    if (clientRepository.existsByCompanyNameAndTenantIdAndIsDeletedFalse(companyName, tenantId)) {
                        errors.add(new BulkResult.RowError(rowNum, "\"" + companyName + "\" already exists"));
                        rowNum++; continue;
                    }
                    ClientEntity c = new ClientEntity();
                    c.setTenantId(tenantId);
                    c.setCreatedBy(userId);
                    c.setCompanyName(companyName);
                    c.setContactName(notBlank(contactName));
                    c.setContactPhone(notBlank(contactPhone));
                    c.setContactEmail(notBlank(contactEmail));
                    c.setBillingAddress(notBlank(billingAddress));
                    c.setActive(true);
                    clientRepository.save(c);
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
        ClientEntity c = findForTenant(id);
        c.setDeleted(true);
        clientRepository.save(c);
    }

    private static String notBlank(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private void applyRequest(ClientEntity c, ClientRequest req) {
        c.setCompanyName(req.getCompanyName());
        c.setContactName(req.getContactName());
        c.setContactPhone(req.getContactPhone());
        c.setContactEmail(req.getContactEmail());
        c.setBillingAddress(req.getBillingAddress());
        c.setAccountRepId(req.getAccountRepId());
        if (req.getYardId() != null) {
            yardRepository.findByIdAndTenantIdAndIsDeletedFalse(req.getYardId(), currentTenantId())
                    .orElseThrow(() -> new IllegalArgumentException("Selected yard was not found"));
        }
        c.setYardId(req.getYardId());
        c.setActive(req.isActive());
    }

    private ClientResponse toResponse(ClientEntity c) {
        String yardName = c.getYardId() == null ? null
                : yardRepository.findById(c.getYardId()).map(y -> y.getName()).orElse(null);
        return ClientResponse.from(c, resolveRepName(c.getAccountRepId()), yardName);
    }

    private ClientEntity findForTenant(UUID id) {
        UUID tenantId = currentTenantId();
        return clientRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Client not found"));
    }

    private String resolveRepName(UUID repId) {
        if (repId == null) return null;
        return userRepository.findById(repId).map(u -> u.getFullName()).orElse(null);
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
