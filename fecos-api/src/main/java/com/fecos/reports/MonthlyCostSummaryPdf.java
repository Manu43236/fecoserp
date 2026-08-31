package com.fecos.reports;

import com.fecos.clients.ClientEntity;
import com.fecos.clients.ClientRepository;
import com.fecos.leases.LeaseEntity;
import com.fecos.leases.LeaseRepository;
import com.fecos.pdf.FecosPdfBuilder;
import com.fecos.routes.RouteRepository;
import com.fecos.routes.RouteStopEntity;
import com.fecos.routes.RouteStopItemRepository;
import com.fecos.routes.RouteStopRepository;
import com.fecos.servicevisits.ServiceVisitRepository;
import com.fecos.servicevisits.ServiceVisitStopRepository;
import com.fecos.products.ProductRepository;
import com.fecos.users.UserRepository;
import com.fecos.wells.WellRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.Collections;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MonthlyCostSummaryPdf {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MM/dd/yyyy");

    private final ClientRepository clientRepo;
    private final LeaseRepository leaseRepo;
    private final WellRepository wellRepo;
    private final ServiceVisitRepository visitRepo;
    private final ServiceVisitStopRepository visitStopRepo;
    private final RouteRepository routeRepo;
    private final RouteStopRepository routeStopRepo;
    private final RouteStopItemRepository routeStopItemRepo;
    private final ProductRepository productRepo;
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

        // service visits for this client's wells this month
        var allVisits = visitRepo.search(tenantId, null, null, from, to, null, PageRequest.of(0, 5000)).getContent();
        List<com.fecos.servicevisits.ServiceVisitStopEntity> visitStops = allVisits.isEmpty()
                ? Collections.emptyList()
                : visitStopRepo.findAllByServiceVisitIdInAndIsDeletedFalse(
                        allVisits.stream().map(v -> v.getId()).collect(Collectors.toSet()));
        var visitStopsByVisit = visitStops.stream()
                .filter(s -> wellIds.contains(s.getWellId()))
                .collect(Collectors.groupingBy(s -> s.getServiceVisitId()));
        var relevantVisits = allVisits.stream()
                .filter(v -> visitStopsByVisit.containsKey(v.getId()))
                .collect(Collectors.toList());

        // deliveries for this client's wells this month
        var allRoutes = routeRepo.search(tenantId, null, null, null, PageRequest.of(0, 5000)).getContent().stream()
                .filter(r -> !r.getRouteDate().isBefore(from) && !r.getRouteDate().isAfter(to))
                .collect(Collectors.toList());
        var routeIds  = allRoutes.stream().map(r -> r.getId()).collect(Collectors.toSet());
        List<RouteStopEntity> allStops = routeIds.isEmpty()
                ? Collections.emptyList()
                : routeStopRepo.findAllByRouteIdInAndIsDeletedFalse(routeIds);
        var clientStops   = allStops.stream()
                .filter(s -> wellIds.contains(s.getWellId()))
                .collect(Collectors.toList());
        var clientStopIds = clientStops.stream().map(RouteStopEntity::getId).collect(Collectors.toSet());
        List<com.fecos.routes.RouteStopItemEntity> allItems = clientStopIds.isEmpty()
                ? Collections.emptyList()
                : routeStopItemRepo.findAllByStopIdInAndIsDeletedFalse(clientStopIds);

        var userMap    = buildUserMap(tenantId);
        var wellMap    = wells.stream().collect(Collectors.toMap(w -> w.getId(), w -> w.getWellName()));
        var productMap = buildProductMap(tenantId);
        var routeMap   = allRoutes.stream().collect(Collectors.toMap(r -> r.getId(), r -> r));
        var itemsByStop = allItems.stream().collect(Collectors.groupingBy(i -> i.getStopId()));

        // ── Build PDF ──────────────────────────────────────────────────────────
        var out = new ByteArrayOutputStream();
        try {
            var s = pdfBuilder.start(out);
            s.header("FECOS", null)
             .title("Monthly Cost Summary")
             .subtitle(client.getCompanyName() + " — " + monthLabel);

            // Client info
            s.sectionTitle("Client Information");
            s.infoTable(new String[][]{
                    {"Company",  client.getCompanyName()},
                    {"Contact",  client.getContactName()},
                    {"Phone",    client.getContactPhone()},
                    {"Email",    client.getContactEmail()},
                    {"Period",   monthLabel},
                    {"Leases",   String.valueOf(leases.size())},
                    {"Wells",    String.valueOf(wells.size())}
            });

            // Service visits summary
            s.sectionTitle("Service Visits (" + relevantVisits.size() + ")");
            if (relevantVisits.isEmpty()) {
                s.text("No service visits recorded for this period.");
            } else {
                List<String[]> visitRows = new ArrayList<>();
                for (var v : relevantVisits) {
                    var stopList = visitStopsByVisit.getOrDefault(v.getId(), List.of());
                    var wellNames = stopList.stream()
                            .map(st -> wellMap.getOrDefault(st.getWellId(), "?"))
                            .collect(Collectors.joining(", "));
                    visitRows.add(new String[]{
                            v.getVisitDate() != null ? v.getVisitDate().format(DATE_FMT) : "",
                            v.getName() != null ? v.getName() : "",
                            userMap.getOrDefault(v.getTechId(), "Unknown"),
                            v.getStatus() != null ? v.getStatus().name() : "",
                            wellNames
                    });
                }
                s.dataTable(new String[]{"Date", "Visit", "Technician", "Status", "Wells"}, visitRows);
            }

            // Deliveries summary
            s.sectionTitle("Chemical Deliveries");
            if (clientStops.isEmpty()) {
                s.text("No deliveries recorded for this period.");
            } else {
                // aggregate by product
                Map<String, BigDecimal> productTotals = new LinkedHashMap<>();
                List<String[]> deliveryRows = new ArrayList<>();
                for (var stop : clientStops) {
                    var route = routeMap.get(stop.getRouteId());
                    if (route == null) continue;
                    var items = itemsByStop.getOrDefault(stop.getId(), List.of());
                    for (var item : items) {
                        var pName = productMap.getOrDefault(item.getProductId(), "?");
                        var qty   = item.getActualQtyDelivered() != null ? item.getActualQtyDelivered() :
                                    item.getQuantity();
                        productTotals.merge(pName + " (" + item.getUnit() + ")", qty, BigDecimal::add);
                        deliveryRows.add(new String[]{
                                route.getRouteDate().format(DATE_FMT),
                                wellMap.getOrDefault(stop.getWellId(), "?"),
                                pName,
                                qty != null ? qty.toPlainString() : "",
                                item.getUnit() != null ? item.getUnit() : ""
                        });
                    }
                }
                s.dataTable(new String[]{"Date", "Well", "Product", "Qty Delivered", "Unit"}, deliveryRows);

                // product totals
                s.sectionTitle("Product Totals");
                List<String[]> totalRows = productTotals.entrySet().stream()
                        .map(e -> new String[]{e.getKey(), e.getValue().toPlainString()})
                        .collect(Collectors.toList());
                s.dataTable(new String[]{"Product", "Total Delivered"}, totalRows);
            }

            // Footer note
            s.spacer().text("Generated by FECOS — Field Engineering Chemical Operations Solution");
            s.build();
        } catch (Exception e) {
            throw new RuntimeException("Monthly Cost Summary PDF failed", e);
        }
        return out.toByteArray();
    }

    private Map<UUID, String> buildUserMap(UUID tenantId) {
        return userRepo.findAllByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId).stream()
                .collect(Collectors.toMap(u -> u.getId(), u -> u.getFullName(), (a, b) -> a));
    }

    private Map<UUID, String> buildProductMap(UUID tenantId) {
        return productRepo.findAllByTenantIdAndIsDeletedFalse(tenantId).stream()
                .collect(Collectors.toMap(p -> p.getId(), p -> p.getName(), (a, b) -> a));
    }
}
