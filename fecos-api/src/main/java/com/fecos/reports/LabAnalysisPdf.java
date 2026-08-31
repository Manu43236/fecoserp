package com.fecos.reports;

import com.fecos.clients.ClientRepository;
import com.fecos.lab.LabResultRepository;
import com.fecos.lab.LabSampleRepository;
import com.fecos.leases.LeaseRepository;
import com.fecos.pdf.FecosPdfBuilder;
import com.fecos.users.UserRepository;
import com.fecos.wells.WellRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.Collections;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LabAnalysisPdf {

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("MM/dd/yyyy HH:mm");

    private final ClientRepository clientRepo;
    private final LeaseRepository leaseRepo;
    private final WellRepository wellRepo;
    private final LabSampleRepository labSampleRepo;
    private final LabResultRepository labResultRepo;
    private final UserRepository userRepo;
    private final FecosPdfBuilder pdfBuilder;

    public byte[] generate(UUID tenantId, UUID clientId, int month, int year) {
        var client = clientRepo.findByIdAndTenantIdAndIsDeletedFalse(clientId, tenantId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        var from = LocalDate.of(year, month, 1);
        var to   = from.withDayOfMonth(from.lengthOfMonth());
        var monthLabel = Month.of(month).getDisplayName(TextStyle.FULL, Locale.US) + " " + year;

        // wells for this client
        var leases  = leaseRepo.findAllByTenantIdAndClientIdAndIsDeletedFalse(tenantId, clientId);
        var leaseIds = leases.stream().map(l -> l.getId()).collect(Collectors.toSet());
        var wells    = leaseIds.isEmpty() ? Collections.<com.fecos.wells.WellEntity>emptyList() :
                wellRepo.findAllByTenantIdAndLeaseIdInAndIsDeletedFalse(tenantId, leaseIds);
        var wellIds  = wells.stream().map(w -> w.getId()).collect(Collectors.toSet());
        var wellMap  = wells.stream().collect(Collectors.toMap(w -> w.getId(), w -> w.getWellName()));

        // lab samples for these wells in the period
        var allSamples = labSampleRepo.search(tenantId, null, null, null,
                from.atStartOfDay(), to.plusDays(1).atStartOfDay(), PageRequest.of(0, 5000)).getContent().stream()
                .filter(s -> wellIds.contains(s.getWellId()))
                .sorted(Comparator.comparing(s -> s.getCollectedAt(), Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());

        var sampleIds = allSamples.stream().map(s -> s.getId()).collect(Collectors.toSet());
        Map<UUID, com.fecos.lab.LabResultEntity> resultBySampleId = sampleIds.isEmpty()
                ? Collections.emptyMap()
                : labResultRepo.findAllBySampleIdInAndIsDeletedFalse(sampleIds).stream()
                        .collect(Collectors.toMap(r -> r.getSampleId(), r -> r, (a, b) -> a));

        var userMap = userRepo.findAllByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId).stream()
                .collect(Collectors.toMap(u -> u.getId(), u -> u.getFullName(), (a, b) -> a));

        var out = new ByteArrayOutputStream();
        try {
            var s = pdfBuilder.start(out);
            s.header("FECOS", null)
             .title("Lab Analysis Report")
             .subtitle(client.getCompanyName() + " — " + monthLabel);

            s.sectionTitle("Client Information");
            s.infoTable(new String[][]{
                    {"Company",  client.getCompanyName()},
                    {"Contact",  client.getContactName()},
                    {"Period",   monthLabel},
                    {"Samples",  String.valueOf(allSamples.size())}
            });

            if (allSamples.isEmpty()) {
                s.text("No lab samples recorded for this client in the selected period.");
            } else {
                for (var sample : allSamples) {
                    s.sectionTitle("Sample: " + sample.getSampleNumber());
                    var result = resultBySampleId.get(sample.getId());
                    s.infoTable(new String[][]{
                            {"Well",         wellMap.getOrDefault(sample.getWellId(), "?")},
                            {"Sample Type",  sample.getSampleType() != null ? sample.getSampleType().name() : ""},
                            {"Collected At", sample.getCollectedAt() != null ? sample.getCollectedAt().format(DT_FMT) : ""},
                            {"Status",       sample.getStatus() != null ? sample.getStatus().name() : ""},
                            {"Priority",     sample.getPriority() != null ? sample.getPriority().name() : ""}
                    });

                    if (result != null) {
                        s.sectionTitle("Water Analysis");
                        s.dataTable(new String[]{"Parameter", "Value"},
                                buildWaterAnalysisRows(result));

                        if (result.getCorrosionRate() != null || result.getScaleType() != null) {
                            s.sectionTitle("Corrosion & Scale");
                            s.dataTable(new String[]{"Parameter", "Value"},
                                    buildCorrosionRows(result));
                        }

                        if (result.getSrbCount() != null || result.getApbCount() != null) {
                            s.sectionTitle("Bacteriological");
                            s.dataTable(new String[]{"Parameter", "Value"}, List.of(
                                    new String[]{"SRB Count", fmt(result.getSrbCount())},
                                    new String[]{"APB Count", fmt(result.getApbCount())},
                                    new String[]{"Treatment Effectiveness", pct(result.getTreatmentEffectiveness())}
                            ));
                        }

                        if (result.getLabTechNotes() != null && !result.getLabTechNotes().isBlank()) {
                            s.sectionTitle("Lab Notes");
                            s.text(result.getLabTechNotes());
                        }

                        if (result.isHasCriticalValues()) {
                            s.text("⚠ CRITICAL VALUES DETECTED — immediate attention required");
                        }
                    } else {
                        s.text("Results not yet entered.");
                    }
                    s.spacer();
                }
            }

            s.text("Generated by FECOS — Field Engineering Chemical Operations Solution");
            s.build();
        } catch (Exception e) {
            throw new RuntimeException("Lab Analysis PDF failed", e);
        }
        return out.toByteArray();
    }

    private List<String[]> buildWaterAnalysisRows(com.fecos.lab.LabResultEntity r) {
        return List.of(
                new String[]{"pH",               fmt(r.getPh())},
                new String[]{"TDS (mg/L)",        fmt(r.getTds())},
                new String[]{"Specific Gravity",  fmt(r.getSpecificGravity())},
                new String[]{"Calcium (mg/L)",    fmt(r.getCalcium())},
                new String[]{"Magnesium (mg/L)",  fmt(r.getMagnesium())},
                new String[]{"Sodium (mg/L)",     fmt(r.getSodium())},
                new String[]{"Chlorides (mg/L)",  fmt(r.getChlorides())},
                new String[]{"Sulfates (mg/L)",   fmt(r.getSulfates())},
                new String[]{"Bicarbonates (mg/L)", fmt(r.getBicarbonates())},
                new String[]{"Iron (mg/L)",        fmt(r.getIron())},
                new String[]{"Dissolved Oxygen",  fmt(r.getDissolvedOxygen())},
                new String[]{"Scaling Index",     fmt(r.getScalingIndex())},
                new String[]{"Corrosion Potential", fmt(r.getCorrosionPotential())}
        );
    }

    private List<String[]> buildCorrosionRows(com.fecos.lab.LabResultEntity r) {
        return List.of(
                new String[]{"Corrosion Rate (mpy)",         fmt(r.getCorrosionRate())},
                new String[]{"Inhibitor Performance (%)",    pct(r.getCorrosionInhibitorPerformance())},
                new String[]{"Scale Type",                   r.getScaleType() != null ? r.getScaleType() : ""},
                new String[]{"Scale Severity",               r.getScaleSeverity() != null ? r.getScaleSeverity().name() : ""},
                new String[]{"Pour Point (°F)",              fmt(r.getPourPoint())},
                new String[]{"Paraffin Inhibitor Effect (%)", pct(r.getParaffinInhibitorEffectiveness())}
        );
    }

    private String fmt(Double v)  { return v != null ? String.format("%.3f", v) : "—"; }
    private String pct(Double v)  { return v != null ? String.format("%.1f%%", v) : "—"; }
}
