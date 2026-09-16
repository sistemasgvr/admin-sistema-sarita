export interface TributoOrigen {
  idEmpresa: number
  serie: string
  fechaEmision: string
  regimen: string
  tasa: number
  baseImponible: number
  observacion?: string
}
export interface TributoCreado { id: number; serie: string; numero: string }

export function validarTributoOrigen(value: TributoOrigen | undefined, total: number, tipo: 'percepcion' | 'retencion'): string | null {
  if (!value) return null
  if (!value.idEmpresa) return 'Selecciona la empresa en Configuración → Empresa'
  if (!(tipo === 'percepcion' ? /^P[A-Z0-9]{3}$/ : /^R[A-Z0-9]{3}$/).test(value.serie)) return 'La serie debe tener cuatro caracteres y comenzar con ' + (tipo === 'percepcion' ? 'P' : 'R')
  if (!value.fechaEmision) return 'Indica la fecha del documento asociado'
  if (!value.regimen) return 'Selecciona el régimen'
  if (!Number.isFinite(value.tasa) || value.tasa <= 0 || value.tasa > 100) return 'Indica una tasa mayor que 0 y hasta 100'
  if (!Number.isFinite(value.baseImponible) || value.baseImponible <= 0 || value.baseImponible > total + 0.001) return 'La base debe ser mayor que cero y no superar el total del comprobante'
  return null
}
