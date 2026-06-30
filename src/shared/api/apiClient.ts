import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { ApiError } from '@/shared/api/errors/api.error'
import type { ApiErrorResponse, ApiResponse } from '@/shared/api/interfaces/api.interface'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

let getAccessToken: () => string | null = () => null
let handleUnauthorized: () => void = () => {}

export function configureApiClient(options: {
  getAccessToken: () => string | null
  onUnauthorized: () => void
}) {
  getAccessToken = options.getAccessToken
  handleUnauthorized = options.onUnauthorized
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      const statusCode = error.response?.status ?? 500
      const payload = error.response?.data

      if (statusCode === 401) {
        handleUnauthorized()
      }

      throw new ApiError(
        payload?.message ?? error.message ?? 'Error de conexión',
        statusCode,
        payload?.errors ?? null,
      )
    }

    throw new ApiError('Error de conexión con el servidor', 500)
  },
)

function unwrapResponse<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, config)
  return unwrapResponse(response)
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, body, config)
  return unwrapResponse(response)
}

export async function apiPatch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.patch<ApiResponse<T>>(url, body, config)
  return unwrapResponse(response)
}

export async function apiPut<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await apiClient.put<ApiResponse<T>>(url, body, config)
  return unwrapResponse(response)
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.delete<ApiResponse<T>>(url, config)
  return unwrapResponse(response)
}
