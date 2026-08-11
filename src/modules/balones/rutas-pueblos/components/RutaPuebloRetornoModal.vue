<template>
  <AppModal
    v-model="open"
    title="Registrar retorno"
    subtitle="Misma código · libras de vuelta. Δ → m³; residual no fuerza vacío."
    size="lg"
  >
    <div v-if="rutaQuery.isLoading.value" class="py-8 text-center text-sm text-gray-500">
      Cargando…
    </div>
    <div v-else class="space-y-3">
      <p class="text-xs text-gray-500">
        Factor {{ Number(ruta?.factor_lb_m3 ?? 0).toFixed(4) }} m³/lb ·
        m³ = (lb salida − lb retorno) × factor
      </p>
      <div
        v-for="det in filas"
        :key="det.id_balon"
        class="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-3 dark:border-gray-800"
      >
        <div>
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">
            {{ det.codigo_balon || `#${det.id_balon}` }}
          </p>
          <p class="text-xs text-gray-500">Salida: {{ Number(det.lb_salida).toFixed(2) }} lb</p>
        </div>
        <AppInput
          v-model="det.lbRetorno"
          label="Lb retorno"
          type="number"
          step="0.01"
          min="0"
          required
        />
        <div class="flex items-end pb-1 text-xs text-gray-500">
          Δ ≈
          {{
            Math.max(0, Number(det.lb_salida) - Number(det.lbRetorno || 0)).toFixed(2)
          }}
          lb →
          {{
            (
              Math.max(0, Number(det.lb_salida) - Number(det.lbRetorno || 0)) *
              Number(ruta?.factor_lb_m3 || 0)
            ).toFixed(3)
          }}
          m³
        </div>
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
        :disabled="retornoMutation.isPending.value || filas.length === 0"
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

const filas = ref<
  { id_balon: number; codigo_balon?: string | null; lb_salida: number | string; lbRetorno: string }[]
>([])

watch(
  () => rutaQuery.data.value,
  (data) => {
    if (!data?.detalles) return
    filas.value = data.detalles.map((d) => ({
      id_balon: d.id_balon,
      codigo_balon: d.codigo_balon,
      lb_salida: d.lb_salida,
      lbRetorno: d.lb_retorno != null ? String(d.lb_retorno) : '',
    }))
  },
)

async function guardar() {
  const userId = authStore.user?.id
  const id = props.rutaId
  if (!userId || !id) return

  const detalles = filas.value.map((f) => ({
    idBalon: f.id_balon,
    lbRetorno: Number(f.lbRetorno),
  }))

  if (detalles.some((d) => Number.isNaN(d.lbRetorno) || d.lbRetorno < 0)) {
    toastWarning('Completa las libras de retorno (≥ 0)')
    return
  }

  await retornoMutation.mutateAsync({
    id,
    payload: { idUsuarioAuditoria: userId, detalles },
  })
  open.value = false
  emit('saved')
}
</script>
