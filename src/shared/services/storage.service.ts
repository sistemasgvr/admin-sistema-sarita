import { apiPost } from '@/shared/api/apiClient'

export interface StorageUploadResponse {
  ruta: string
  path?: string
  bucket: string
  id?: number
}

export interface StorageSignedUrlResponse {
  signedUrl: string
}

export const storageService = {
  subirArchivo(file: File, path: string, idEmpresa?: number) {
    const body = new FormData()
    body.append('file', file)
    body.append('path', path)
    body.append('upsert', 'true')
    if (idEmpresa != null) body.append('idEmpresa', String(idEmpresa))

    return apiPost<StorageUploadResponse>('/storage/upload', body)
  },

  firmarUrl(ruta: string) {
    return apiPost<StorageSignedUrlResponse>('/storage/signed-url', { path: ruta })
  },
}
