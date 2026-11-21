package com.fecos.coverage;

import com.fecos.clients.ClientEntity;
import com.fecos.clients.ClientRepository;
import com.fecos.leases.LeaseEntity;
import com.fecos.leases.LeaseRepository;
import com.fecos.users.UserRepository;
import com.fecos.wells.WellEntity;
import com.fecos.wells.WellRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CoverageService {

    private final ClientRepository clientRepository;
    private final LeaseRepository leaseRepository;
    private final WellRepository wellRepository;
    private final UserRepository userRepository;

    /** Current coverage of an AR, compactly: whole-client rows, whole-lease rows, individual-well rows. */
    public CoverageResponse getCoverage(UUID repId) {
        UUID tenantId = currentTenantId();
        requireTenantUser(repId, tenantId);

        List<ClientEntity> clients = clientRepository.findAllByTenantIdAndAccountRepIdAndIsDeletedFalse(tenantId, repId);
        List<LeaseEntity>  leases  = leaseRepository.findAllByTenantIdAndAccountRepIdAndIsDeletedFalse(tenantId, repId);
        List<WellEntity>   wells   = wellRepository.findAllByTenantIdAndAccountRepIdAndIsDeletedFalse(tenantId, repId);

        // Resolve parent names in bulk.
        Map<UUID, LeaseEntity> leaseById = byId(
                leaseRepository.findAllById(wells.stream().map(WellEntity::getLeaseId).toList()), LeaseEntity::getId);
        Map<UUID, ClientEntity> clientById = byId(
                clientRepository.findAllById(
                        concatDistinct(
                                leases.stream().map(LeaseEntity::getClientId).toList(),
                                leaseById.values().stream().map(LeaseEntity::getClientId).toList())),
                ClientEntity::getId);

        List<CoverageResponse.Node> clientNodes = clients.stream()
                .map(c -> new CoverageResponse.Node(c.getId(), c.getCompanyName(), null, null, null, null))
                .toList();

        List<CoverageResponse.Node> leaseNodes = leases.stream()
                .map(l -> new CoverageResponse.Node(
                        l.getId(), l.getLeaseName(),
                        l.getClientId(), nameOf(clientById.get(l.getClientId())),
                        null, null))
                .toList();

        List<CoverageResponse.Node> wellNodes = wells.stream()
                .map(w -> {
                    LeaseEntity l = leaseById.get(w.getLeaseId());
                    ClientEntity c = l != null ? clientById.get(l.getClientId()) : null;
                    return new CoverageResponse.Node(
                            w.getId(), w.getWellName(),
                            c != null ? c.getId() : null, nameOf(c),
                            w.getLeaseId(), l != null ? l.getLeaseName() : null);
                })
                .toList();

        return new CoverageResponse(clientNodes, leaseNodes, wellNodes);
    }

    /** Replace this AR's coverage with the given compact selection (clear-then-assign). */
    @Transactional
    public void setCoverage(UUID repId, CoverageRequest req) {
        UUID tenantId = currentTenantId();
        requireTenantUser(repId, tenantId);

        clientRepository.clearAccountRep(tenantId, repId);
        leaseRepository.clearAccountRep(tenantId, repId);
        wellRepository.clearAccountRep(tenantId, repId);

        if (req.getClientIds() != null && !req.getClientIds().isEmpty())
            clientRepository.assignAccountRep(tenantId, repId, req.getClientIds());
        if (req.getLeaseIds() != null && !req.getLeaseIds().isEmpty())
            leaseRepository.assignAccountRep(tenantId, repId, req.getLeaseIds());
        if (req.getWellIds() != null && !req.getWellIds().isEmpty())
            wellRepository.assignAccountRep(tenantId, repId, req.getWellIds());
    }

    /** A client's leases + wells for the scoped "Add coverage" selector. */
    public ClientTreeResponse getClientTree(UUID clientId) {
        UUID tenantId = currentTenantId();
        ClientEntity client = clientRepository.findByIdAndTenantIdAndIsDeletedFalse(clientId, tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Client not found"));

        List<LeaseEntity> leases = leaseRepository.findAllByTenantIdAndClientIdAndIsDeletedFalse(tenantId, clientId);
        Map<UUID, List<WellEntity>> wellsByLease = wellRepository
                .findAllByTenantIdAndLeaseIdInAndIsDeletedFalse(tenantId, leases.stream().map(LeaseEntity::getId).toList())
                .stream().collect(Collectors.groupingBy(WellEntity::getLeaseId));

        List<ClientTreeResponse.LeaseNode> leaseNodes = leases.stream()
                .map(l -> new ClientTreeResponse.LeaseNode(
                        l.getId(), l.getLeaseName(),
                        wellsByLease.getOrDefault(l.getId(), List.of()).stream()
                                .map(w -> new ClientTreeResponse.WellNode(w.getId(), w.getWellName()))
                                .toList()))
                .toList();

        return new ClientTreeResponse(client.getId(), client.getCompanyName(), leaseNodes);
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private void requireTenantUser(UUID repId, UUID tenantId) {
        userRepository.findById(repId)
                .filter(u -> !u.isDeleted() && tenantId.equals(u.getTenantId()))
                .orElseThrow(() -> new EntityNotFoundException("Account rep not found"));
    }

    private static <T> Map<UUID, T> byId(List<T> items, Function<T, UUID> idOf) {
        return items.stream().collect(Collectors.toMap(idOf, Function.identity(), (a, b) -> a));
    }

    private static String nameOf(ClientEntity c) {
        return c != null ? c.getCompanyName() : null;
    }

    private static List<UUID> concatDistinct(List<UUID> a, List<UUID> b) {
        return java.util.stream.Stream.concat(a.stream(), b.stream()).distinct().toList();
    }

    private UUID currentTenantId() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new EntityNotFoundException("Current user not found"))
                .getTenantId();
    }
}
