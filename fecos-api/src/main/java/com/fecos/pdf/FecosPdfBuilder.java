package com.fecos.pdf;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URI;

/**
 * Shared PDF builder for all FECOS reports.
 * Every page gets the FECOS icon watermark centered at 6% opacity.
 */
@Component
public class FecosPdfBuilder {

    // ── Fonts ─────────────────────────────────────────────────────────────────

    public static final Font COMPANY = new Font(Font.HELVETICA, 13, Font.BOLD,   new Color(0x1E, 0x3A, 0x5F));
    public static final Font TITLE   = new Font(Font.HELVETICA, 18, Font.BOLD,   new Color(0x1E, 0x3A, 0x5F));
    public static final Font HEADING = new Font(Font.HELVETICA, 10, Font.BOLD,   new Color(0x6B, 0x72, 0x80));
    public static final Font LABEL   = new Font(Font.HELVETICA,  9, Font.NORMAL, new Color(0x6B, 0x72, 0x80));
    public static final Font VALUE   = new Font(Font.HELVETICA, 10, Font.BOLD,   new Color(0x11, 0x18, 0x27));
    public static final Font BODY    = new Font(Font.HELVETICA, 10, Font.NORMAL, new Color(0x37, 0x41, 0x51));
    public static final Font DANGER  = new Font(Font.HELVETICA, 10, Font.BOLD,   new Color(0xDC, 0x26, 0x26));
    public static final Font SUCCESS = new Font(Font.HELVETICA, 10, Font.BOLD,   new Color(0x15, 0x80, 0x3D));

    // ── Watermark page event ──────────────────────────────────────────────────

    private static final class WatermarkEvent extends PdfPageEventHelper {
        private Image watermark;

        WatermarkEvent() {
            try (InputStream in = FecosPdfBuilder.class.getResourceAsStream("/fecos_icon.png")) {
                if (in != null) {
                    watermark = Image.getInstance(in.readAllBytes());
                    watermark.scaleToFit(220, 220);
                }
            } catch (Exception ignored) {}
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            if (watermark == null) return;
            try {
                var cb = writer.getDirectContentUnder();
                var gs = new PdfGState();
                gs.setFillOpacity(0.06f);
                gs.setBlendMode(PdfGState.BM_NORMAL);
                cb.saveState();
                cb.setGState(gs);
                float x = (document.getPageSize().getWidth()  - watermark.getScaledWidth())  / 2f;
                float y = (document.getPageSize().getHeight() - watermark.getScaledHeight()) / 2f;
                watermark.setAbsolutePosition(x, y);
                cb.addImage(watermark);
                cb.restoreState();
            } catch (Exception ignored) {}
        }
    }

    // ── Builder entry point ───────────────────────────────────────────────────

    public Session start(ByteArrayOutputStream out) throws DocumentException {
        var doc    = new Document(PageSize.A4, 40, 40, 48, 48);
        var writer = PdfWriter.getInstance(doc, out);
        writer.setPageEvent(new WatermarkEvent());
        doc.open();
        return new Session(doc);
    }

    // ── Session (fluent API per document) ────────────────────────────────────

    public static final class Session {
        private final Document doc;

        Session(Document doc) { this.doc = doc; }

        /**
         * Header: shows tenant logo only when available; falls back to company name text.
         */
        public Session header(String companyName, byte[] logoBytes) throws DocumentException {
            if (logoBytes != null) {
                try {
                    var img = Image.getInstance(logoBytes);
                    img.scaleToFit(200, 56);
                    img.setSpacingAfter(6);
                    doc.add(img);
                } catch (Exception e) {
                    // logo decode failed — fall back to text
                    doc.add(new Paragraph(companyName != null && !companyName.isBlank() ? companyName : "FECOS", COMPANY));
                }
            } else {
                var name = companyName != null && !companyName.isBlank() ? companyName : "FECOS";
                var p = new Paragraph(name, COMPANY);
                p.setSpacingAfter(4);
                doc.add(p);
            }

            var line = new com.lowagie.text.pdf.draw.LineSeparator(
                    1f, 100f, new Color(0xE5, 0xE7, 0xEB), Element.ALIGN_CENTER, -2);
            doc.add(new Chunk(line));
            var gap = new Paragraph(" ");
            gap.setSpacingAfter(6);
            doc.add(gap);
            return this;
        }

        public Session title(String text) throws DocumentException {
            doc.add(new Paragraph(text, TITLE));
            return this;
        }

        public Session subtitle(String text) throws DocumentException {
            var p = new Paragraph(text, BODY);
            p.setSpacingAfter(14);
            doc.add(p);
            return this;
        }

        public Session sectionTitle(String text) throws DocumentException {
            var p = new Paragraph(text.toUpperCase(), HEADING);
            p.setSpacingBefore(12);
            p.setSpacingAfter(4);
            doc.add(p);
            return this;
        }

        /** Rows where value == null are silently skipped. */
        public Session infoTable(String[][] rows) throws DocumentException {
            var table = new PdfPTable(2);
            table.setWidthPercentage(100);
            try { table.setWidths(new float[]{30, 70}); } catch (DocumentException ignored) {}
            table.setSpacingAfter(6);
            boolean any = false;
            for (var row : rows) {
                if (row[1] == null) continue;
                var lc = new PdfPCell(new Phrase(row[0], LABEL));
                lc.setBorder(Rectangle.NO_BORDER); lc.setPadding(3);
                var vc = new PdfPCell(new Phrase(row[1], VALUE));
                vc.setBorder(Rectangle.NO_BORDER); vc.setPadding(3);
                table.addCell(lc); table.addCell(vc);
                any = true;
            }
            if (any) doc.add(table);
            return this;
        }

        public Session text(String content) throws DocumentException {
            var p = new Paragraph(content, BODY);
            p.setSpacingAfter(6);
            doc.add(p);
            return this;
        }

        public Session spacer() throws DocumentException {
            var p = new Paragraph(" ");
            p.setSpacingAfter(4);
            doc.add(p);
            return this;
        }

        /** Fetches an image from a URL and embeds it. Silently skipped if null or unreachable. */
        public Session image(String url, String caption) throws DocumentException {
            if (url == null || url.isBlank()) return this;
            try {
                byte[] bytes;
                try (InputStream in = URI.create(url).toURL().openStream()) {
                    bytes = in.readAllBytes();
                }
                var img = Image.getInstance(bytes);
                img.scaleToFit(230, 160);
                img.setSpacingBefore(4);
                img.setSpacingAfter(2);
                doc.add(img);
                if (caption != null && !caption.isBlank()) {
                    var p = new Paragraph(caption, LABEL);
                    p.setSpacingAfter(8);
                    doc.add(p);
                }
            } catch (Exception ignored) {}
            return this;
        }

        public Session dataTable(String[] headers, java.util.List<String[]> rows) throws DocumentException {
            var table = new PdfPTable(headers.length);
            table.setWidthPercentage(100);
            table.setSpacingBefore(6);
            table.setSpacingAfter(10);

            var headerBg = new Color(0x1E, 0x3A, 0x5F);
            var altBg    = new Color(0xF3, 0xF4, 0xF6);

            for (var h : headers) {
                var cell = new PdfPCell(new Phrase(h, new Font(Font.HELVETICA, 8, Font.BOLD, Color.WHITE)));
                cell.setBackgroundColor(headerBg);
                cell.setPadding(5);
                cell.setBorderColor(headerBg);
                table.addCell(cell);
            }

            for (int r = 0; r < rows.size(); r++) {
                var cols = rows.get(r);
                for (var col : cols) {
                    var cell = new PdfPCell(new Phrase(col != null ? col : "", BODY));
                    cell.setPadding(4);
                    cell.setBorderColor(new Color(0xE5, 0xE7, 0xEB));
                    if (r % 2 == 1) cell.setBackgroundColor(altBg);
                    table.addCell(cell);
                }
            }

            if (!rows.isEmpty()) doc.add(table);
            return this;
        }

        public byte[] build() {
            doc.close();
            return new byte[0]; // caller uses the ByteArrayOutputStream directly
        }
    }
}
