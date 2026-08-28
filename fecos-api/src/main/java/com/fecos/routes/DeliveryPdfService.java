package com.fecos.routes;

import com.fecos.pdf.FecosPdfBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class DeliveryPdfService {

    private final FecosPdfBuilder pdf;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("MMM d, yyyy h:mm a");

    public byte[] generate(RouteResponse r) {
        try (var out = new ByteArrayOutputStream()) {
            var doc = pdf.start(out);

            doc.title("Delivery Report")
               .subtitle("Route: " + r.routeDate() + "  ·  Driver: " + orDash(r.driverName()) + "  ·  Truck: " + orDash(r.truckNumber()))
               .sectionTitle("Route Info")
               .infoTable(new String[][]{
                       {"Warehouse",      r.warehouseName()},
                       {"Status",         r.status() != null ? r.status().name() : null},
                       {"Stops",          r.completedStopCount() + " of " + r.stopCount() + " completed"},
                       {"Load Confirmed", r.loadConfirmedAt() != null ? r.loadConfirmedAt().format(FMT) : null},
                       {"Notes",          r.notes()},
               });

            if (r.stops() != null) {
                for (var stop : r.stops()) {
                    doc.sectionTitle("Stop " + stop.sequenceOrder() + "  —  " + orDash(stop.wellName()))
                       .infoTable(new String[][]{
                               {"Lease",        stop.leaseName()},
                               {"Status",       stop.status() != null ? stop.status().name() : null},
                               {"Delivered At", stop.deliveredAt() != null ? stop.deliveredAt().format(FMT) : null},
                               {"GPS",          stop.deliveryLat() != null
                                       ? stop.deliveryLat() + ", " + stop.deliveryLng() : null},
                               {"Skip Reason",  stop.skipReason()},
                               {"Notes",        stop.notes()},
                       })
                       .image(stop.deliveryPhotoUrl(), "Delivery Photo");

                    if (stop.items() != null && !stop.items().isEmpty()) {
                        for (var item : stop.items()) {
                            String qty = "Planned: " + orQty(item.quantity(), item.unit())
                                    + "  ·  Loaded: " + orQty(item.loadedQty(), item.unit())
                                    + "  ·  Delivered: " + orQty(item.actualQtyDelivered(), item.unit());
                            doc.infoTable(new String[][]{{orDash(item.productName()), qty}});
                        }
                    }
                    doc.spacer();
                }
            }

            doc.build();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate delivery report PDF", e);
        }
    }

    private String orDash(String s) { return s != null ? s : "—"; }

    private String orQty(BigDecimal v, String unit) {
        if (v == null) return "—";
        return v.toPlainString() + (unit != null ? " " + unit : "");
    }
}
