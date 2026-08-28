import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fecos_mobile/app/modules/delivery/controllers/delivery_controller.dart';

const _checkItems = [
  'Tires & lights',
  'Brakes',
  'No visible leaks',
  'Fire extinguisher',
  'Hazmat placards',
];

class PreTripView extends StatefulWidget {
  const PreTripView({super.key});

  @override
  State<PreTripView> createState() => _PreTripViewState();
}

class _PreTripViewState extends State<PreTripView> {
  final _controller = Get.find<DeliveryController>();
  final _passed = List<bool>.filled(_checkItems.length, true);
  final _notesController = TextEditingController();

  bool get _hasAnyFail => _passed.contains(false);

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final ok = await _controller.submitPreTrip(
      hasIssues: _hasAnyFail,
      notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
    );
    if (ok) Get.back(result: true);
  }

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pre-Trip Check'),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                for (var i = 0; i < _passed.length; i++) {
                  _passed[i] = true;
                }
              });
            },
            child: const Text('All Good'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: primary.withAlpha(20),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              'Check each item. Tap the toggle to mark as failed.',
              style: TextStyle(color: primary, fontSize: 13),
            ),
          ),
          const SizedBox(height: 16),
          ...List.generate(_checkItems.length, (i) {
            final pass = _passed[i];
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                title: Text(_checkItems[i]),
                trailing: GestureDetector(
                  onTap: () => setState(() => _passed[i] = !_passed[i]),
                  child: Container(
                    width: 56,
                    height: 28,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(14),
                      color: pass ? Colors.green : Colors.red,
                    ),
                    alignment: pass ? Alignment.centerRight : Alignment.centerLeft,
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Container(
                      width: 20,
                      height: 20,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ),
                subtitle: Text(
                  pass ? 'Pass' : 'FAIL',
                  style: TextStyle(
                    color: pass ? Colors.green : Colors.red,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ),
            );
          }),
          if (_hasAnyFail) ...[
            const SizedBox(height: 8),
            TextField(
              controller: _notesController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Issue notes (required for fails)',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Obx(() => ElevatedButton(
                onPressed: _controller.isUpdating.value ? null : _submit,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(50),
                  backgroundColor: _hasAnyFail ? Colors.orange : primary,
                ),
                child: _controller.isUpdating.value
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text(
                        _hasAnyFail ? 'Submit with Issues' : 'Submit — All Clear',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                      ),
              )),
        ),
      ),
    );
  }
}
