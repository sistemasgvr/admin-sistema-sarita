<template>
  <AppModal
    v-model="open"
    title="Registrar retorno"
    subtitle="Puedes guardar un subconjunto. Los ya retornados quedan bloqueados."
    size="lg"
  >
    <div v-if="rutaQuery.isLoading.value && filas.length === 0" class="py-8 text-center text-sm text-gray-500">
      Cargando…
    </div>
    <div v-else class="space-y-4">
      <!-- Cilindros -->
      <div v-if="filas.length > 0">
        <p class="mb-2 text-sm font-medium text-gray-800 dark:text-white/90">Cilindros</p>
        <div class="space-y-3">
          <div
            v-for="det in filas"
            :key="det.id_balon"
            class="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-3 dark:border-gray-800"
          >
            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ det.codigo_balon || `#${det.id_balon}` }}
              </p>
              <p class="text-xs text-gray-500">
                Salida: {{ Number(det.lb_salida).toFixed(2) }} lb · factor
                {{ factorDe(det).toFixed(4) }} m³/lb
              </p>
            </div>
            <AppInput
              v-model="det.lbRetorno"
              label="Libras al retorno"
              type="number"
              step="0.01"
              min="0"
              :max="Number(det.lb_salida)"
              :disabled="det.yaRetornado"
              :required="!det.yaRetornado"
            />
            <div class="flex items-end pb-1 text-xs text-gray-500">
              <template v-if="det.yaRetornado">Ya retornado</template>
              <template v-else>
                Usado ≈
                {{
                  Math.max(0, Number(det.lb_salida) - Number(det.lbRetorno || 0)).toFixed(2)
                }}
                lb /
                {{
                  (
                    Math.max(0, Number(det.lb_salida) - Number(det.lbRetorno || 0)) * factorDe(det)
                  ).toFixed(3)
                }}
                m³
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Productos -->
      <div v-if="filasProducto.length > 0">
        <p class="mb-2 text-sm font-medium text-gray-800 dark:text-white/90">Productos</p>
        <div class="space-y-3">
          <div
            v-for="det in filasProducto"
            :key="det.id_producto"
            class="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-3 dark:border-gray-800"
          >
            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ det.nombre_producto || `#${det.id_producto}` }}
              </p>
              <p class="text-xs text-gray-500">
                Enviado: {{ Number(det.cantidad).toFixed(2) }} ud
              </p>
            </div>
            <AppInput
              v-model="det.cantidadRetorno"
              label="Cantidad retorno"
              type="number"
              step="0.01"
              min="0"
              :max="Number(det.cantidad)"
              :disabled="det.yaRetornado"
              :required="!det.yaRetornado"
            />
            <div class="flex items-end pb-1 text-xs text-gray-500">
              <template v-if="det.yaRetornado">Ya retornado</template>
              <template v-else>
                No retornado: {{
                  Math.max(0, Number(det.cantidad) - Number(det.cantidadRetorno || 0)).toFixed(2)
                }} ud
              </template>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filas.length === 0 && filasProducto.length === 0" class="py-8 text-center text-sm text-gray-500">
        No hay ítems para retornar.
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        :disabled="retornoMutation.isPending.value || !canSaveSubset"
        @click="guardar"
      >
        Guardar retorno
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRutaPuebloQuery } from '@/modules/balones/rutas-pueblos/composables/useRutasPueblosQuery'
import { useRegistrarRetornoRutaPuebloMutation } from '@/modules/balones/rutas-pueblos/composables/useRutasPueblosMutations'
import type { RutaPueblo, RutaPuebloDetalle, RutaPuebloDetalleProducto } from '@/modules/balones/rutas-pueblos/interfaces/ruta-pueblo.interface'
import { AppInput, AppModal } from '@/shared/components'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { toastWarning } from '@/shared/composables/useToast'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{ rutaId: number | null }>()
const emit = defineEmits<{ saved: [] }>()

const authStore = useAuthStore()
const rutaIdRef = computed(() => (open.value ? props.rutaId : null))
const rutaQuery = useRutaPuebloQuery(rutaIdRef)
const retornoMutation = useRegistrarRetornoRutaPuebloMutation()
const ruta = computed(() => rutaQuery.data.value)

type Fila = {
  id_balon: number
  codigo_balon?: string | null
  lb_salida: number | string
  lbRetorno: string
  yaRetornado: boolean
  factor_lb_m3_tipo?: number | string | null
  capacidad_tipo?: number | string | null
  capacidad_lb_tipo?: number | string | null
}

type FilaProducto = {
  id_producto: number
  nombre_producto?: string | null
  cantidad: number | string
  cantidadRetorno: string
  yaRetornado: boolean
}

const filas = ref<Fila[]>([])
const filasProducto = ref<FilaProducto[]>([])
const hydratedForId = ref<number | null>(null)

function factorDe(det: Pick<Fila, 'factor_lb_m3_tipo' | 'capacidad_tipo' | 'capacidad_lb_tipo'>) {
  const fromTipo = Number(det.factor_lb_m3_tipo)
  if (Number.isFinite(fromTipo) && fromTipo > 0) return fromTipo
  const cap = Number(det.capacidad_tipo)
  const lb = Number(det.capacidad_lb_tipo)
  if (cap > 0 && lb > 0) return cap / lb
  return Number(ruta.value?.factor_lb_m3 || 0)
}

function mapFilas(data: RutaPueblo): Fila[] {
  return (data.detalles ?? []).map((d: RutaPuebloDetalle) => {
    const yaRetornado = d.lb_retorno != null && d.lb_retorno !== ''
    return {
      id_balon: d.id_balon,
      codigo_balon: d.codigo_balon,
      lb_salida: d.lb_salida,
      lbRetorno: yaRetornado ? String(d.lb_retorno) : '',
      yaRetornado,
      factor_lb_m3_tipo: d.factor_lb_m3_tipo,
      capacidad_tipo: d.capacidad_tipo,
      capacidad_lb_tipo: d.capacidad_lb_tipo,
    }
  })
}

function mapFilasProducto(data: RutaPueblo): FilaProducto[] {
  return (data.detalles_productos ?? []).map((d: RutaPuebloDetalleProducto) => {
    const yaRetornado = d.cantidad_retorno != null && d.cantidad_retorno !== ''
    return {
      id_producto: d.id_producto,
      nombre_producto: d.nombre_producto,
      cantidad: d.cantidad,
      cantidadRetorno: yaRetornado ? String(d.cantidad_retorno) : '',
      yaRetornado,
    }
  })
}

function hydrateFromRuta(force: boolean) {
  const data = rutaQuery.data.value
  const id = props.rutaId
  if (!open.value || !id) return
  if (!force && hydratedForId.value === id && filas.value.length > 0) return
  filas.value = data?.detalles ? mapFilas(data) : []
  filasProducto.value = data?.detalles_productos ? mapFilasProducto(data) : []
  hydratedForId.value = id
}

watch(
  () => [open.value, props.rutaId] as const,
  ([isOpen, id]) => {
    if (!isOpen) {
      filas.value = []
      filasProducto.value = []
      hydratedForId.value = null
      return
    }
    if (hydratedForId.value !== id) {
      filas.value = []
      filasProducto.value = []
      hydratedForId.value = null
    }
    hydrateFromRuta(true)
  },
)

watch(
  () => rutaQuery.data.value,
  () => {
    hydrateFromRuta(false)
  },
)

const canSaveSubset = computed(() => {
  const balonesPendientes = filas.value.some((f) => !f.yaRetornado && f.lbRetorno !== '')
  const productosPendientes = filasProducto.value.some(
    (f) => !f.yaRetornado && f.cantidadRetorno !== '',
  )
  return balonesPendientes || productosPendientes
})

async function guardar() {
  const userId = authStore.user?.id
  const id = props.rutaId
  if (!userId || !id) return

  const pendientesBalon = filas.value.filter((f) => !f.yaRetornado && f.lbRetorno !== '')
  const pendientesProducto = filasProducto.value.filter(
    (f) => !f.yaRetornado && f.cantidadRetorno !== '',
  )

  if (pendientesBalon.length === 0 && pendientesProducto.length === 0) {
    toastWarning('Indica libras de retorno o cantidad de retorno en al menos un ítem pendiente')
    return
  }

  const detalles = pendientesBalon.map((f) => ({
    idBalon: f.id_balon,
    lbRetorno: Number(f.lbRetorno),
  }))

  if (detalles.some((d) => Number.isNaN(d.lbRetorno) || d.lbRetorno < 0)) {
    toastWarning('Completa las libras de retorno (≥ 0)')
    return
  }

  const sobreSalida = pendientesBalon.find(
    (f) => Number(f.lbRetorno) > Number(f.lb_salida) + 1e-9,
  )
  if (sobreSalida) {
    toastWarning(
      `Retorno no puede superar salida (${Number(sobreSalida.lb_salida).toFixed(2)} lb) en ${sobreSalida.codigo_balon || `#${sobreSalida.id_balon}`}`,
    )
    return
  }

  const detallesProductos = pendientesProducto.map((f) => ({
    idProducto: f.id_producto,
    cantidadRetorno: Number(f.cantidadRetorno),
  }))

  if (detallesProductos.some((d) => Number.isNaN(d.cantidadRetorno) || d.cantidadRetorno < 0)) {
    toastWarning('Completa las cantidades de retorno (≥ 0)')
    return
  }

  const sobreEnviado = pendientesProducto.find(
    (f) => Number(f.cantidadRetorno) > Number(f.cantidad) + 1e-9,
  )
  if (sobreEnviado) {
    toastWarning(
      `Retorno no puede superar enviado (${Number(sobreEnviado.cantidad).toFixed(2)} ud) en ${sobreEnviado.nombre_producto || `#${sobreEnviado.id_producto}`}`,
    )
    return
  }

  await retornoMutation.mutateAsync({
    id,
    payload: {
      idUsuarioAuditoria: userId,
      detalles: detalles.length > 0 ? detalles : undefined,
      detallesProductos: detallesProductos.length > 0 ? detallesProductos : undefined,
    },
  })
  open.value = false
  emit('saved')
}
</script>
