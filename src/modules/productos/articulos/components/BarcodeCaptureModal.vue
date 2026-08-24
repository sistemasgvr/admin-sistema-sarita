<template>
  <AppModal
    v-model="open"
    :title="title"
    :subtitle="subtitle"
    size="sm"
  >
    <form class="space-y-3" autocomplete="off" @submit.prevent="onSubmit">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Código
        <span class="text-error-500" aria-hidden="true">*</span>
      </label>
      <input
        ref="codigoInputRef"
        v-model="codigo"
        type="text"
        name="barcode-capture"
        class="form-control w-full"
        :class="{ 'form-control-error': Boolean(error) }"
        placeholder="Escanea o escribe el código..."
        autocomplete="off"
        @keydown.enter.prevent="onSubmit"
      />
      <p v-if="error" class="text-theme-xs text-error-500">{{ error }}</p>
      <p v-else class="text-theme-xs text-gray-500 dark:text-gray-400">
        La pistola suele enviar Enter al final; no hace falta pulsar Confirmar.
      </p>
    </form>

    <template #footer>
      <button
        type="button"
        class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="!codigo.trim()"
        @click="onSubmit"
      >
        Confirmar
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { AppModal } from '@/shared/components'

withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
  }>(),
  {
    title: 'Escanear código',
    subtitle: 'Apunta la pistola al código o escríbelo y pulsa Enter.',
  },
)

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  captured: [codigo: string]
}>()

const codigo = ref('')
const error = ref('')
const codigoInputRef = ref<HTMLInputElement | null>(null)

function focusInput() {
  void nextTick(() => {
    codigoInputRef.value?.focus()
    codigoInputRef.value?.select()
  })
}

watch(open, (isOpen) => {
  if (!isOpen) {
    codigo.value = ''
    error.value = ''
    return
  }
  focusInput()
})

function onSubmit() {
  const term = codigo.value.trim()
  if (!term) {
    error.value = 'Escanea o escribe un código'
    focusInput()
    return
  }
  emit('captured', term)
  open.value = false
}
</script>
