package com.fecos.lab;

import com.fecos.clients.ClientRepository;
import com.fecos.leases.LeaseRepository;
import com.fecos.programs.TreatmentPlanRepository;
import com.fecos.programs.TreatmentPlanStatus;
import com.fecos.users.UserRepository;
import com.fecos.wells.WellRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LabService {

    private final LabSampleRepository sampleRepository;
    private final LabResultRepository resultRepository;
    private final UserRepository userRepository;
    private final WellRepository wellRepository;
    private final LeaseRepository leaseRepository;
    private final ClientRepository clientRepository;
    private final TreatmentPlanRepository treatmentPlanRepository;

    public Page<LabSampleResponse> list(LabSampleStatus status, UUID wellId, SampleType sampleType,
                                        LocalDateTime dateFrom, LocalDateTime dateTo, int page, int size) {
        UUID tenantId = currentTenantId();
        return sampleRepository.search(tenantId, status, wellId, sampleType, dateFrom, dateTo,
                        PageRequest.of(page, size))
                .map(s -> toResponse(s, false));
    }

    public LabSampleResponse findById(UUID id) {
        return toResponse(findForTenant(id), true);
    }

    @Transactional
    public LabSampleResponse create(LabSampleRequest req) {
        UUID tenantId = currentTenantId();
        LabSampleEntity s = new LabSampleEntity();
        s.setTenantId(tenantId);
        s.setCreatedBy(currentUserId());
        s.setSampleNumber(generateSampleNumber(tenantId, req.getReceivedAt().toLocalDate()));
        apply(s, req);
        return toResponse(sampleRepository.save(s), false);
    }

    @Transactional
    public LabSampleResponse update(UUID id, LabSampleRequest req) {
        LabSampleEntity s = findForTenant(id);
        apply(s, req);
        return toResponse(sampleRepository.save(s), true);
    }

    @Transactional
    public LabSampleResponse enterResults(UUID sampleId, LabResultRequest req) {
        UUID tenantId = currentTenantId();
        LabSampleEntity sample = findForTenant(sampleId);

        LabResultEntity result = resultRepository.findBySampleIdAndIsDeletedFalse(sampleId)
                .orElseGet(() -> {
                    LabResultEntity r = new LabResultEntity();
                    r.setTenantId(tenantId);
                    r.setCreatedBy(currentUserId());
                    r.setSampleId(sampleId);
                    return r;
                });

        applyResult(result, req, tenantId);

        // Compute calculated fields from water analysis
        if (hasWaterAnalysis(req)) {
            result.setScalingIndex(computeLSI(req));
            result.setCorrosionPotential(computeCorrosionPotential(req));
        }

        result.setHasCriticalValues(checkCriticalThresholds(result));
        result.setCompletedAt(LocalDateTime.now());
        resultRepository.save(result);

        // Mark sample completed
        sample.setStatus(LabSampleStatus.COMPLETED);
        sampleRepository.save(sample);

        if (result.isHasCriticalValues()) {
            fireAlert(result.getId(), sampleId, tenantId);
        }

        return toResponse(sample, true);
    }

    @Transactional
    public LabSampleResponse approve(UUID sampleId, LabApproveRequest req) {
        UUID tenantId = currentTenantId();
        LabSampleEntity sample = findForTenant(sampleId);

        LabResultEntity result = resultRepository.findBySampleIdAndIsDeletedFalse(sampleId)
                .orElseThrow(() -> new IllegalStateException("Results must be entered before approval"));

        result.setApprovalStatus(ApprovalStatus.APPROVED);
        result.setApprovedById(currentUserId());
        result.setApprovedAt(Instant.now());
        result.setApprovalNotes(req.getApprovalNotes());
        result.setRequiresTreatmentChange(req.isRequiresTreatmentChange());
        resultRepository.save(result);

        if (req.isRequiresTreatmentChange() && sample.getWellId() != null) {
            treatmentPlanRepository
                    .findAllByTenantIdAndWellIdAndStatusAndIsDeletedFalse(
                            tenantId, sample.getWellId(), TreatmentPlanStatus.ACTIVE)
                    .forEach(plan -> {
                        plan.setStatus(TreatmentPlanStatus.SUPERSEDED);
                        plan.setSupersededAt(Instant.now());
                        treatmentPlanRepository.save(plan);
                    });
        }

        return toResponse(sample, true);
    }

    public Page<LabSampleResponse> getPendingApprovals(int page, int size) {
        UUID tenantId = currentTenantId();
        return resultRepository
                .findAllByTenantIdAndApprovalStatusAndIsDeletedFalseOrderByCreatedAtDesc(
                        tenantId, ApprovalStatus.PENDING_REVIEW, PageRequest.of(page, size))
                .map(r -> toResponse(findForTenant(r.getSampleId()), true));
    }

    public Page<LabSampleResponse> getAlerts(int page, int size) {
        UUID tenantId = currentTenantId();
        return resultRepository
                .findAllByTenantIdAndHasCriticalValuesTrueAndIsDeletedFalseOrderByCreatedAtDesc(
                        tenantId, PageRequest.of(page, size))
                .map(r -> toResponse(findForTenant(r.getSampleId()), true));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private void apply(LabSampleEntity s, LabSampleRequest req) {
        s.setSampleType(req.getSampleType());
        s.setWellId(req.getWellId());
        s.setCollectedById(req.getCollectedById());
        s.setCollectedAt(req.getCollectedAt());
        s.setReceivedAt(req.getReceivedAt());
        s.setPriority(req.getPriority() != null ? req.getPriority() : SamplePriority.ROUTINE);
        s.setTestsRequested(req.getTestsRequested());
        if (req.getStatus() != null) s.setStatus(req.getStatus());
    }

    private void applyResult(LabResultEntity r, LabResultRequest req, UUID tenantId) {
        r.setLabTechId(currentUserId());
        r.setCalcium(req.getCalcium());
        r.setMagnesium(req.getMagnesium());
        r.setSodium(req.getSodium());
        r.setChlorides(req.getChlorides());
        r.setSulfates(req.getSulfates());
        r.setBicarbonates(req.getBicarbonates());
        r.setIron(req.getIron());
        r.setPh(req.getPh());
        r.setTds(req.getTds());
        r.setSpecificGravity(req.getSpecificGravity());
        r.setDissolvedOxygen(req.getDissolvedOxygen());
        r.setSrbCount(req.getSrbCount());
        r.setApbCount(req.getApbCount());
        r.setTreatmentEffectiveness(req.getTreatmentEffectiveness());
        r.setScaleType(req.getScaleType());
        r.setScaleSeverity(req.getScaleSeverity());
        r.setScaleRemediation(req.getScaleRemediation());
        r.setPourPoint(req.getPourPoint());
        r.setParaffinInhibitorEffectiveness(req.getParaffinInhibitorEffectiveness());
        r.setCorrosionRate(req.getCorrosionRate());
        r.setCorrosionInhibitorPerformance(req.getCorrosionInhibitorPerformance());
        r.setFailureType(req.getFailureType());
        r.setFailureRootCause(req.getFailureRootCause());
        r.setFailureRecommendation(req.getFailureRecommendation());
        r.setOilContent(req.getOilContent());
        r.setLabTechNotes(req.getLabTechNotes());
    }

    private LabSampleResponse toResponse(LabSampleEntity s, boolean includeResult) {
        String wellName = wellRepository.findById(s.getWellId())
                .map(w -> w.getWellName()).orElse(null);

        String leaseName = null;
        String clientName = null;
        if (wellName != null) {
            var well = wellRepository.findById(s.getWellId()).orElse(null);
            if (well != null) {
                leaseName = leaseRepository.findById(well.getLeaseId())
                        .map(l -> {
                            clientRepository.findById(l.getClientId())
                                    .ifPresent(c -> {});
                            return l.getLeaseName();
                        }).orElse(null);
                var lease = leaseRepository.findById(well.getLeaseId()).orElse(null);
                if (lease != null) {
                    clientName = clientRepository.findById(lease.getClientId())
                            .map(c -> c.getCompanyName()).orElse(null);
                }
            }
        }

        String collectedByName = s.getCollectedById() != null
                ? userRepository.findById(s.getCollectedById()).map(u -> u.getFullName()).orElse(null)
                : null;

        // Active treatment plan for this well
        UUID activePlanId = null;
        String activePlanStatus = null;
        var activePlans = treatmentPlanRepository.findAllByTenantIdAndWellIdAndStatusAndIsDeletedFalse(
                s.getTenantId(), s.getWellId(), TreatmentPlanStatus.ACTIVE);
        if (!activePlans.isEmpty()) {
            var plan = activePlans.get(0);
            activePlanId = plan.getId();
            activePlanStatus = plan.getStatus().name();
        }

        LabSampleResponse.LabResultResponse resultResponse = null;
        if (includeResult) {
            resultResponse = resultRepository.findBySampleIdAndIsDeletedFalse(s.getId())
                    .map(r -> {
                        String labTechName = r.getLabTechId() != null
                                ? userRepository.findById(r.getLabTechId()).map(u -> u.getFullName()).orElse(null)
                                : null;
                        String approvedByName = r.getApprovedById() != null
                                ? userRepository.findById(r.getApprovedById()).map(u -> u.getFullName()).orElse(null)
                                : null;
                        return LabSampleResponse.LabResultResponse.from(r, labTechName, approvedByName);
                    }).orElse(null);
        }

        return new LabSampleResponse(
                s.getId(), s.getSampleNumber(), s.getSampleType(),
                s.getWellId(), wellName, leaseName, clientName,
                s.getCollectedById(), collectedByName,
                s.getCollectedAt(), s.getReceivedAt(),
                s.getPriority(), s.getTestsRequested(), s.getStatus(), s.getCreatedAt(),
                activePlanId, activePlanStatus,
                resultResponse
        );
    }

    // ── Sample number: SMP-YYYY-MMDD-NNNNN ───────────────────────────────────────

    private String generateSampleNumber(UUID tenantId, LocalDate date) {
        long count = sampleRepository.countByTenantIdAndIsDeletedFalse(tenantId);
        String datePart = date.format(DateTimeFormatter.ofPattern("yyyy-MMdd"));
        return String.format("SMP-%s-%05d", datePart, count + 1);
    }

    // ── LSI (Langelier Saturation Index) ─────────────────────────────────────────

    private boolean hasWaterAnalysis(LabResultRequest req) {
        return req.getPh() != null && req.getTds() != null
                && req.getCalcium() != null && req.getBicarbonates() != null;
    }

    private double computeLSI(LabResultRequest req) {
        double tempC = 25.0; // assumed standard lab temp
        double tds = req.getTds();
        double calcium = req.getCalcium();
        double bicarbonates = req.getBicarbonates();
        double ph = req.getPh();

        double A = (Math.log10(tds) - 1.0) / 10.0;
        double B = -13.12 * Math.log10(tempC + 273.0) + 34.55;
        double calciumAsCaCO3 = calcium * 2.497;
        double alkalinityAsCaCO3 = bicarbonates * 0.8202;
        double C = calciumAsCaCO3 > 0 ? Math.log10(calciumAsCaCO3) - 0.4 : 0;
        double D = alkalinityAsCaCO3 > 0 ? Math.log10(alkalinityAsCaCO3) : 0;
        double pHs = (9.3 + A + B) - (C + D);
        double lsi = ph - pHs;

        return Math.round(lsi * 1000.0) / 1000.0;
    }

    // ── Corrosion Potential (0–10 score) ─────────────────────────────────────────

    private double computeCorrosionPotential(LabResultRequest req) {
        double score = 0.0;

        if (req.getPh() != null) {
            if (req.getPh() < 6.5) score += 3.0;
            else if (req.getPh() < 7.0) score += 1.5;
        }
        if (req.getIron() != null) {
            if (req.getIron() > 50) score += 2.5;
            else if (req.getIron() > 20) score += 1.0;
        }
        if (req.getDissolvedOxygen() != null) {
            if (req.getDissolvedOxygen() > 0.5) score += 2.5;
            else if (req.getDissolvedOxygen() > 0.1) score += 1.0;
        }
        if (req.getChlorides() != null) {
            if (req.getChlorides() > 100_000) score += 2.0;
            else if (req.getChlorides() > 50_000) score += 1.0;
        }

        return Math.min(Math.round(score * 10.0) / 10.0, 10.0);
    }

    // ── Critical Threshold Check ──────────────────────────────────────────────────

    private boolean checkCriticalThresholds(LabResultEntity r) {
        if (r.getSrbCount() != null && r.getSrbCount() > 1_000) return true;
        if (r.getApbCount() != null && r.getApbCount() > 10_000) return true;
        if (r.getCorrosionRate() != null && r.getCorrosionRate() > 5.0) return true;
        if (r.getScalingIndex() != null && r.getScalingIndex() > 2.0) return true;
        if (r.getIron() != null && r.getIron() > 50.0) return true;
        if (r.getPh() != null && (r.getPh() < 5.5 || r.getPh() > 9.0)) return true;
        if (r.getDissolvedOxygen() != null && r.getDissolvedOxygen() > 0.5) return true;
        return false;
    }

    // ── Alert (async — fires within 60s) ─────────────────────────────────────────

    @Async
    @Transactional
    public void fireAlert(UUID resultId, UUID sampleId, UUID tenantId) {
        resultRepository.findById(resultId).ifPresent(r -> {
            r.setAlertSentAt(Instant.now());
            resultRepository.save(r);
            // FCM push to ACCOUNT_REP users of this tenant is wired in Phase 3
            log.info("Lab alert fired: sampleId={}, tenantId={}", sampleId, tenantId);
        });
    }

    // ── Auth helpers ──────────────────────────────────────────────────────────────

    private LabSampleEntity findForTenant(UUID id) {
        return sampleRepository.findByIdAndTenantIdAndIsDeletedFalse(id, currentTenantId())
                .orElseThrow(() -> new EntityNotFoundException("Lab sample not found"));
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
