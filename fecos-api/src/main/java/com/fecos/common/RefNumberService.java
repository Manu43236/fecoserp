package com.fecos.common;

import com.fecos.tenant.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefNumberService {

    private final TenantRepository tenantRepository;

    /** Returns e.g. "TK-01-7". Falls back to "TK-??-7" if tenant not found (should never happen). */
    public String next(UUID tenantId, String moduleCode, int seq) {
        String num = tenantRepository.findById(tenantId)
                .map(t -> t.getTenantNumber() != null ? t.getTenantNumber() : "00")
                .orElse("00");
        return moduleCode + "-" + num + "-" + seq;
    }
}
