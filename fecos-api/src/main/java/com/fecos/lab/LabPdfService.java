package com.fecos.lab;

import com.fecos.pdf.FecosPdfBuilder;
import com.fecos.pdf.PdfTenantResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URI;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class LabPdfService {

    private final FecosPdfBuilder pdf;
    private final PdfTenantResolver tenantResolver;

    private static final DateTimeFormatter LDT_FMT = DateTimeFormatter.ofPattern("MMM d, yyyy h:mm a");
    private static final DateTimeFormatter INS_FMT = DateTimeFormatter.ofPattern("MMM d, yyyy h:mm a")
            .withZone(ZoneId.systemDefault());

    public byte[] generate(LabSampleResponse s) {
        try (var out = new ByteArrayOutputStream()) {
            var doc = pdf.start(out);
            var tenant = tenantResolver.current();
            doc.header(tenant != null ? tenant.getCompanyName() : null, fetchLogo(tenant != null ? tenant.getLogoUrl() : null));

            doc.title("Lab Report")
               .subtitle(orDash(s.sampleNumber()) + "  ·  " + orDash(s.wellName())
                       + "  ·  " + (s.sampleType() != null ? s.sampleType().name() : "—"))
               .sectionTitle("Sample Info")
               .infoTable(new String[][]{
                       {"Sample Number",   s.sampleNumber()},
                       {"Well",            s.wellName()},
                       {"Lease",           s.leaseName()},
                       {"Client",          s.clientName()},
                       {"Type",            s.sampleType() != null ? s.sampleType().name() : null},
                       {"Priority",        s.priority() != null ? s.priority().name() : null},
                       {"Collected By",    s.collectedByName()},
                       {"Collected At",    s.collectedAt() != null ? s.collectedAt().format(LDT_FMT) : null},
                       {"Received At",     s.receivedAt() != null ? s.receivedAt().format(LDT_FMT) : null},
                       {"Tests Requested", s.testsRequested()},
                       {"Status",          s.status() != null ? s.status().name() : null},
               });

            var r = s.result();
            if (r != null) {
                doc.sectionTitle("Water Analysis")
                   .infoTable(new String[][]{
                           {"Calcium",             dbl(r.calcium(),            "mg/L")},
                           {"Magnesium",           dbl(r.magnesium(),          "mg/L")},
                           {"Sodium",              dbl(r.sodium(),             "mg/L")},
                           {"Chlorides",           dbl(r.chlorides(),          "mg/L")},
                           {"Sulfates",            dbl(r.sulfates(),           "mg/L")},
                           {"Bicarbonates",        dbl(r.bicarbonates(),       "mg/L")},
                           {"Iron",                dbl(r.iron(),               "mg/L")},
                           {"pH",                  dbl(r.ph(),                 "")},
                           {"TDS",                 dbl(r.tds(),                "mg/L")},
                           {"Specific Gravity",    dbl(r.specificGravity(),    "")},
                           {"Dissolved Oxygen",    dbl(r.dissolvedOxygen(),    "mg/L")},
                           {"Scaling Index",       dbl(r.scalingIndex(),       "")},
                           {"Corrosion Potential", dbl(r.corrosionPotential(), "")},
                   });

                if (r.srbCount() != null || r.apbCount() != null || r.treatmentEffectiveness() != null) {
                    doc.sectionTitle("Bacteriological")
                       .infoTable(new String[][]{
                               {"SRB Count",               dbl(r.srbCount(),                "cells/mL")},
                               {"APB Count",               dbl(r.apbCount(),                "cells/mL")},
                               {"Treatment Effectiveness", dbl(r.treatmentEffectiveness(),   "%")},
                       });
                }

                if (r.scaleType() != null || r.scaleSeverity() != null) {
                    doc.sectionTitle("Scale Analysis")
                       .infoTable(new String[][]{
                               {"Scale Type",   r.scaleType()},
                               {"Severity",     r.scaleSeverity() != null ? r.scaleSeverity().name() : null},
                               {"Remediation",  r.scaleRemediation()},
                       });
                }

                if (r.pourPoint() != null || r.paraffinInhibitorEffectiveness() != null) {
                    doc.sectionTitle("Paraffin")
                       .infoTable(new String[][]{
                               {"Pour Point",             dbl(r.pourPoint(),                     "°F")},
                               {"Inhibitor Effectiveness",dbl(r.paraffinInhibitorEffectiveness(), "%")},
                       });
                }

                if (r.corrosionRate() != null || r.corrosionInhibitorPerformance() != null) {
                    doc.sectionTitle("Corrosion")
                       .infoTable(new String[][]{
                               {"Corrosion Rate",        dbl(r.corrosionRate(),                "mpy")},
                               {"Inhibitor Performance", dbl(r.corrosionInhibitorPerformance(), "%")},
                       });
                }

                if (r.failureType() != null) {
                    doc.sectionTitle("Failure Analysis")
                       .infoTable(new String[][]{
                               {"Failure Type",    r.failureType()},
                               {"Root Cause",      r.failureRootCause()},
                               {"Recommendation",  r.failureRecommendation()},
                       });
                }

                if (r.oilContent() != null) {
                    doc.sectionTitle("Oil in Water")
                       .infoTable(new String[][]{{"Oil Content", dbl(r.oilContent(), "mg/L")}});
                }

                if (r.labTechNotes() != null && !r.labTechNotes().isBlank()) {
                    doc.sectionTitle("Lab Tech Notes").text(r.labTechNotes());
                }

                doc.sectionTitle("Approval")
                   .infoTable(new String[][]{
                           {"Status",                   r.approvalStatus() != null ? r.approvalStatus().name() : null},
                           {"Approved By",              r.approvedByName()},
                           {"Approved At",              r.approvedAt() != null ? INS_FMT.format(r.approvedAt()) : null},
                           {"Notes",                    r.approvalNotes()},
                           {"Requires Treatment Change",r.requiresTreatmentChange() ? "Yes" : null},
                           {"Critical Values",          r.hasCriticalValues() ? "YES — immediate action required" : null},
                   });
            }

            doc.build();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate lab report PDF", e);
        }
    }

    private String dbl(Double v, String unit) {
        if (v == null) return null;
        return unit.isBlank() ? String.valueOf(v) : v + " " + unit;
    }

    private String orDash(String s) { return s != null ? s : "—"; }

    private byte[] fetchLogo(String url) {
        if (url == null || url.isBlank()) return null;
        try (InputStream in = URI.create(url).toURL().openStream()) {
            return in.readAllBytes();
        } catch (Exception ignored) { return null; }
    }
}
