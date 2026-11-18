import 'package:flutter_test/flutter_test.dart';
import 'package:fecos_mobile/app/modules/well_stop/controllers/well_stop_controller.dart';

void main() {
  group('buildCustodyCode', () {
    final date = DateTime(2026, 11, 18); // the 18th

    test('formats as LS-{WELL}-{ABBR}-{DD}/{nn} with zero padding', () {
      expect(
        buildCustodyCode('WELX1', 'PW', date, 1),
        'LS-WELX1-PW-18/01',
      );
    });

    test('counter widens past 9 and keeps the slash separator', () {
      expect(buildCustodyCode('WELX1', 'PW', date, 12), 'LS-WELX1-PW-18/12');
    });

    test('same well + day, different type stay distinct', () {
      expect(buildCustodyCode('WELX1', 'PW', date, 1), 'LS-WELX1-PW-18/01');
      expect(buildCustodyCode('WELX1', 'COCO', date, 1), 'LS-WELX1-COCO-18/01');
    });

    test('well name is slugged to uppercase alphanumerics', () {
      expect(buildCustodyCode('Well X-1', 'SOSC', date, 1), 'LS-WELLX1-SOSC-18/01');
    });
  });
}
