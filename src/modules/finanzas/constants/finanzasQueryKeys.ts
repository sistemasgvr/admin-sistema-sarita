import type { CuentaListFilters, TipoCuenta } from '@/modules/finanzas/interfaces/cuenta.interface'
import type { GarantiaListFilters } from '@/modules/finanzas/interfaces/garantia.interface'

export const finanzasQueryKeys = {
  all: ['finanzas'] as const,
  cuentas: (tipo: TipoCuenta) => [...finanzasQueryKeys.all, 'cuentas', tipo] as const,
  cuentasList: (tipo: TipoCuenta, filters: CuentaListFilters) =>
    [...finanzasQueryKeys.cuentas(tipo), 'list', filters] as const,
  cuentaDetalle: (tipo: TipoCuenta, id: number) =>
    [...finanzasQueryKeys.cuentas(tipo), 'detalle', id] as const,
  resumen: (tipo: TipoCuenta) => [...finanzasQueryKeys.all, 'resumen', tipo] as const,
  saldos: (tipo: TipoCuenta) => [...finanzasQueryKeys.all, 'saldos', tipo] as const,
  saldosList: (tipo: TipoCuenta, filters: unknown) =>
    [...finanzasQueryKeys.saldos(tipo), 'list', filters] as const,
  mediosPago: () => [...finanzasQueryKeys.all, 'medios-pago'] as const,
  garantias: () => [...finanzasQueryKeys.all, 'garantias'] as const,
  garantiasList: (filters: GarantiaListFilters) =>
    [...finanzasQueryKeys.garantias(), 'list', filters] as const,
}
