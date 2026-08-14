package com.fecos.masters;

import com.fecos.users.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductUnitService {

    private final ProductUnitRepository repository;
    private final UserRepository userRepository;

    public List<ProductUnitResponse> list() {
        return repository.findForTenant(currentTenantId()).stream().map(ProductUnitResponse::from).toList();
    }

    @Transactional
    public ProductUnitResponse create(PumpTypeRequest req) {
        UUID tenantId = currentTenantId();
        String name = req.getName().trim();

        if (!repository.findGlobalByName(name).isEmpty())
            throw new IllegalArgumentException("'" + name + "' is already in the standard list");

        if (!repository.findByNameAndTenant(name, tenantId).isEmpty())
            throw new IllegalArgumentException("'" + name + "' already exists in your custom list");

        List<ProductUnitEntity> customs = repository.findAllCustomByName(name);
        if (!customs.isEmpty()) {
            ProductUnitEntity toPromote = customs.get(0);
            toPromote.setTenantId(null);
            toPromote.setSystem(true);
            repository.save(toPromote);
            for (int i = 1; i < customs.size(); i++) {
                customs.get(i).setDeleted(true);
                repository.save(customs.get(i));
            }
            return ProductUnitResponse.from(toPromote);
        }

        ProductUnitEntity e = new ProductUnitEntity();
        e.setTenantId(tenantId);
        e.setName(name);
        e.setSortOrder(999);
        return ProductUnitResponse.from(repository.save(e));
    }

    @Transactional
    public ProductUnitResponse toggleActive(UUID id) {
        ProductUnitEntity e = repository.findByIdAndTenantIdAndIsDeletedFalse(id, currentTenantId())
                .orElseThrow(() -> new IllegalArgumentException("Standard units cannot be modified"));
        e.setActive(!e.isActive());
        return ProductUnitResponse.from(repository.save(e));
    }

    @Transactional
    public void delete(UUID id) {
        ProductUnitEntity e = repository.findByIdAndTenantIdAndIsDeletedFalse(id, currentTenantId())
                .orElseThrow(() -> new IllegalArgumentException("Standard units cannot be deleted"));
        e.setDeleted(true);
        repository.save(e);
    }

    private UUID currentTenantId() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new EntityNotFoundException("Current user not found"))
                .getTenantId();
    }
}
