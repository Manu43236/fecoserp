package com.fecos.reports;

import com.fecos.clients.ClientRepository;
import com.fecos.leases.LeaseEntity;
import com.fecos.leases.LeaseRepository;
import com.fecos.pdf.FecosPdfBuilder;
import com.fecos.servicevisits.ServiceVisitRepository;
import com.fecos.servicevisits.ServiceVisitStopRepository;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceVisitCopyPdf {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MM/dd/yyyy");

    private final ClientRepository clientRepo;
    private final LeaseRepository leaseRepo;
    private final WellRepository wellRepo;
    private final ServiceVisitRepository visitRepo;
    private final ServiceVisitStopRepository visitStopRepo;
    private final UserRepository userRepo;
    private final FecosPdfBuilder pdfBuilder;

    public byte[] generate(UUID tenantId, UUID clientId, int month, int year) {
        var client = clientRepo.findByIdAndTenantIdAndIsDeletedFalse(clientId, tenantId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        var from = LocalDate.of(year, month, 1);
        var to   = from.withDayOfMonth(from.lengthOfMonth());
        var monthLabel = Month.of(month).getDisplayName(TextStyle.FULL, Locale.US) + " " + year;

        // wells for this client
        var leases   = leaseRepo.findAllByTenantIdAndClientIdAndIsDeletedFalse(tenantId, clientId);
        var leaseIds = leases.stream().map(LeaseEntity::getId).collect(Collectors.toSet());
        List<com.fecos.wells.WellEntity> wells = leaseIds.isEmpty()
                ? Collections.emptyList()
                : wellRepo.findAllByTenantIdAndLeaseIdInAndIsDeletedFalse(tenantId, leaseIds);
        var wellIds = wells.stream().map(w -> w.getId()).collect(Collectors.toSet());
        var wellMap = wells.stream().collect(Collectors.toMap(w -> w.getId(), w -> w.getWellName()));

        // service visits in range
        var allVisits = visitRepo.search(tenantId, null, null, from, to, null, PageRequest.of(0, 5000)).getContent();
        List<com.fecos.servicevisits.ServiceVisitStopEntity> allStops = allVisits.isEmpty()
                ? Collections.emptyList()
                : visitStopRepo.findAllByServiceVisitIdInAndIsDeletedFalse(
                        allVisits.stream().map(v -> v.getId()).collect(Collectors.toSet()));

        // only stops at this client's wells
        var stopsByVisit = allStops.stream()
                .filter(s -> wellIds.contains(s.getWellId()))
                .collect(Collectors.groupingBy(s -> s.getServiceVisitId()));

        var relevantVisits = allVisits.stream()
                .filter(v -> stopsByVisit.containsKey(v.getId()))
                .sorted(Comparator.comparing(v -> v.getVisitDate()))
                .collect(Collectors.toList());

        var userMap = userRepo.findAllByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId).stream()
                .collect(Collectors.toMap(u -> u.getId(), u -> u.getFullName(), (a, b) -> a));

        // ── Build PDF ─────────────────────────────────────────────────────────
        var out = new ByteArrayOutputStream();
        try {
            var s = pdfBuilder.start(out);
            s.header("FECOS", null)
             .title("Service Report Copy")
             .subtitle(client.getCompanyName() + " — " + monthLabel);

            s.sectionTitle("Client Information");
            s.infoTable(new String[][]{
                    {"Company",        client.getCompanyName()},
                    {"Contact",        client.getContactName()},
                    {"Phone",          client.getContactPhone()},
                    {"Email",          client.getContactEmail()},
                    {"Period",         monthLabel},
                    {"Leases",         String.valueOf(leases.size())},
                    {"Wells",          String.valueOf(wells.size())},
                    {"Total Visits",   String.valueOf(relevantVisits.size())}
            });

            if (relevantVisits.isEmpty()) {
                s.sectionTitle("Service Visits");
                s.text("No service visits recorded for this client in " + monthLabel + ".");
            } else {
                for (var visit : relevantVisits) {
                    var techName = userMap.getOrDefault(visit.getTechId(), "Unknown");
                    var dateStr  = visit.getVisitDate() != null ? visit.getVisitDate().format(DATE_FMT) : "";
                    var label    = visit.getName() != null ? visit.getName() : "Service Visit";

                    s.sectionTitle(dateStr + "  —  " + label);
                    s.infoTable(new String[][]{
                            {"Date",        dateStr},
                            {"Visit",       label},
                            {"Technician",  techName},
                            {"Status",      visit.getStatus() != null ? visit.getStatus().name() : ""}
                    });

                    // well stops for this visit
                    var stops = stopsByVisit.getOrDefault(visit.getId(), List.of()).stream()
                            .sorted(Comparator.comparingInt(st -> st.getSequence()))
                            .collect(Collectors.toList());

                    List<String[]> stopRows = new ArrayList<>();
                    for (var st : stops) {
                        stopRows.add(new String[]{
                                String.valueOf(st.getSequence()),
                                wellMap.getOrDefault(st.getWellId(), "Unknown"),
                                st.getStatus() != null ? st.getStatus().name() : "",
                                st.getNotes() != null ? st.getNotes() : ""
                        });
                    }
                    s.dataTable(new String[]{"#", "Well", "Status", "Notes"}, stopRows);

                    if (visit.getNotes() != null && !visit.getNotes().isBlank()) {
                        s.text("Visit Notes: " + visit.getNotes());
                    }
                }
            }

            s.spacer().text("Generated by FECOS — Field Engineering Chemical Operations Solution");
            s.build();
        } catch (Exception e) {
            throw new RuntimeException("Service Visit Copy PDF failed", e);
        }
        return out.toByteArray();
    }
}
