<template>
  <AppModal
    v-model="open"
    title="Asignar usuario de acceso"
    :subtitle="trabajador ? `Vincular un usuario a ${getNombre(trabajador)}` : ''"
    size="sm"
  >
    <div class="space-y-3">
      <SearchableSelect
        v-model="idUsuario"
        label="Usuario de acceso"
        placeholder="Buscar usuario..."
        empty-option-label="Sin usuario seleccionado"
        :search-fn="searchUsuarios"
        :disabled="isSubmitting"
        :error="error"
      />
      <p class="text-xs text-gray-500 dark:text-gray-400">
        El usuario seleccionado quedará vinculado a este trabajador para iniciar sesión.
      </p>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="isSubmitting"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting || !idUsuario"
        @click="confirmar"
      >
        {{ isSubmitting ? 'Asignando...' : 'Asignar' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { AppModal } from '@/shared/components'
import SearchableSelect from '@/shared/components/form/SearchableSelect.vue'
import { usuariosService } from '@/modules/usuarios/services/usuarios.service'
import { trabajadoresService } from '@/modules/trabajadores/services/trabajadores.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import type { Trabajador } from '@/modules/trabajadores/interfaces/trabajador.interface'
import type { SelectOption } from '@/shared/interfaces/form.interface'

interface AsignarUsuarioModalProps {
  trabajador?: Trabajador | null
}

const props = defineProps<AsignarUsuarioModalProps>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ assigned: [] }>()

const authStore = useAuthStore()
const idUsuario = ref<number | undefined>()
const isSubmitting = ref(false)
const error = ref('')

const getNombre = (t: Trabajador) =>
  [t.nombres, t.apellido_paterno, t.apellido_materno].filter(Boolean).join(' ').trim() || t.nombres

const searchUsuarios = async (query: string): Promise<SelectOption[]> => {
  const response = await usuariosService.listar({ buscar: query || undefined, pagina: 1, limite: 20 })
  return response.data.map((u) => ({ value: u.id, label: u.nombre ?? u.correo ?? `Usuario ${u.id}` }))
}

const confirmar = async () => {
  const t = props.trabajador
  const usuarioAuditoria = authStore.user?.id
  if (!t || !usuarioAuditoria || !idUsuario.value) return

  isSubmitting.value = true
  error.value = ''
  try {
    await trabajadoresService.asignarUsuario(t.id, idUsuario.value, usuarioAuditoria)
    emit('assigned')
    open.value = false
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    error.value = msg || 'No se pudo asignar el usuario'
  } finally {
    isSubmitting.value = false
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    idUsuario.value = undefined
    error.value = ''
  }
})
</script>
