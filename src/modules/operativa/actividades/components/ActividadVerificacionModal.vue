<template>
  <AppModal
    v-model="open"
    title="Verificación por escaneo"
    :subtitle="actividad?.titulo"
    size="xl"
  >
    <div class="space-y-5">
      <!-- Momento: salida y llegada se verifican por separado -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="opcion in momentos"
          :key="opcion.valor"
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm transition"
          :class="
            momento === opcion.valor
              ? 'bg-brand-50 font-medium text-brand-600 dark:bg-brand-500/10'
              : 'text-gray-500 hover:text-gray-700'
          "
          @click="momento = opcion.valor"
        >
          {{ opcion.label }}
        </button>

        <AppBadge
          size="sm"
          variant="light"
          :color="pendientes === 0 ? 'success' : 'warning'"
          class="ml-auto"
        >
          {{ pendientes === 0 ? 'Todo verificado' : `${pendientes} pendiente(s)` }}
        </AppBadge>
      </div>

      <!-- Captura -->
      <div class="rounded-xl border border-gray-200 p-3.5 dark:border-gray-700">
        <div class="flex flex-wrap items-end gap-3">
          <AppInput
            v-model="codigo"
            label="Código del cilindro o producto"
            placeholder="Escanea o escribe y pulsa Enter"
            class="min-w-0 flex-1"
            :disabled="guardando"
            @keyup.enter="agregarCodigo"
          />
          <BalonBarcodeScanButton
            :disabled="guardando"
            modal-title="Escanear ítem"
            @captured="onEscaneado"
          />
          <button
            type="button"
            class="rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-70 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            :disabled="guardando || !codigo.trim()"
            @click="agregarCodigo"
          >
            Agregar
          </button>
        </div>

        <div v-if="cola.length" class="mt-3 flex flex-wrap gap-1.5">
          <span
            v-for="(c, i) in cola"
            :key="`${c}-${i}`"
            class="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 font-mono text-xs text-gray-700 dark:bg-white/10 dark:text-gray-300"
          >
            {{ c }}
            <button type="button" :disabled="guardando" @click="cola.splice(i, 1)">
              <AppIcon :name="ICONS.x" :size="12" />
            </button>
          </span>
        </div>

        <AppInput
          v-model="observacion"
          label="Observación (opcional)"
          placeholder="Si la escribes, los ítems de esta tanda quedan con observación"
          class="mt-3"
          :disabled="guardando"
        />

        <button
          type="button"
          class="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          :disabled="guardando || cola.length === 0"
          @click="registrar"
        >
          <AppIcon :name="ICONS.scanBarcode" :size="15" />
          {{ guardando ? 'Registrando...' : `Registrar ${cola.length} lectura(s)` }}
        </button>
      </div>

      <!-- Ítems -->
      <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table class="min-w-full text-sm">
          <thead
            class="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-white/[0.03] dark:text-gray-400"
          >
            <tr>
              <th class="px-3 py-2 font-medium">#</th>
              <th class="px-3 py-2 font-medium">Ítem</th>
              <th class="px-3 py-2 font-medium">Código</th>
              <th class="px-3 py-2 font-medium">Estado</th>
              <th class="px-3 py-2 font-medium">Observación</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="item in items" :key="item.id ?? item.item">
              <td class="px-3 py-2 text-gray-400">{{ item.item }}</td>
              <td class="px-3 py-2 font-medium text-gray-800 dark:text-white/90">
                {{ item.nombre_producto || item.descripcion || '—' }}
              </td>
              <td class="px-3 py-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                {{ item.codigo_balon || '—' }}
              </td>
              <td class="px-3 py-2">
                <AppBadge size="sm" variant="light" :color="colorEstado(estadoDe(item))">
                  {{ etiquetaEstado(estadoDe(item)) }}
                </AppBadge>
              </td>
              <td class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                {{ observacionDe(item) || '—' }}
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="5" class="px-3 py-6 text-center text-gray-400">
                Esta actividad no tiene ítems que verificar.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        @click="open = false"
      >
        Cerrar
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BalonBarcodeScanButton from '@/modules/balones/cilindros/components/BalonBarcodeScanButton.vue'
import { useVerificarActividadMutation } from '@/modules/operativa/actividades/composables/useActividadMutations'
import type {
  Actividad,
  ActividadItem,
  MomentoVerificacion,
} from '@/modules/operativa/actividades/interfaces/actividad.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppBadge, AppInput, AppModal } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import type { BadgeColor } from '@/shared/interfaces/badge.interface'

const props = defineProps<{ actividad: Actividad | null | undefined }>()

const open = defineModel<boolean>({ default: false })

const authStore = useAuthStore()
const mutation = useVerificarActividadMutation()

const momentos: { valor: MomentoVerificacion; label: string }[] = [
  { valor: 'SALIDA', label: 'Salida del almacén' },
  { valor: 'LLEGADA', label: 'Llegada al cliente' },
]

const momento = ref<MomentoVerificacion>('SALIDA')
const codigo = ref('')
const observacion = ref('')
// Las lecturas se acumulan y se mandan juntas: escanear diez cilindros no
// deberían ser diez viajes al servidor.
const cola = ref<string[]>([])

const guardando = computed(() => mutation.isPending.value)
const items = computed(() => props.actividad?.items ?? [])

const estadoDe = (item: ActividadItem) =>
  momento.value === 'SALIDA'
    ? item.estado_verificacion_salida
    : item.estado_verificacion_llegada

const observacionDe = (item: ActividadItem) =>
  momento.value === 'SALIDA' ? item.observacion_salida : item.observacion_llegada

const pendientes = computed(
  () => items.value.filter((item) => (estadoDe(item) ?? 'PENDIENTE') === 'PENDIENTE').length,
)

function colorEstado(estado?: string | null): BadgeColor {
  if (estado === 'OK') return 'success'
  if (estado === 'CON_OBSERVACION') return 'warning'
  return 'neutral'
}

function etiquetaEstado(estado?: string | null) {
  if (estado === 'OK') return 'Verificado'
  if (estado === 'CON_OBSERVACION') return 'Con observación'
  return 'Pendiente'
}

function agregarCodigo() {
  const valor = codigo.value.trim().toUpperCase()
  if (!valor) return
  if (!cola.value.includes(valor)) cola.value.push(valor)
  codigo.value = ''
}

function onEscaneado(valor: string) {
  codigo.value = valor
  agregarCodigo()
}

async function registrar() {
  if (!props.actividad || cola.value.length === 0) return
  try {
    await mutation.mutateAsync({
      id: props.actividad.id,
      payload: {
        momento: momento.value,
        codigos: [...cola.value],
        observacion: observacion.value.trim() || undefined,
        idUsuarioAuditoria: authStore.user?.id,
      },
    })
    cola.value = []
    observacion.value = ''
  } catch {
    // toast en mutation
  }
}
</script>
