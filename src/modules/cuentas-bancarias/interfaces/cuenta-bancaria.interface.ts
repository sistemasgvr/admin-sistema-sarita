export interface CuentaBancaria {
  id: number
  id_cliente?: number | null
  cliente_razon_social?: string | null
  cliente_nombres?: string | null
  cliente_apellido_paterno?: string | null
  cliente_apellido_materno?: string | null
  cliente_numero_documento?: string | null
  id_banco?: number | null
  nombre_banco?: string | null
  id_tipo_cuenta?: number | null
  nombre_tipo_cuenta?: string | null
  titular: string
  numero_cuenta?: string | null
  numero_cuenta_interbancaria?: string | null
  telefono_billetera?: string | null
  es_principal: boolean
  estado: number
  id_usuario_creacion?: number | null
  nombre_usuario_creacion?: string | null
  id_usuario_modificacion?: number | null
  nombre_usuario_modificacion?: string | null
  fecha_creacion: string
  fecha_modificacion: string
}

export type CuentaBancariaEstadoFiltro = 'activos' | 'inactivos' | 'todos'

export interface CuentaBancariaListFilters {
  buscar?: string
  pagina?: number
  limite?: number
  isActivos?: number | null
  idCliente?: number
}

export interface CuentaBancariaPayload {
  idUsuarioAuditoria: number
  idCliente?: number | null
  idBanco?: number | null
  idTipoCuenta?: number | null
  titular?: string
  numeroCuenta?: string
  numeroCuentaInterbancaria?: string | null
  telefonoBilletera?: string | null
  esPrincipal?: boolean
}

export type CreateCuentaBancariaPayload = CuentaBancariaPayload
export type UpdateCuentaBancariaPayload = CuentaBancariaPayload

export interface DeleteCuentaBancariaResponse {
  eliminado: boolean
  id: number
}

export type CuentaBancariaFormMode = 'create' | 'edit'
