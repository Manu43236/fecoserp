package com.fecos.reports;

import com.fecos.clients.ClientRepository;
import com.fecos.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BusinessReportService {

    private final GeneratedReportRepository repo;
    private final ClientRepository clientRepo;
    private final UserRepository userRepo;
    private final MonthlyCostSummaryPdf monthlyCostPdf;
    private final LabAnalysisPdf labAnalysisPdf;
    private final ServiceVisitCopyPdf serviceVisitCopyPdf;

    // ── Create record ─────────────────────────────────────────────────────────

    public GeneratedReportResponse create(GenerateReportRequest req) {
        UUID tenantId = currentTenantId();
        UUID userId   = currentUserId();

        var entity = new GeneratedReportEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setReportType(req.reportType());
        entity.setClientId(req.clientId());
        entity.setPeriodMonth(req.periodMonth());
        entity.setPeriodYear(req.periodYear());
        entity.setStatus(ReportStatus.READY);
        entity.setGeneratedBy(userId);
        entity.setCreatedBy(userId);
        repo.save(entity);

        return toResponse(entity);
    }

    // ── List ─────────────────────────────────────────────────────────────────

    public Page<GeneratedReportResponse> list(int page, int size) {
        UUID tenantId = currentTenantId();
        return repo.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    // ── Download (generate on-demand) ─────────────────────────────────────────

    public byte[] download(UUID id) {
        UUID tenantId = currentTenantId();
        var entity = repo.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        return switch (entity.getReportType()) {
            case MONTHLY_COST ->
                    monthlyCostPdf.generate(tenantId, entity.getClientId(),
                            entity.getPeriodMonth(), entity.getPeriodYear());
            case LAB_ANALYSIS ->
                    labAnalysisPdf.generate(tenantId, entity.getClientId(),
                            entity.getPeriodMonth(), entity.getPeriodYear());
            case SERVICE_VISIT_COPY ->
                    serviceVisitCopyPdf.generate(tenantId, entity.getClientId(),
                            entity.getPeriodMonth(), entity.getPeriodYear());
            default -> generatePlaceholderPdf(entity);
        };
    }

    // ── Mark sent ─────────────────────────────────────────────────────────────

    public GeneratedReportResponse markSent(UUID id) {
        UUID tenantId = currentTenantId();
        var entity = repo.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        entity.setStatus(ReportStatus.SENT);
        entity.setSentAt(Instant.now());
        return toResponse(repo.save(entity));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private byte[] generatePlaceholderPdf(GeneratedReportEntity e) {
        // ponytail: SERVICE_VISIT_COPY, PIPELINE_TREATING, DOT_AUDIT use existing
        // per-visit PDF endpoint or will be built in a follow-up phase
        throw new RuntimeException(e.getReportType().name() + " PDF generation not yet implemented");
    }

    private GeneratedReportResponse toResponse(GeneratedReportEntity e) {
        String clientName = null;
        if (e.getClientId() != null) {
            clientName = clientRepo.findByIdAndTenantIdAndIsDeletedFalse(e.getClientId(), e.getTenantId())
                    .map(c -> c.getCompanyName()).orElse("Unknown");
        }
        String generatedByName = userRepo.findById(e.getGeneratedBy())
                .map(u -> u.getFullName()).orElse("Unknown");

        String period = null;
        if (e.getPeriodMonth() != null && e.getPeriodYear() != null) {
            period = Month.of(e.getPeriodMonth()).getDisplayName(TextStyle.FULL, Locale.US)
                    + " " + e.getPeriodYear();
        }

        String label = switch (e.getReportType()) {
            case MONTHLY_COST       -> "Monthly Cost Summary";
            case SERVICE_VISIT_COPY -> "Service Report Copy";
            case LAB_ANALYSIS       -> "Lab Analysis Report";
            case PIPELINE_TREATING  -> "Pipeline Treating Report";
            case DOT_AUDIT          -> "DOT Audit Report";
        };

        return new GeneratedReportResponse(
                e.getId(), e.getReportType(), label,
                e.getClientId(), clientName,
                e.getPeriodMonth(), e.getPeriodYear(), period,
                e.getStatus(), generatedByName,
                e.getSentAt(), e.getNotes(), e.getCreatedAt()
        );
    }

    private UUID currentTenantId() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepo.findById(UUID.fromString(userId)).get().getTenantId();
    }

    private UUID currentUserId() {
        return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());
    }
}
