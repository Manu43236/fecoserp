import toast from 'react-hot-toast'
import { getErrorMessage } from '@/utils/error'

export function useToast() {
  return {
    success: (msg: string) => toast.success(msg),
    error:   (err: unknown) => toast.error(getErrorMessage(err)),
    info:    (msg: string) => toast(msg),
  }
}
