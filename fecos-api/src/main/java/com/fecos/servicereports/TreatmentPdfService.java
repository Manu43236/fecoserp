package com.fecos.servicereports;

import com.fecos.pdf.FecosPdfBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class TreatmentPdfService {

    private final FecosPdfBuilder pdf;

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("MMM d, yyyy h:mm a").withZone(ZoneId.systemDefault());

    public byte[] generate(TreatmentReportResponse r) {
        try (var out = new ByteArrayOutputStream()) {
            var doc = pdf.start(out);

            doc.title("Treatment Report")
               .subtitle(r.wellName() + "  ·  " + orDash(r.leaseName()) + "  ·  " + orDash(r.clientName()))
               .sectionTitle("Visit Info")
               .infoTable(new String[][]{
                       {"Service Tech",  r.techName()},
                       {"Performed At",  fmt(r.performedAt())},
                       {"Submitted At",  fmt(r.submittedAt())},
                       {"GPS",           r.gpsLat() != null
                               ? r.gpsLat().toPlainString() + ", " + r.gpsLng().toPlainString()
                               : null},
               });

            if (r.soar()) {
                doc.sectionTitle("SOAR")
                   .infoTable(new String[][]{
                           {"SOAR Note",    r.soarNote()},
                           {"Acknowledged", r.soarAckAt() != null ? "Yes — " + orDash(r.soarAckByName()) : "Pending"},
                           {"Ack Note",     r.soarAckNote()},
                   });
            }

            if (r.lines() != null && !r.lines().isEmpty()) {
                doc.sectionTitle("Chemical Products");
                for (var line : r.lines()) {
                    boolean isCi = "CONTINUOUS".equals(line.method());
                    String name = line.productName() != null ? line.productName() : line.method();
                    doc.infoTable(new String[][]{
                            {"Product",    name + "  [" + (isCi ? "Continuous Injection" : "Batch") + "]"},
                            {"Tank",       line.tankSerial() != null
                                    ? line.tankSerial() + (line.tankLevelPct() != null
                                    ? "  —  " + line.tankLevelPct().toPlainString() + "% level" : "")
                                    : null},
                            {"Pump",       isCi ? (Boolean.TRUE.equals(line.pumpRunning()) ? "Running"
                                    : "Down" + (line.pumpDownReason() != null ? " — " + line.pumpDownReason() : "")) : null},
                            {"Rate Found", isCi && line.rateFound() != null ? line.rateFound().toPlainString() + " gal/day" : null},
                            {"Rate Set",   isCi && line.rateSetTo() != null ? line.rateSetTo().toPlainString() + " gal/day" : null},
                            {"Applied",    !isCi ? (Boolean.TRUE.equals(line.applied()) ? "Yes" : "No") : null},
                            {"Qty Applied",!isCi && line.quantityApplied() != null ? line.quantityApplied().toPlainString() + " gal" : null},
                            {"Notes",      line.notes()},
                    }).spacer();
                }
            }

            if (r.sampleType() != null) {
                doc.sectionTitle("Sample")
                   .infoTable(new String[][]{
                           {"Type",  r.sampleType()},
                           {"Notes", r.sampleNotes()},
                   });
            }

            if (r.signerName() != null) {
                doc.sectionTitle("Signature")
                   .infoTable(new String[][]{
                           {"Signed By", r.signerName()},
                           {"Signed At", fmt(r.signedAt())},
                   });
            }

            if (r.notes() != null && !r.notes().isBlank()) {
                doc.sectionTitle("Notes").text(r.notes());
            }

            doc.build();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate treatment report PDF", e);
        }
    }

    private String fmt(Instant ts) { return ts != null ? FMT.format(ts) : "—"; }
    private String orDash(String s) { return s != null ? s : "—"; }
}
