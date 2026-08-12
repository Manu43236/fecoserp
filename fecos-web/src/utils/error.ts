import type { AxiosError } from 'axios'

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const axiosErr = err as AxiosError<{ message?: string }>
    return axiosErr.response?.data?.message ?? axiosErr.message
  }
  return 'Something went wrong'
}
