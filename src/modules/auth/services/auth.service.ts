import { apiGet, apiPost } from '@/shared/api/apiClient'
import type {
  AuthMeResponse,
  LoginPayload,
  LoginResponse,
  LogoutResponse,
} from '@/modules/auth/interfaces/auth.interface'

export const authService = {
  login(payload: LoginPayload) {
    return apiPost<LoginResponse>('/auth/login', payload)
  },

  logout() {
    return apiPost<LogoutResponse>('/auth/logout')
  },

  me() {
    return apiGet<AuthMeResponse>('/auth/me')
  },
}
