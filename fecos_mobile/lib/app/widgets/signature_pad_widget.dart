import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:signature/signature.dart';
import 'package:fecos_mobile/app/theme/app_theme.dart';
import 'package:fecos_mobile/app/widgets/fecos_button.dart';

class SignaturePadWidget extends StatefulWidget {
  const SignaturePadWidget({
    super.key,
    required this.onSigned,
    this.label = 'Customer Signature',
  });

  final ValueChanged<Uint8List> onSigned;
  final String label;

  @override
  State<SignaturePadWidget> createState() => _SignaturePadWidgetState();
}

class _SignaturePadWidgetState extends State<SignaturePadWidget> {
  final _controller = SignatureController(
    penStrokeWidth: 2,
    penColor: AppColors.textPrimary,
    exportBackgroundColor: Colors.white,
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _confirm() async {
    if (_controller.isEmpty) return;
    final bytes = await _controller.toPngBytes();
    if (bytes != null) widget.onSigned(bytes);
  }

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.label,
              style: const TextStyle(
                  fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          Container(
            height: 160,
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.border),
              borderRadius: BorderRadius.circular(10),
              color: Colors.white,
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Signature(controller: _controller, backgroundColor: Colors.white),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: FecosButton(
                  label: 'Clear',
                  onPressed: _controller.clear,
                  variant: FecosButtonVariant.outlined,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FecosButton(
                  label: 'Confirm',
                  onPressed: _confirm,
                ),
              ),
            ],
          ),
        ],
      );
}
