import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

/// Shared PDF utility for all FECOS reports.
/// Every page gets the FECOS icon watermark centered at 6% opacity.
///
/// Usage:
///   final bytes = await FecosPdf.build(pages: [
///     FecosPdf.page(content: [...]),
///   ]);
///   await Printing.sharePdf(bytes: bytes, filename: 'report.pdf');
class FecosPdf {
  FecosPdf._();

  // ── Shared styles ──────────────────────────────────────────────────────────

  static const PdfColor _navy   = PdfColor.fromInt(0xFF1E3A5F);
  static const PdfColor _hint   = PdfColor.fromInt(0xFF6B7280);
  static const PdfColor _body   = PdfColor.fromInt(0xFF374151);
  static const PdfColor _strong = PdfColor.fromInt(0xFF111827);
  static const PdfColor _danger = PdfColor.fromInt(0xFFDC2626);
  static const PdfColor _green  = PdfColor.fromInt(0xFF15803D);

  static pw.TextStyle get titleStyle  => pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold,  color: _navy);
  static pw.TextStyle get headingStyle=> pw.TextStyle(fontSize:  9, fontWeight: pw.FontWeight.bold,  color: _hint);
  static pw.TextStyle get labelStyle  => pw.TextStyle(fontSize:  9, color: _hint);
  static pw.TextStyle get valueStyle  => pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold,  color: _strong);
  static pw.TextStyle get bodyStyle   => pw.TextStyle(fontSize: 10, color: _body);
  static pw.TextStyle get dangerStyle => pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold,  color: _danger);
  static pw.TextStyle get successStyle=> pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold,  color: _green);

  // ── Build entry point ──────────────────────────────────────────────────────

  /// Builds a PDF document. [pageContent] is a list of widget lists — one per page.
  static Future<Uint8List> build({
    required List<List<pw.Widget>> pageContent,
    String? filename,
  }) async {
    final doc = pw.Document();
    final watermarkImage = await _loadWatermark();

    for (final content in pageContent) {
      doc.addPage(pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(40),
        build: (_) => pw.Stack(
          children: [
            // Watermark — centered, very faint
            if (watermarkImage != null)
              pw.Center(
                child: pw.Opacity(
                  opacity: 0.06,
                  child: pw.Image(watermarkImage, width: 180, height: 180),
                ),
              ),
            // Content
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: content,
            ),
          ],
        ),
      ));
    }

    return doc.save();
  }

  // ── Common widgets ─────────────────────────────────────────────────────────

  static pw.Widget title(String text) => pw.Padding(
        padding: const pw.EdgeInsets.only(bottom: 4),
        child: pw.Text(text, style: titleStyle),
      );

  static pw.Widget subtitle(String text) => pw.Padding(
        padding: const pw.EdgeInsets.only(bottom: 16),
        child: pw.Text(text, style: bodyStyle),
      );

  static pw.Widget sectionTitle(String text) => pw.Padding(
        padding: const pw.EdgeInsets.only(top: 14, bottom: 4),
        child: pw.Text(text.toUpperCase(), style: headingStyle),
      );

  static pw.Widget spacer([double height = 8]) =>
      pw.SizedBox(height: height);

  /// Renders a two-column info table. Rows with null value are skipped.
  static pw.Widget infoTable(List<(String, String?)> rows) {
    final visible = rows.where((r) => r.$2 != null).toList();
    if (visible.isEmpty) return pw.SizedBox.shrink();
    return pw.Table(
      columnWidths: const {
        0: pw.FlexColumnWidth(3),
        1: pw.FlexColumnWidth(7),
      },
      children: visible.map((r) => pw.TableRow(children: [
        pw.Padding(
          padding: const pw.EdgeInsets.symmetric(vertical: 2),
          child: pw.Text(r.$1, style: labelStyle),
        ),
        pw.Padding(
          padding: const pw.EdgeInsets.symmetric(vertical: 2),
          child: pw.Text(r.$2!, style: valueStyle),
        ),
      ])).toList(),
    );
  }

  static pw.Widget bodyText(String text) => pw.Padding(
        padding: const pw.EdgeInsets.only(bottom: 6),
        child: pw.Text(text, style: bodyStyle),
      );

  static pw.Widget divider() => pw.Padding(
        padding: const pw.EdgeInsets.symmetric(vertical: 8),
        child: pw.Divider(color: PdfColor.fromInt(0xFFE5E7EB)),
      );

  // ── Internal ───────────────────────────────────────────────────────────────

  static Future<pw.ImageProvider?> _loadWatermark() async {
    try {
      final data = await rootBundle.load('assets/icons/fecos_icon.png');
      return pw.MemoryImage(data.buffer.asUint8List());
    } catch (_) {
      return null; // watermark skipped if asset missing
    }
  }
}
