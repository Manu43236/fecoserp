import 'package:flutter/material.dart';
import 'package:fecos_mobile/app/core/state/async_state.dart';
import 'package:fecos_mobile/app/widgets/fecos_loader.dart';
import 'package:fecos_mobile/app/widgets/error_view.dart';
import 'package:fecos_mobile/app/widgets/empty_state.dart';

class AsyncStateBuilder<T> extends StatelessWidget {
  const AsyncStateBuilder({
    super.key,
    required this.state,
    required this.onSuccess,
    this.onEmpty,
    this.emptyMessage = 'No data found',
    this.onRetry,
  });

  final AsyncState<T> state;
  final Widget Function(T data) onSuccess;
  final bool Function(T data)? onEmpty;
  final String emptyMessage;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) => switch (state) {
        AsyncIdle() || AsyncLoading() => const FecosLoader(),
        AsyncSuccess(:final data) when onEmpty != null && onEmpty!(data) =>
          EmptyState(message: emptyMessage),
        AsyncSuccess(:final data) => onSuccess(data),
        AsyncError(:final message) => ErrorView(
            message: message,
            onRetry: onRetry,
          ),
      };
}
