<template>
  <ul
    v-if="eventos.length"
    class="divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800"
    :class="editandoId == null ? 'max-h-72' : 'max-h-[28rem]'"
  >
    <li
      v-for="e in eventos"
      :key="e.id"
      class="space-y-1 py-2.5 text-theme-sm first:pt-0 last:pb-0"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <AppBadge
            :color="colorTipo(e.tipo)"
            size="sm"
            :title="
              e.tipo === 'AJUSTE_SIN_EFECTIVO'
                ? 'Operación sin efectivo hecha con la caja ya cerrada: se recalculó su arqueo'
                : undefined
            "
          >{{ etiquetaTipo(e.tipo) }}</AppBadge>
          <span v-if="e.usuario" class="text-gray-600 dark:text-gray-300">{{ e.usuario }}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-theme-xs text-gray-400">{{ formatDateTime(e.fechaHora) }}</span>
          <button
            v-if="canEditar && e.editable && editandoId !== e.id"
            type="button"
            class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-brand-600 disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-brand-400"
            :title="e.observacion ? 'Editar comentario' : 'Agregar comentario'"
            :aria-label="e.observacion ? 'Editar comentario' : 'Agregar comentario'"
            :disabled="guardando"
            @click="editar(e)"
          >
            <AppIcon :name="ICONS.pencil" :size="14" />
          </button>
        </div>
      </div>
      <p v-if="e.monto != null" class="tabular-nums text-gray-700 dark:text-gray-200">
        {{ etiquetaMonto(e.tipo) }} {{ formatCurrency(e.monto) }}
        <span
          v-if="e.diferencia != null"
          class="ml-2"
          :class="Number(e.diferencia) !== 0 ? 'font-medium text-error-600 dark:text-error-400' : 'text-gray-400'"
        >
          Dif. {{ formatCurrency(e.diferencia) }}
        </span>
      </p>
      <div v-if="editandoId === e.id" ref="editorRef" class="space-y-2 pt-1">
        <AppTextarea
          v-model="texto"
          :rows="3"
          :maxlength="500"
          label="Comentario"
          placeholder="Escribe el comentario"
          :disabled="guardando"
        />
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-theme-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            :disabled="guardando"
            @click="editandoId = null"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="rounded-lg bg-brand-500 px-3 py-1.5 text-theme-xs font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="guardando || !puedeGuardar(e)"
            @click="guardar(e)"
          >
            {{ guardando ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
      <p
        v-else-if="e.observacion"
        class="whitespace-pre-line break-words text-gray-500 dark:text-gray-400"
      >
        {{ e.observacion }}
      </p>
      <p
        v-if="e.fechaEdicion"
        class="text-theme-xs text-gray-400"
        :title="`Texto original: ${e.observacionOriginal || 'sin comentario'}`"
      >
        Editado{{ e.usuarioEdicion ? ` por ${e.usuarioEdicion}` : '' }} ·
        {{ formatDateTime(e.fechaEdicion) }}
      </p>
    </li>
  </ul>
  <p v-else class="text-theme-sm text-gray-500 dark:text-gray-400">Sin comentarios</p>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useEditarCajaComentarioMutation } from '@/modules/caja/composables/useCajaQuery'
import { AppBadge, AppTextarea } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { CajaSesionEvento } from '@/modules/caja/interfaces/caja.interface'
import { formatCurrency } from '@/shared/utils/currency'
import { formatDateTime } from '@/shared/utils/date'

const props = defineProps<{ idSesion: number; eventos: CajaSesionEvento[] }>()

const auth = useAuthStore()
const canEditar = computed(() => auth.hasPermission(PermisoBanderas.CAJA_EDITAR_COMENTARIO))

const mutation = useEditarCajaComentarioMutation()
const guardando = computed(() => mutation.isPending.value)
const editandoId = ref<number | null>(null)
const texto = ref('')
// Dentro de v-for Vue entrega un arreglo; solo hay un editor abierto a la vez.
const editorRef = ref<HTMLElement[]>([])

async function editar(e: CajaSesionEvento) {
  editandoId.value = e.id
  texto.value = e.observacion ?? ''
  await nextTick()
  editorRef.value[0]?.scrollIntoView({ block: 'nearest' })
  editorRef.value[0]?.querySelector('textarea')?.focus()
}

function puedeGuardar(e: CajaSesionEvento) {
  const nuevo = texto.value.trim()
  return nuevo !== '' && nuevo !== (e.observacion ?? '').trim()
}

async function guardar(e: CajaSesionEvento) {
  if (guardando.value || !puedeGuardar(e)) return
  try {
    await mutation.mutateAsync({
      idSesion: props.idSesion,
      idEvento: e.id,
      observacion: texto.value.trim(),
    })
    editandoId.value = null
  } catch {
    // toast en la mutación
  }
}

const ETIQUETAS: Record<CajaSesionEvento['tipo'], string> = {
  ABRIR: 'Apertura',
  CERRAR: 'Cierre',
  REABRIR: 'Reapertura',
  AJUSTE_FONDO: 'Ajuste de fondo',
  AJUSTE_COMPRA: 'Ajuste por compra',
  AJUSTE_SIN_EFECTIVO: 'Movimiento con caja cerrada',
}

function etiquetaTipo(tipo: CajaSesionEvento['tipo']) {
  return ETIQUETAS[tipo] ?? tipo
}

function etiquetaMonto(tipo: CajaSesionEvento['tipo']) {
  if (tipo === 'CERRAR') return 'Contado'
  return tipo === 'AJUSTE_COMPRA' || tipo === 'AJUSTE_SIN_EFECTIVO' ? 'Monto' : 'Inicial'
}

function colorTipo(tipo: CajaSesionEvento['tipo']) {
  if (tipo === 'CERRAR' || tipo.startsWith('AJUSTE_')) return 'warning'
  return tipo === 'REABRIR' ? 'primary' : 'success'
}
</script>
