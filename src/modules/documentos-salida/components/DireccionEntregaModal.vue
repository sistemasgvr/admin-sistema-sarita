<template>
  <AppModal
    v-model="open"
    title="Dirección de entrega"
    subtitle="Elige una dirección guardada del cliente o ingrésala manualmente con el mapa."
    size="lg"
    @close="handleClose"
  >
    <div class="space-y-4">
      <div class="flex gap-2 text-sm">
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 font-medium transition"
          :class="
            modo === 'guardada'
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
              : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'
          "
          :disabled="!idCliente"
          @click="modo = 'guardada'"
        >
          Dirección guardada del cliente
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 font-medium transition"
          :class="
            modo === 'manual'
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
              : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'
          "
          @click="modo = 'manual'"
        >
          Ingresar manualmente
        </button>
      </div>

      <p v-if="!idCliente && modo === 'guardada'" class="text-xs text-amber-600 dark:text-amber-400">
        Este documento no tiene cliente asociado — solo puedes ingresar la dirección manualmente.
      </p>

      <template v-if="modo === 'guardada' && idCliente">
        <div v-if="direccionesQuery.isFetching.value" class="py-4 text-center text-sm text-gray-500">
          Cargando direcciones...
        </div>
        <div v-else-if="!direccionesGuardadas.length" class="py-4 text-center text-sm text-gray-500">
          Este cliente no tiene direcciones guardadas todavía.
        </div>
        <div v-else class="space-y-2">
          <button
            v-for="d in direccionesGuardadas"
            :key="d.id"
            type="button"
            class="w-full rounded-lg border px-3 py-2.5 text-left text-sm transition"
            :class="
              idDireccionSeleccionada === d.id
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5'
            "
            @click="idDireccionSeleccionada = d.id"
          >
            <p class="font-medium text-gray-800 dark:text-white/90">
              {{ d.direccion }}
              <span
                v-if="d.es_principal"
                class="ml-1.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
              >Principal</span>
            </p>
            <p v-if="d.referencia" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {{ d.referencia }}
            </p>
            <p class="mt-0.5 text-xs text-gray-400">{{ d.nombre_distrito ?? '—' }}</p>
          </button>
        </div>
      </template>

      <template v-else>
        <AppInput v-model="direccionManual" label="Dirección" required placeholder="Av. Balta 780, Chiclayo" />
        <AppInput v-model="referenciaManual" label="Referencia" placeholder="Frente al hospital, portón blanco" />
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Ubicación en el mapa
          </label>
          <MapaLeaflet v-model:latitud="latitudManual" v-model:longitud="longitudManual" height="280px" />
        </div>
      </template>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
        @click="handleClose"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-70"
        :disabled="!puedeGuardar || mutation.isPending.value"
        @click="onGuardar"
      >
        {{ mutation.isPending.value ? 'Guardando...' : 'Guardar dirección' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useDireccionesQuery } from '@/modules/direcciones/composables/useDireccionesQuery'
import { useRegistrarDireccionEntregaMutation } from '../composables/useDocumentoSalidaMutations'
import { AppInput, AppModal, MapaLeaflet } from '@/shared/components'

const props = defineProps<{
  idDocSalida: number
  idCliente?: number | null
}>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{ saved: [] }>()

const authStore = useAuthStore()

const modo = ref<'guardada' | 'manual'>('manual')
const idDireccionSeleccionada = ref<number | null>(null)
const direccionManual = ref('')
const referenciaManual = ref('')
const latitudManual = ref<number | null>(null)
const longitudManual = ref<number | null>(null)

const direccionesFiltros = computed(() => ({
  idCliente: props.idCliente ?? undefined,
  soloActivos: 1,
  limite: 50,
}))
const direccionesQuery = useDireccionesQuery(
  direccionesFiltros,
  computed(() => Boolean(props.idCliente) && open.value),
)
const direccionesGuardadas = computed(() => direccionesQuery.data.value?.data ?? [])

watch(open, (isOpen) => {
  if (!isOpen) return
  modo.value = props.idCliente ? 'guardada' : 'manual'
  idDireccionSeleccionada.value = null
  direccionManual.value = ''
  referenciaManual.value = ''
  latitudManual.value = null
  longitudManual.value = null
})

watch(direccionesGuardadas, (lista) => {
  if (modo.value !== 'guardada' || idDireccionSeleccionada.value) return
  const principal = lista.find((d) => d.es_principal) ?? lista[0]
  if (principal) idDireccionSeleccionada.value = principal.id
})

const puedeGuardar = computed(() => {
  if (modo.value === 'guardada') return Boolean(idDireccionSeleccionada.value)
  return Boolean(direccionManual.value.trim())
})

const mutation = useRegistrarDireccionEntregaMutation()

async function onGuardar() {
  if (!puedeGuardar.value) return
  await mutation.mutateAsync({
    id: props.idDocSalida,
    payload:
      modo.value === 'guardada'
        ? {
            idDireccionCliente: idDireccionSeleccionada.value!,
            idUsuarioAuditoria: authStore.user?.id,
          }
        : {
            direccionEntrega: direccionManual.value.trim(),
            referenciaEntrega: referenciaManual.value.trim() || undefined,
            latitud: latitudManual.value ?? undefined,
            longitud: longitudManual.value ?? undefined,
            idUsuarioAuditoria: authStore.user?.id,
          },
  })
  emit('saved')
  open.value = false
}

function handleClose() {
  open.value = false
}
</script>
