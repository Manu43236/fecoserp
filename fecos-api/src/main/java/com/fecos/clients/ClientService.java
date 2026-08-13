package com.fecos.clients;

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
public class ClientService {

    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    public Page<ClientResponse> list(String search, UUID accountRepId, Boolean isActive, int page, int size) {
        UUID tenantId = currentTenantId();
        return clientRepository
                .search(tenantId, search, accountRepId, isActive, PageRequest.of(page, size))
                .map(c -> ClientResponse.from(c, resolveRepName(c.getAccountRepId())));
    }

    public ClientResponse findById(UUID id) {
        ClientEntity c = findForTenant(id);
        return ClientResponse.from(c, resolveRepName(c.getAccountRepId()));
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
        return ClientResponse.from(clientRepository.save(c), resolveRepName(c.getAccountRepId()));
    }

    @Transactional
    public ClientResponse update(UUID id, ClientRequest req) {
        ClientEntity c = findForTenant(id);
        applyRequest(c, req);
        return ClientResponse.from(clientRepository.save(c), resolveRepName(c.getAccountRepId()));
    }

    @Transactional
    public void delete(UUID id) {
        ClientEntity c = findForTenant(id);
        c.setDeleted(true);
        clientRepository.save(c);
    }

    private void applyRequest(ClientEntity c, ClientRequest req) {
        c.setCompanyName(req.getCompanyName());
        c.setContactName(req.getContactName());
        c.setContactPhone(req.getContactPhone());
        c.setContactEmail(req.getContactEmail());
        c.setBillingAddress(req.getBillingAddress());
        c.setAccountRepId(req.getAccountRepId());
        c.setActive(req.isActive());
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
