package com.fecos.products;

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
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public Page<ProductResponse> list(String search, String category, Boolean isActive, int page, int size) {
        return productRepository
                .search(currentTenantId(), search, category, isActive, PageRequest.of(page, size))
                .map(ProductResponse::from);
    }

    public ProductResponse findById(UUID id) {
        return ProductResponse.from(findForTenant(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest req) {
        UUID tenantId = currentTenantId();
        if (productRepository.existsByNameAndTenantIdAndIsDeletedFalse(req.getName(), tenantId))
            throw new IllegalArgumentException("A product with this name already exists");

        ProductEntity p = new ProductEntity();
        p.setTenantId(tenantId);
        p.setCreatedBy(currentUserId());
        apply(p, req);
        return ProductResponse.from(productRepository.save(p));
    }

    @Transactional
    public ProductResponse update(UUID id, ProductRequest req) {
        ProductEntity p = findForTenant(id);
        apply(p, req);
        return ProductResponse.from(productRepository.save(p));
    }

    @Transactional
    public void delete(UUID id) {
        ProductEntity p = findForTenant(id);
        p.setDeleted(true);
        productRepository.save(p);
    }

    private void apply(ProductEntity p, ProductRequest req) {
        p.setName(req.getName());
        p.setProductCode(req.getProductCode());
        p.setCategory(req.getCategory());
        p.setUnit(req.getUnit());
        p.setDescription(req.getDescription());
        p.setPricePerUnit(req.getPricePerUnit());
        p.setActive(req.isActive());
    }

    private ProductEntity findForTenant(UUID id) {
        return productRepository.findByIdAndTenantIdAndIsDeletedFalse(id, currentTenantId())
                .orElseThrow(() -> new EntityNotFoundException("Product not found"));
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
