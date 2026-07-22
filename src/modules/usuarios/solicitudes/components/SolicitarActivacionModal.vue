<template>
  <AppModal v-model="open" :title="title" :subtitle="usuario?.nombre ?? ''" size="sm">
    <p class="text-sm text-gray-600 dark:text-gray-400">
      La solicitud de
      {{ tipoSolicitud === 'ACTIVACION' ? 'activación' : 'desactivación' }}
      quedará registrada para revisión del administrador.
    </p>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
        @click="onConfirm"
      >
        Registrar solicitud
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Usuario } from '@/modules/usuarios/interfaces/usuario.interface'
import type { TipoSolicitudUsuario } from '@/modules/usuarios/solicitudes/interfaces/solicitud-usuario.interface'
import { AppModal } from '@/shared/components'
import { toastInfo } from '@/shared/composables/useToast'

const open = defineModel<boolean>({ required: true })

const props = defineProps<{
  usuario: Usuario | null
  tipoSolicitud: TipoSolicitudUsuario
}>()

const emit = defineEmits<{
  saved: []
}>()

const title = computed(() =>
  props.tipoSolicitud === 'ACTIVACION'
    ? 'Solicitar activación'
    : 'Solicitar desactivación',
)

function onConfirm() {
  toastInfo('El flujo de solicitud de usuarios aún no está disponible en el backend.')
  open.value = false
  emit('saved')
}
</script>
