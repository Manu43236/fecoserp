package com.fecos.reports;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.List;

@Service
public class ExcelExportService {

    public byte[] build(String sheetName, String[] headers, List<String[]> rows) {
        try (var wb = new XSSFWorkbook(); var out = new ByteArrayOutputStream()) {
            var sheet = wb.createSheet(sheetName);

            // Header style
            var headerStyle = wb.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            var headerFont = wb.createFont();
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 10);
            headerStyle.setFont(headerFont);

            // Alt row style
            var altStyle = wb.createCellStyle();
            altStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            altStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Header row
            var hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                var cell = hRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            // Data rows
            for (int r = 0; r < rows.size(); r++) {
                var row = sheet.createRow(r + 1);
                var cols = rows.get(r);
                for (int c = 0; c < cols.length; c++) {
                    var cell = row.createCell(c);
                    cell.setCellValue(cols[c] != null ? cols[c] : "");
                    if (r % 2 == 1) cell.setCellStyle(altStyle);
                }
            }

            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Excel export failed", e);
        }
    }
}
