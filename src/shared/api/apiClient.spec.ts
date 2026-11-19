import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient, SIN_RESPUESTA_STATUS } from '@/shared/api/apiClient'
import { ApiError } from '@/shared/api/errors/api.error'
import { useEstadoConexion } from '@/shared/composables/useEstadoConexion'

type Rechazo = (error: unknown) => Promise<never>

function manejadorDeError(): Rechazo {
  const handlers = (apiClient.interceptors.response as unknown as {
    handlers: Array<{ rejected: Rechazo }>
  }).handlers
  return handlers[0].rejected
}

function errorSinRespuesta(code: string) {
  const config = { headers: new AxiosHeaders(), url: '/ventas' } as InternalAxiosRequestConfig
  return new AxiosError('Network Error', code, config)
}

async function capturar(error: unknown): Promise<ApiError> {
  try {
    await manejadorDeError()(error)
  } catch (e) {
    return e as ApiError
  }
  throw new Error('el interceptor no lanzó')
}

describe('apiClient sin respuesta del servidor', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('no reporta un fallo de red como error 500 ni en inglés', async () => {
    vi.stubGlobal('navigator', { onLine: true })
    const error = await capturar(errorSinRespuesta('ERR_NETWORK'))
    expect(error).toBeInstanceOf(ApiError)
    expect(error.statusCode).toBe(SIN_RESPUESTA_STATUS)
    expect(error.message).not.toContain('Network Error')
    expect(error.message).toContain('No se pudo conectar con el servidor')
    expect(useEstadoConexion().servidorInaccesible.value).toBe(true)
  })

  it('dice que no hay internet cuando el navegador está offline', async () => {
    vi.stubGlobal('navigator', { onLine: false })
    const error = await capturar(errorSinRespuesta('ERR_NETWORK'))
    expect(error.message).toContain('Sin conexión a internet')
  })

  it('distingue el tiempo agotado', async () => {
    vi.stubGlobal('navigator', { onLine: true })
    const error = await capturar(errorSinRespuesta('ECONNABORTED'))
    expect(error.message).toContain('tardó demasiado')
  })
})
