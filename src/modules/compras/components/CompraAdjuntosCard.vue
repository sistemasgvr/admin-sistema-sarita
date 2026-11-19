<template>
  <DetailSectionCard title="Documentos adjuntos" :icon="ICONS.fileText" :full-width="true">
    <p class="mb-3 text-sm text-gray-500 dark:text-gray-400">
      Factura del proveedor en PDF, foto del comprobante o guía. Queda guardado con la compra.
    </p>

    <div
      v-if="adjuntosQuery.isLoading.value"
      class="py-4 text-center text-sm text-gray-400"
    >
      Cargando adjuntos…
    </div>
    <div
      v-else-if="!adjuntos.length"
      class="rounded-lg border border-dashed border-gray-200 py-6 text-center text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500"
    >
      Esta compra no tiene documentos adjuntos.
    </div>
    <ul v-else class="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
      <li
        v-for="adjunto in adjuntos"
        :key="adjunto.id"
        class="flex flex-wrap items-center gap-3 px-3 py-2"
      >
        <AppIcon :name="ICONS.fileText" :size="18" class="shrink-0 text-gray-400" />
        <div class="min-w-0 flex-1">
          <button
            type="button"
            class="max-w-full truncate text-left text-sm font-medium text-brand-600 hover:underline disabled:opacity-60 dark:text-brand-400"
            :disabled="abriendoId === adjunto.id"
            @click="abrir(adjunto)"
          >
            {{ adjunto.descripcion || adjunto.nombre_original }}
          </button>
          <p class="text-xs text-gray-400">
            {{ adjunto.nombre_original }}
            <template v-if="adjunto.tamanio_bytes"> · {{ formatearTamanio(adjunto.tamanio_bytes) }}</template>
            · {{ formatDateTime(adjunto.fecha_creacion) }}
            <template v-if="adjunto.usuario_creacion"> · {{ adjunto.usuario_creacion }}</template>
          </p>
        </div>
        <button
          v-if="puedeAdjuntar"
          type="button"
          class="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-error-600 hover:bg-error-50 disabled:opacity-60 dark:text-error-400 dark:hover:bg-error-500/10"
          :disabled="quitandoId === adjunto.id"
          @click="quitar(adjunto)"
        >
          <AppIcon :name="ICONS.trash" :size="14" />
          Quitar
        </button>
      </li>
    </ul>

    <div v-if="puedeAdjuntar" class="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <AppFileInput
        v-model="archivo"
        label="Archivo"
        accept="application/pdf,image/*"
        hint="PDF o imagen, hasta 10 MB."
        :disabled="subiendo"
      />
      <AppInput
        v-model="descripcion"
        label="Descripción (opcional)"
        placeholder="Factura del proveedor"
        :maxlength="150"
        :disabled="subiendo"
      />
      <button
        type="button"
        class="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        :disabled="!archivoSeleccionado || subiendo"
        @click="adjuntar"
      >
        <AppIcon :name="subiendo ? ICONS.loader : ICONS.upload" :size="16" :class="{ 'animate-spin': subiendo }" />
        {{ subiendo ? 'Subiendo…' : 'Adjuntar' }}
      </button>
    </div>

    <AppConfirmDialog
      v-model="confirmarQuitarAbierto"
      title="Quitar documento"
      :message="`¿Quitar «${adjuntoAQuitar?.descripcion || adjuntoAQuitar?.nombre_original || ''}» de esta compra? El archivo queda guardado como respaldo.`"
      confirm-label="Quitar"
      :loading="quitandoId !== null"
      loading-label="Quitando…"
      @confirm="confirmarQuitar"
    />
  </DetailSectionCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { comprasQueryKeys } from '@/modules/compras/constants/comprasQueryKeys'
import type { CompraAdjunto } from '@/modules/compras/interfaces/compra.interface'
import { comprasService } from '@/modules/compras/services/compras.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppConfirmDialog, AppFileInput, AppInput } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import { toastApiError, toastSuccess, toastWarning } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { storageService } from '@/shared/services/storage.service'
import { formatDateTime } from '@/shared/utils/date'

const props = defineProps<{ idCompra: number }>()

const TAMANIO_MAXIMO = 10 * 1024 * 1024

const authStore = useAuthStore()
const queryClient = useQueryClient()

// Adjuntar es parte de registrar la compra: basta con crear o editar (igual que la API).
const puedeAdjuntar = computed(
  () =>
    authStore.hasPermission(PermisoBanderas.COMPRAS_CREAR) ||
    authStore.hasPermission(PermisoBanderas.COMPRAS_EDITAR),
)

const claveAdjuntos = computed(() => [...comprasQueryKeys.detail(props.idCompra), 'adjuntos'] as const)

const adjuntosQuery = useQuery({
  queryKey: claveAdjuntos,
  queryFn: () => comprasService.listarAdjuntos(props.idCompra),
  enabled: computed(() => props.idCompra > 0),
})
const adjuntos = computed(() => adjuntosQuery.data.value ?? [])

const archivo = ref<File | File[] | null>(null)
const archivoSeleccionado = computed(() => (Array.isArray(archivo.value) ? archivo.value[0] : archivo.value) ?? null)
const descripcion = ref('')
const subiendo = ref(false)
const abriendoId = ref<number | null>(null)
const quitandoId = ref<number | null>(null)

function formatearTamanio(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const refrescar = () => queryClient.invalidateQueries({ queryKey: claveAdjuntos.value })

async function adjuntar() {
  const file = archivoSeleccionado.value
  if (!file) return
  if (file.size > TAMANIO_MAXIMO) {
    toastWarning('El archivo pesa más de 10 MB. Comprímelo o adjunta una foto más liviana.')
    return
  }
  subiendo.value = true
  try {
    const nombre = file.name.replace(/[^\w.-]+/g, '_')
    const subido = await storageService.subirArchivo(file, `compras/${props.idCompra}/${Date.now()}-${nombre}`)
    const idArchivo = subido.archivo?.id ?? subido.id
    if (!idArchivo) throw new Error('El servidor no devolvió el archivo subido')
    await comprasService.agregarAdjunto(props.idCompra, {
      idArchivo,
      descripcion: descripcion.value.trim() || undefined,
    })
    archivo.value = null
    descripcion.value = ''
    toastSuccess('Documento adjuntado')
    await refrescar()
  } catch (error) {
    toastApiError(error, 'No se pudo adjuntar el documento')
  } finally {
    subiendo.value = false
  }
}

async function abrir(adjunto: CompraAdjunto) {
  abriendoId.value = adjunto.id
  try {
    const { signedUrl } = await storageService.firmarUrl(adjunto.ruta)
    window.open(signedUrl, '_blank', 'noopener')
  } catch (error) {
    toastApiError(error, 'No se pudo abrir el documento')
  } finally {
    abriendoId.value = null
  }
}

const adjuntoAQuitar = ref<CompraAdjunto | null>(null)
const confirmarQuitarAbierto = computed({
  get: () => adjuntoAQuitar.value !== null,
  set: (abierto) => {
    if (!abierto) adjuntoAQuitar.value = null
  },
})

function quitar(adjunto: CompraAdjunto) {
  adjuntoAQuitar.value = adjunto
}

async function confirmarQuitar() {
  const adjunto = adjuntoAQuitar.value
  if (!adjunto) return
  quitandoId.value = adjunto.id
  try {
    await comprasService.eliminarAdjunto(props.idCompra, adjunto.id)
    toastSuccess('Documento quitado')
    adjuntoAQuitar.value = null
    await refrescar()
  } catch (error) {
    toastApiError(error, 'No se pudo quitar el documento')
  } finally {
    quitandoId.value = null
  }
}
</script>
