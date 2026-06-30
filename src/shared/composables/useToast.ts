import { toast } from 'vue-sonner'

export function toastSuccess(message: string) {
  toast.success(message)
}

export function toastError(message: string) {
  toast.error(message)
}

export function toastInfo(message: string) {
  toast.info(message)
}

export function toastWarning(message: string) {
  toast.warning(message)
}

export function toastApiError(error: unknown, fallback = 'Ocurrió un error inesperado') {
  if (error instanceof Error && error.message) {
    toast.error(error.message)
    return
  }

  toast.error(fallback)
}
