sealed class AsyncState<T> {
  const AsyncState();
}

final class AsyncIdle<T> extends AsyncState<T> {
  const AsyncIdle();
}

final class AsyncLoading<T> extends AsyncState<T> {
  const AsyncLoading();
}

final class AsyncSuccess<T> extends AsyncState<T> {
  const AsyncSuccess(this.data);
  final T data;
}

final class AsyncError<T> extends AsyncState<T> {
  const AsyncError(this.message);
  final String message;
}
