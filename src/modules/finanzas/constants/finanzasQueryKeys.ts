import type { CuentaListFilters, TipoCuenta } from '@/modules/finanzas/interfaces/cuenta.interface'

export const finanzasQueryKeys = {
  all: ['finanzas'] as const,
  cuentas: (tipo: TipoCuenta) => [...finanzasQueryKeys.all, 'cuentas', tipo] as const,
  cuentasList: (tipo: TipoCuenta, filters: CuentaListFilters) =>
    [...finanzasQueryKeys.cuentas(tipo), 'list', filters] as const,
  cuentaDetalle: (tipo: TipoCuenta, id: number) =>
    [...finanzasQueryKeys.cuentas(tipo), 'detalle', id] as const,
  resumen: (tipo: TipoCuenta) => [...finanzasQueryKeys.all, 'resumen', tipo] as const,
  mediosPago: () => [...finanzasQueryKeys.all, 'medios-pago'] as const,
}
