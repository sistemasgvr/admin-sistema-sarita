export interface Pais {
  id: number
  nombre: string
  estado?: number
}

export interface Departamento {
  id: number
  id_pais: number
  nombre: string
}

export interface Provincia {
  id: number
  id_departamento: number
  nombre: string
}

export interface Distrito {
  id: number
  nombre: string
  codigo_ubigeo?: string
}
