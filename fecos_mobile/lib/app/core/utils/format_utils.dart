import 'package:intl/intl.dart';

final _gallonsFmt = NumberFormat('#,##0.0');
final _rateFmt = NumberFormat('#,##0.000');
final _usdFmt = NumberFormat.currency(symbol: r'$');
final _dateFmt = DateFormat('MMM d, yyyy');
final _dateTimeFmt = DateFormat('MMM d, yyyy h:mm a');

abstract final class FormatUtils {
  static String gallons(num? v) =>
      v == null ? '--' : '${_gallonsFmt.format(v)} gal';
  static String rate(num? v) => v == null ? '--' : _rateFmt.format(v);
  static String usd(num? v) => v == null ? '--' : _usdFmt.format(v);
  static String date(DateTime? v) => v == null ? '--' : _dateFmt.format(v);
  static String dateTime(DateTime? v) =>
      v == null ? '--' : _dateTimeFmt.format(v);
  static String gps(double? lat, double? lng) =>
      (lat == null || lng == null)
          ? 'No GPS'
          : '${lat.toStringAsFixed(5)}, ${lng.toStringAsFixed(5)}';
  static bool isOffTarget(num? actual, num? target) {
    if (actual == null || target == null || target == 0) return false;
    return ((actual - target).abs() / target) > 0.10;
  }
}
