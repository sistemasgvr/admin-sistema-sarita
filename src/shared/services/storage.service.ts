import { apiPost } from '@/shared/api/apiClient'

/** Registro de gen_archivo que el backend crea junto con la subida. */
export interface StorageArchivo {
  id: number
  nombre_original: string
  nombre_almacenado: string
  ruta: string
  bucket: string
  mime_type?: string | null
  extension?: string | null
  tamanio_bytes?: number | null
}

export interface StorageUploadResponse {
  ruta: string
  path?: string
  bucket: string
  id?: number
  /** Metadatos del archivo registrado; de aquí sale el idArchivo que guardan los módulos. */
  archivo?: StorageArchivo | null
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
