abstract final class ValidatorUtils {
  static String? required(String? v) =>
      (v == null || v.trim().isEmpty) ? 'This field is required' : null;

  static String? email(String? v) {
    if (v == null || v.trim().isEmpty) return 'Email is required';
    final valid = RegExp(r'^[\w\-.]+@[\w\-]+\.\w{2,}$').hasMatch(v.trim());
    return valid ? null : 'Enter a valid email address';
  }

  static String? Function(String?) minLength(int min) => (v) {
        if (v == null || v.length < min) return 'Minimum $min characters required';
        return null;
      };

  static String? numeric(String? v) {
    if (v == null || v.trim().isEmpty) return 'This field is required';
    return double.tryParse(v) == null ? 'Enter a valid number' : null;
  }
}
