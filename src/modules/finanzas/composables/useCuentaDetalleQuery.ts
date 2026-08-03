import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { finanzasQueryKeys } from '@/modules/finanzas/constants/finanzasQueryKeys'
import { finanzasService } from '@/modules/finanzas/services/finanzas.service'
import type { TipoCuenta } from '@/modules/finanzas/interfaces/cuenta.interface'

export function useCuentaDetalleQuery(tipo: TipoCuenta, id: Ref<number | null>) {
  return useQuery({
    queryKey: computed(() => finanzasQueryKeys.cuentaDetalle(tipo, id.value ?? 0)),
    queryFn: () => finanzasService.obtenerCuenta(tipo, id.value as number),
    enabled: computed(() => (id.value ?? 0) > 0),
  })
}
