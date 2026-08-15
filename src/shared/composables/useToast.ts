import { ApiError } from '@/shared/api/errors/api.error'
import { toast } from 'vue-sonner'

export function toastSuccess(message: string) {
  toast.success(message, { duration: 3500 })
}

export function toastError(message: string) {
  toast.error(message, { duration: 5500 })
}

export function toastInfo(message: string) {
  toast.info(message, { duration: 4000 })
}

export function toastWarning(message: string) {
  toast.warning(message, { duration: 5500 })
}

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const details = error.errors?.filter(Boolean).join(' · ')
    if (details && error.message && error.message !== details) {
      return `${error.message}: ${details}`
    }
    if (error.message?.trim()) return error.message.trim()
    if (details) return details
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim()
  }

  return fallback
}

export function toastApiError(error: unknown, fallback = 'Ocurrió un error inesperado') {
  toast.error(resolveErrorMessage(error, fallback), { duration: 5500 })
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error inesperado',
): string {
  return resolveErrorMessage(error, fallback)
}
