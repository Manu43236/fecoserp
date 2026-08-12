import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class FecosTextField extends StatelessWidget {
  const FecosTextField({
    super.key,
    required this.controller,
    required this.label,
    this.hint,
    this.error,
    this.obscureText = false,
    this.keyboardType,
    this.numeric = false,
    this.maxLines = 1,
    this.validator,
    this.onChanged,
    this.suffixIcon,
    this.enabled = true,
  });

  final TextEditingController controller;
  final String label;
  final String? hint;
  final String? error;
  final bool obscureText;
  final TextInputType? keyboardType;
  final bool numeric;
  final int maxLines;
  final String? Function(String?)? validator;
  final ValueChanged<String>? onChanged;
  final Widget? suffixIcon;
  final bool enabled;

  @override
  Widget build(BuildContext context) => TextFormField(
        controller: controller,
        obscureText: obscureText,
        maxLines: maxLines,
        enabled: enabled,
        keyboardType: numeric ? TextInputType.number : keyboardType,
        inputFormatters: numeric
            ? [FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*'))]
            : null,
        style: numeric
            ? const TextStyle(fontFeatures: [FontFeature.tabularFigures()])
            : null,
        validator: validator,
        onChanged: onChanged,
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          errorText: error,
          suffixIcon: suffixIcon,
        ),
      );
}
