import { ApiError } from '@/shared/api/errors/api.error'
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
  toast.error(resolveErrorMessage(error, fallback))
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error inesperado',
): string {
  return resolveErrorMessage(error, fallback)
}
