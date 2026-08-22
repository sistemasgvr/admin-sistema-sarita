<template>
  <AppModal v-model="open" title="Renovar documento" size="sm" @close="handleClose">
    <div v-if="documento" class="space-y-4">
      <div class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <p class="font-medium text-gray-800 dark:text-white/90">{{ documento.descripcion }}</p>
        <p class="text-theme-xs text-gray-500 dark:text-gray-400">
          Vencía el {{ formatListDate(documento.fecha_vencimiento) }}
        </p>
      </div>

      <form id="renovar-documento-form" @submit="onSubmit">
        <div class="grid gap-3 sm:grid-cols-2">
          <AppDatePicker
            v-model="fechaVencimiento"
            label="Nueva fecha de vencimiento"
            required
            v-bind="fechaVencimientoAttrs"
            :disabled="isSubmitting"
            :error="errors.fechaVencimiento"
          />
          <AppDatePicker
            v-model="fechaRenovacion"
            label="Fecha de renovación"
            v-bind="fechaRenovacionAttrs"
            :disabled="isSubmitting"
            :error="errors.fechaRenovacion"
          />
        </div>
        <p class="mt-2 flex items-start gap-1.5 text-theme-xs text-gray-400 dark:text-gray-500">
          <AppIcon :name="ICONS.circleHelp" :size="13" class="mt-0.5 shrink-0" />
          El vencimiento anterior queda registrado en la observación del documento, como historial de la renovación.
        </p>
      </form>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        :disabled="isSubmitting"
        @click="handleClose"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="renovar-documento-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Renovando...' : 'Renovar' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useRenovarDocumentoVencimientoMutation } from '@/modules/documentos-vencimiento/composables/useDocumentoVencimientoMutations'
import type { DocumentoVencimiento } from '@/modules/documentos-vencimiento/interfaces/documento-vencimiento.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppDatePicker, AppModal } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { requiredString } from '@/shared/validation'
import { formatListDate, hoyIsoLima } from '@/shared/utils/date'

const props = defineProps<{
  documento?: DocumentoVencimiento | null
}>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const authStore = useAuthStore()
const renovarMutation = useRenovarDocumentoVencimientoMutation()

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      fechaVencimiento: requiredString('La nueva fecha de vencimiento'),
      fechaRenovacion: yup.string().trim().optional(),
    }),
  ),
  initialValues: {
    fechaVencimiento: '',
    fechaRenovacion: '',
  },
})

const [fechaVencimiento, fechaVencimientoAttrs] = defineField('fechaVencimiento')
const [fechaRenovacion, fechaRenovacionAttrs] = defineField('fechaRenovacion')

const handleClose = () => {
  open.value = false
}

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  const documento = props.documento
  if (!currentUserId || !documento) return

  // Historial operativo mínimo: se antepone una línea con el vencimiento anterior a
  // la observación existente, en vez de perderlo al sobrescribir la fecha.
  const hoy = formatListDate(hoyIsoLima())
  const notaHistorial = `[Renovado ${hoy}] Vencía el ${formatListDate(documento.fecha_vencimiento)} → nuevo vencimiento ${formatListDate(values.fechaVencimiento)}.`
  const observacionActualizada = [notaHistorial, documento.observacion]
    .filter((v) => v && v.trim())
    .join('\n')

  try {
    await renovarMutation.mutateAsync({
      id: documento.id,
      payload: {
        idUsuarioAuditoria: currentUserId,
        descripcion: documento.descripcion,
        fechaVencimiento: values.fechaVencimiento,
        fechaRenovacion: values.fechaRenovacion || hoyIsoLima(),
        observacion: observacionActualizada || undefined,
      },
    })
    emit('saved')
    open.value = false
  } catch {
    // toast en mutation
  }
})

watch(open, (isOpen) => {
  if (isOpen) {
    resetForm({
      values: {
        fechaVencimiento: '',
        fechaRenovacion: hoyIsoLima(),
      },
    })
  }
})
</script>
