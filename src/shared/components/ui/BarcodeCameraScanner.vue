<template>
  <AppModal
    v-model="open"
    title="Escanear con cámara"
    subtitle="Apunta la cámara al código de barras."
    size="sm"
  >
    <div class="space-y-3">
      <div
        ref="viewportRef"
        class="relative overflow-hidden rounded-xl bg-black"
        style="min-height: 260px;"
      />
      <p v-if="error" class="text-sm text-error-600 dark:text-error-400">{{ error }}</p>
      <p v-else-if="scanning" class="text-theme-xs text-gray-500 dark:text-gray-400">
        Buscando código...
      </p>
      <p v-else class="text-theme-xs text-gray-500 dark:text-gray-400">
        Iniciando cámara...
      </p>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        @click="open = false"
      >
        Cerrar
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue'
import Quagga from 'quagga'
import AppModal from '@/shared/components/ui/AppModal.vue'

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  detected: [codigo: string]
}>()

const viewportRef = ref<HTMLDivElement | null>(null)
const error = ref('')
const scanning = ref(false)

let detectedHandler: ((data: any) => void) | null = null

function stop() {
  try {
    if (detectedHandler) {
      Quagga.offDetected?.(detectedHandler)
    }
  } catch {
    // ignore
  }
  try {
    Quagga.stop()
  } catch {
    // ignore
  }
  detectedHandler = null
  scanning.value = false
  if (viewportRef.value) {
    viewportRef.value.innerHTML = ''
  }
}

function start() {
  error.value = ''
  scanning.value = false
  if (!viewportRef.value) return

  viewportRef.value.innerHTML = ''

  Quagga.init(
    {
      inputStream: {
        name: 'Live',
        type: 'LiveStream',
        target: viewportRef.value,
        constraints: { facingMode: 'environment' },
      },
      decoder: {
        readers: [
          'code_128_reader',
          'ean_reader',
          'ean_8_reader',
          'code_39_reader',
          'code_39_vin_reader',
          'codabar_reader',
          'upc_reader',
          'upc_e_reader',
          'i2of5_reader',
        ],
      },
      locator: { patchSize: 'medium', halfSample: true },
    },
    (err: any) => {
      if (err) {
        error.value = `No se pudo acceder a la cámara: ${err?.message || err}`
        return
      }

      detectedHandler = (data: any) => {
        const code = data?.codeResult?.code
        if (!code) return
        stop()
        emit('detected', String(code).trim())
        open.value = false
      }

      Quagga.onDetected(detectedHandler)
      try {
        Quagga.start()
        scanning.value = true
      } catch (e: any) {
        error.value = `No se pudo iniciar el escaneo: ${e?.message || e}`
      }
    },
  )
}

watch(open, (isOpen) => {
  if (isOpen) {
    void nextTick(() => start())
  } else {
    stop()
  }
})

onUnmounted(() => {
  stop()
})
</script>