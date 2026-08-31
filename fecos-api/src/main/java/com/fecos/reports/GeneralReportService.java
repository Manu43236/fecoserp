package com.fecos.reports;

import com.fecos.lab.LabResultRepository;
import com.fecos.lab.LabSampleEntity;
import com.fecos.lab.LabSampleRepository;
import com.fecos.pdf.FecosPdfBuilder;
import com.fecos.products.ProductRepository;
import com.fecos.routes.RouteRepository;
import com.fecos.routes.RouteStopEntity;
import com.fecos.routes.RouteStopItemRepository;
import com.fecos.routes.RouteStopRepository;
import com.fecos.servicevisits.ServiceVisitRepository;
import com.fecos.servicevisits.ServiceVisitStopRepository;
import com.fecos.users.UserRepository;
import com.fecos.wells.WellRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GeneralReportService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MM/dd/yyyy");
    private static final PageRequest ALL = PageRequest.of(0, 5000);

    private final ServiceVisitRepository visitRepo;
    private final ServiceVisitStopRepository visitStopRepo;
    private final RouteRepository routeRepo;
    private final RouteStopRepository routeStopRepo;
    private final RouteStopItemRepository routeStopItemRepo;
    private final LabSampleRepository labSampleRepo;
    private final LabResultRepository labResultRepo;
    private final UserRepository userRepo;
    private final WellRepository wellRepo;
    private final ProductRepository productRepo;
    private final ExcelExportService excelService;
    private final FecosPdfBuilder pdfBuilder;

    // ── Service Visits ────────────────────────────────────────────────────────

    public byte[] serviceVisitsExcel(UUID tenantId, LocalDate from, LocalDate to) {
        return excelService.build("Service Visits", serviceVisitHeaders(), serviceVisitRows(tenantId, from, to));
    }

    public byte[] serviceVisitsPdf(UUID tenantId, LocalDate from, LocalDate to) {
        return buildPdf("Service Visits Report", rangeLabel(from, to), serviceVisitHeaders(), serviceVisitRows(tenantId, from, to));
    }

    private String[] serviceVisitHeaders() {
        return new String[]{"Date", "Visit Name", "Technician", "Status", "Wells"};
    }

    private List<String[]> serviceVisitRows(UUID tenantId, LocalDate from, LocalDate to) {
        var visits = visitRepo.search(tenantId, null, null, from, to, null, ALL).getContent();
        var userMap  = buildUserMap(tenantId);
        var wellMap  = buildWellMap(tenantId);

        var visitIds = visits.stream().map(v -> v.getId()).collect(Collectors.toSet());
        var stopsByVisit = visitStopRepo.findAllByServiceVisitIdInAndIsDeletedFalse(visitIds).stream()
                .collect(Collectors.groupingBy(s -> s.getServiceVisitId()));

        return visits.stream().map(v -> {
            var wells = stopsByVisit.getOrDefault(v.getId(), List.of()).stream()
                    .map(s -> wellMap.getOrDefault(s.getWellId(), "?"))
                    .collect(Collectors.joining(", "));
            return new String[]{
                    v.getVisitDate() != null ? v.getVisitDate().format(DATE_FMT) : "",
                    v.getName() != null ? v.getName() : "",
                    userMap.getOrDefault(v.getTechId(), "Unknown"),
                    v.getStatus() != null ? v.getStatus().name() : "",
                    wells
            };
        }).collect(Collectors.toList());
    }

    // ── Deliveries ────────────────────────────────────────────────────────────

    public byte[] deliveriesExcel(UUID tenantId, LocalDate from, LocalDate to) {
        return excelService.build("Deliveries", deliveryHeaders(), deliveryRows(tenantId, from, to));
    }

    public byte[] deliveriesPdf(UUID tenantId, LocalDate from, LocalDate to) {
        return buildPdf("Deliveries Report", rangeLabel(from, to), deliveryHeaders(), deliveryRows(tenantId, from, to));
    }

    private String[] deliveryHeaders() {
        return new String[]{"Date", "Driver", "Truck", "Well", "Product", "Qty Loaded", "Qty Delivered", "Unit", "Status"};
    }

    private List<String[]> deliveryRows(UUID tenantId, LocalDate from, LocalDate to) {
        LocalDate safeFrom = from != null ? from : LocalDate.of(2000, 1, 1);
        LocalDate safeTo   = to   != null ? to   : LocalDate.now();

        var routes = routeRepo.search(tenantId, null, null, null, ALL).getContent().stream()
                .filter(r -> !r.getRouteDate().isBefore(safeFrom) && !r.getRouteDate().isAfter(safeTo))
                .collect(Collectors.toList());

        if (routes.isEmpty()) return List.of();

        var routeIds = routes.stream().map(r -> r.getId()).collect(Collectors.toSet());
        var routeMap = routes.stream().collect(Collectors.toMap(r -> r.getId(), r -> r));
        var userMap  = buildUserMap(tenantId);
        var wellMap  = buildWellMap(tenantId);
        var productMap = buildProductMap(tenantId);

        var allStops  = routeStopRepo.findAllByRouteIdInAndIsDeletedFalse(routeIds);
        var stopIds   = allStops.stream().map(RouteStopEntity::getId).collect(Collectors.toSet());
        var itemsByStop = routeStopItemRepo.findAllByStopIdInAndIsDeletedFalse(stopIds).stream()
                .collect(Collectors.groupingBy(i -> i.getStopId()));

        List<String[]> rows = new ArrayList<>();
        for (var stop : allStops) {
            var route = routeMap.get(stop.getRouteId());
            if (route == null) continue;
            var items = itemsByStop.getOrDefault(stop.getId(), List.of());
            if (items.isEmpty()) {
                rows.add(new String[]{
                        route.getRouteDate().format(DATE_FMT),
                        userMap.getOrDefault(route.getDriverId(), "Unknown"),
                        route.getTruckNumber() != null ? route.getTruckNumber() : "",
                        wellMap.getOrDefault(stop.getWellId(), "?"),
                        "", "", "", "",
                        stop.getStatus() != null ? stop.getStatus().name() : ""
                });
            } else {
                for (var item : items) {
                    rows.add(new String[]{
                            route.getRouteDate().format(DATE_FMT),
                            userMap.getOrDefault(route.getDriverId(), "Unknown"),
                            route.getTruckNumber() != null ? route.getTruckNumber() : "",
                            wellMap.getOrDefault(stop.getWellId(), "?"),
                            productMap.getOrDefault(item.getProductId(), "?"),
                            item.getLoadedQty()          != null ? item.getLoadedQty().toPlainString() : "",
                            item.getActualQtyDelivered() != null ? item.getActualQtyDelivered().toPlainString() : "",
                            item.getUnit() != null ? item.getUnit() : "",
                            stop.getStatus() != null ? stop.getStatus().name() : ""
                    });
                }
            }
        }
        return rows;
    }

    // ── Lab Results ───────────────────────────────────────────────────────────

    public byte[] labResultsExcel(UUID tenantId, LocalDate from, LocalDate to) {
        return excelService.build("Lab Results", labHeaders(), labRows(tenantId, from, to));
    }

    public byte[] labResultsPdf(UUID tenantId, LocalDate from, LocalDate to) {
        return buildPdf("Lab Results Report", rangeLabel(from, to), labHeaders(), labRows(tenantId, from, to));
    }

    private String[] labHeaders() {
        return new String[]{"Sample #", "Type", "Well", "Collected At", "Status", "pH", "TDS", "Iron", "Corrosion Rate", "Critical"};
    }

    private List<String[]> labRows(UUID tenantId, LocalDate from, LocalDate to) {
        LocalDate safeFrom = from != null ? from : LocalDate.of(2000, 1, 1);
        LocalDate safeTo   = to   != null ? to   : LocalDate.now();

        var samples = labSampleRepo.search(tenantId, null, null, null,
                safeFrom.atStartOfDay(), safeTo.plusDays(1).atStartOfDay(), ALL).getContent().stream()
                .sorted(Comparator.comparing(LabSampleEntity::getCollectedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        var wellMap = buildWellMap(tenantId);
        var sampleIds = samples.stream().map(s -> s.getId()).collect(Collectors.toSet());
        var resultBySampleId = labResultRepo.findAllBySampleIdInAndIsDeletedFalse(sampleIds).stream()
                .collect(Collectors.toMap(r -> r.getSampleId(), r -> r, (a, b) -> a));

        return samples.stream().map(s -> {
            var result = resultBySampleId.get(s.getId());
            return new String[]{
                    s.getSampleNumber(),
                    s.getSampleType() != null ? s.getSampleType().name() : "",
                    wellMap.getOrDefault(s.getWellId(), "?"),
                    s.getCollectedAt() != null ? s.getCollectedAt().format(DateTimeFormatter.ofPattern("MM/dd/yyyy HH:mm")) : "",
                    s.getStatus() != null ? s.getStatus().name() : "",
                    result != null && result.getPh() != null ? String.format("%.2f", result.getPh()) : "",
                    result != null && result.getTds() != null ? String.format("%.1f", result.getTds()) : "",
                    result != null && result.getIron() != null ? String.format("%.3f", result.getIron()) : "",
                    result != null && result.getCorrosionRate() != null ? String.format("%.4f", result.getCorrosionRate()) : "",
                    result != null && result.isHasCriticalValues() ? "YES" : "No"
            };
        }).collect(Collectors.toList());
    }

    // ── Field Activity (combined) ─────────────────────────────────────────────

    public byte[] fieldActivityExcel(UUID tenantId, LocalDate from, LocalDate to) {
        return excelService.build("Field Activity", fieldActivityHeaders(), fieldActivityRows(tenantId, from, to));
    }

    public byte[] fieldActivityPdf(UUID tenantId, LocalDate from, LocalDate to) {
        return buildPdf("Field Activity Report", rangeLabel(from, to), fieldActivityHeaders(), fieldActivityRows(tenantId, from, to));
    }

    private String[] fieldActivityHeaders() {
        return new String[]{"Date", "Type", "Person", "Details", "Status"};
    }

    private List<String[]> fieldActivityRows(UUID tenantId, LocalDate from, LocalDate to) {
        LocalDate safeFrom = from != null ? from : LocalDate.of(2000, 1, 1);
        LocalDate safeTo   = to   != null ? to   : LocalDate.now();
        var userMap = buildUserMap(tenantId);

        List<String[]> rows = new ArrayList<>();

        visitRepo.search(tenantId, null, null, safeFrom, safeTo, null, ALL).getContent()
                .forEach(v -> rows.add(new String[]{
                        v.getVisitDate() != null ? v.getVisitDate().format(DATE_FMT) : "",
                        "Service Visit",
                        userMap.getOrDefault(v.getTechId(), "Unknown"),
                        v.getName() != null ? v.getName() : "",
                        v.getStatus() != null ? v.getStatus().name() : ""
                }));

        routeRepo.search(tenantId, null, null, null, ALL).getContent().stream()
                .filter(r -> !r.getRouteDate().isBefore(safeFrom) && !r.getRouteDate().isAfter(safeTo))
                .forEach(r -> rows.add(new String[]{
                        r.getRouteDate().format(DATE_FMT),
                        "Delivery",
                        userMap.getOrDefault(r.getDriverId(), "Unknown"),
                        r.getTruckNumber() != null ? "Truck: " + r.getTruckNumber() : "",
                        r.getStatus() != null ? r.getStatus().name() : ""
                }));

        rows.sort(Comparator.comparing(row -> row[0]));
        return rows;
    }

    // ── Shared helpers ────────────────────────────────────────────────────────

    private byte[] buildPdf(String title, String subtitle, String[] headers, List<String[]> rows) {
        var out = new ByteArrayOutputStream();
        try {
            pdfBuilder.start(out)
                    .header("FECOS", null)
                    .title(title)
                    .subtitle(subtitle + " — " + rows.size() + " records")
                    .dataTable(headers, rows)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("PDF generation failed", e);
        }
        return out.toByteArray();
    }

    private Map<UUID, String> buildUserMap(UUID tenantId) {
        return userRepo.findAllByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId).stream()
                .collect(Collectors.toMap(u -> u.getId(), u -> u.getFullName(), (a, b) -> a));
    }

    private Map<UUID, String> buildWellMap(UUID tenantId) {
        return wellRepo.findAllByTenantIdAndIsDeletedFalse(tenantId).stream()
                .collect(Collectors.toMap(w -> w.getId(), w -> w.getWellName(), (a, b) -> a));
    }

    private Map<UUID, String> buildProductMap(UUID tenantId) {
        return productRepo.findAllByTenantIdAndIsDeletedFalse(tenantId).stream()
                .collect(Collectors.toMap(p -> p.getId(), p -> p.getName(), (a, b) -> a));
    }

    private String rangeLabel(LocalDate from, LocalDate to) {
        if (from == null && to == null) return "All dates";
        if (from == null) return "Up to " + to.format(DATE_FMT);
        if (to   == null) return "From " + from.format(DATE_FMT);
        return from.format(DATE_FMT) + " — " + to.format(DATE_FMT);
    }

    UUID currentTenantId() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepo.findById(UUID.fromString(userId)).get().getTenantId();
    }
}
