<template>
  <div>
    <div class="flex items-start gap-2">
      <div class="flex-1">
        <AppInput
          v-model="localValue"
          :label="label"
          :placeholder="placeholder ?? placeholderPorDefecto"
          :required="required"
          :maxlength="maxLength"
          :sanitize="sanitizeInput"
          :help="helpText"
          v-bind="inputAttrs"
          :disabled="disabled"
          :error="error"
          @focusout="emit('focusout', $event)"
        />
      </div>

      <div class="shrink-0">
        <span v-if="label" class="invisible mb-1.5 block text-sm font-medium">&nbsp;</span>
        <button
          type="button"
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-white-200 dark:hover:bg-white/[0.03]"
          :disabled="disabled || isConsultando"
          title="Consultar RENIEC / SUNAT"
          @click="handleConsultar"
        >
          <AppIcon
            v-if="isConsultando"
            :name="ICONS.loader"
            :size="18"
            class="animate-spin text-gray-500 dark:text-gray-400"
          />
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" viewBox="0 0 275 304" fill="none">
            <path
              d="M211.863 200.619C213.211 193.045 214.694 185.513 215.918 177.929C218.863 159.659 209.147 143.162 191.25 139.064C176.494 135.682 161.221 134.613 146.185 132.424C132.519 130.422 118.396 129.872 105.341 125.836C85.3393 119.642 70.4699 107.161 68.1161 84.2842C66.9652 73.1311 69.8374 62.9117 77.3965 54.9022C93.7279 37.6071 110.65 20.8722 127.417 3.98174C132.985 -1.62076 141.727 -1.16426 147.367 4.42786C164.238 21.1731 181.316 37.7212 198.155 54.4976C209.313 65.6092 220.096 77.0944 231.233 88.2164C241.675 98.6536 252.635 108.572 262.796 119.269C267.255 123.937 273.363 127.538 274.368 135.174C275.727 145.372 268.074 149.823 262.33 155.405C250.779 166.631 238.968 177.587 227.23 188.626C222.554 193.025 217.794 197.341 213.077 201.698L211.863 200.619Z"
              fill="#AD0C41"
            />
            <path
              d="M62.9415 101.278C61.7698 107.379 60.5255 112.12 60.0382 116.945C59.302 123.628 58.9524 130.348 58.9909 137.072C59.2501 153.485 73.1136 162.916 86.2513 166.496C104.262 171.393 122.751 172.16 141.28 172.731C157.352 173.229 172.429 177.503 185.93 186.364C199.181 195.058 206.544 207.985 207.321 223.371C207.809 232.916 203.205 242.192 196.631 249.579C189.009 258.128 180.942 266.282 172.896 274.437C164.186 283.277 155.289 291.971 146.413 300.644C142.898 304.078 132.653 304.525 129.086 301.08C119.443 291.743 110.007 282.166 100.519 272.653C92.7839 264.913 85.09 257.132 77.3753 249.371C65.876 237.803 54.4388 226.183 42.8876 214.677C32.0104 203.835 20.988 193.17 10.0901 182.359C7.32136 179.706 4.73689 176.867 2.3547 173.862C0.713797 171.667 -0.114062 168.969 0.0126584 166.231C0.139379 163.493 1.21281 160.883 3.04943 158.849C7.88144 153.413 13.2112 148.412 18.4787 143.39C32.8918 129.644 47.3982 115.99 62.9311 101.278H62.9415Z"
              fill="#0063AD"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { AppInput } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { toastInfo, toastSuccess, toastWarning } from '@/shared/composables/useToast'
import { ApiError } from '@/shared/api/errors/api.error'
import {
  inferirTipoDocumentoPorNumero,
  maxLengthDocumento,
  placeholderNumeroDocumento,
  sanitizeNumeroDocumento,
} from '@/shared/validation/documento'
import { consultasService } from '@/modules/consultas/services/consultas.service'
import type {
  ConsultaDniData,
  ConsultaRucData,
} from '@/modules/consultas/interfaces/consulta.interface'

interface ConsultaDocumentoInputProps {
  modelValue: string | null | undefined
  tipoDocumento?: string | null
  label?: string
  placeholder?: string
  help?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  error?: string
  inputAttrs?: Record<string, unknown>
}

const props = withDefaults(defineProps<ConsultaDocumentoInputProps>(), {
  inputAttrs: () => ({}),
})

const helpText = computed(
  () =>
    props.help?.trim() ||
    props.hint?.trim() ||
    'Busca automáticamente en RENIEC (DNI) o SUNAT (RUC) según el tipo de documento.',
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  focusout: [event: FocusEvent]
  'antes-de-consultar': []
  'dni-encontrado': [data: ConsultaDniData]
  'ruc-encontrado': [data: ConsultaRucData]
  'consulta-sin-resultado': []
}>()

const isConsultando = ref(false)

const tipoNormalizado = computed(() => props.tipoDocumento?.trim().toUpperCase() || '')
const sinTipoExplicito = computed(() => !tipoNormalizado.value)

const tipoParaConsulta = computed(() => {
  if (tipoNormalizado.value === 'DNI' || tipoNormalizado.value === 'RUC') {
    return tipoNormalizado.value
  }
  if (tipoNormalizado.value) return tipoNormalizado.value
  return inferirTipoDocumentoPorNumero(props.modelValue)
})

const localValue = computed({
  get: () => props.modelValue ?? '',
  set: (value: string) => emit('update:modelValue', value),
})

const maxLength = computed(() =>
  sinTipoExplicito.value ? 11 : maxLengthDocumento(tipoNormalizado.value),
)
const placeholderPorDefecto = computed(() =>
  sinTipoExplicito.value ? '8 u 11 dígitos' : placeholderNumeroDocumento(tipoNormalizado.value),
)
const sanitizeInput = (raw: string) =>
  sinTipoExplicito.value
    ? raw.replace(/\D/g, '').slice(0, 11)
    : sanitizeNumeroDocumento(tipoNormalizado.value, raw)
const dniEncontrado = (data: ConsultaDniData | null | undefined) =>
  Boolean(data) && data?.success !== false && Boolean(data?.nombres)

const rucEncontrado = (data: ConsultaRucData | null | undefined) =>
  Boolean(data) && Boolean(data?.razonSocial)
const mensajeErrorConsulta = (error: unknown, tipo: string) => {
  const servicio = tipo === 'DNI' ? 'RENIEC' : 'SUNAT'

  if (error instanceof ApiError) {
    if (error.statusCode === 404) {
      return `No se encontraron datos en ${servicio} para el número ingresado. Verifica que sea correcto.`
    }
    if (error.statusCode === 400 || error.statusCode === 422) {
      return `El número de documento ingresado no es válido para consultar en ${servicio}.`
    }
    if (error.statusCode >= 500) {
      return `El servicio de ${servicio} no está disponible en este momento. Intenta nuevamente en unos minutos.`
    }
  }

  return `No se pudo completar la consulta en ${servicio}. Verifica el número e inténtalo de nuevo.`
}

const handleConsultar = async () => {
  const numero = String(props.modelValue ?? '').trim()

  if (!numero) {
    toastWarning('Ingresa un número de documento para consultar')
    return
  }

  const tipo = tipoParaConsulta.value
  if (!tipo) {
    toastWarning(
      sinTipoExplicito.value
        ? 'Ingresa un DNI (8 dígitos) o RUC (11 dígitos)'
        : 'Selecciona primero el tipo de documento',
    )
    return
  }

  if (tipo !== 'DNI' && tipo !== 'RUC') {
    toastInfo('La consulta automática solo está disponible para DNI o RUC')
    return
  }

  emit('antes-de-consultar')

  isConsultando.value = true
  try {
    if (tipo === 'DNI') {
      const data = await consultasService.consultarDni(numero)
      if (!dniEncontrado(data)) {
        toastWarning('No se encontró en RENIEC. Puedes escribir el nombre a mano.')
        emit('consulta-sin-resultado')
        return
      }
      if (data.dni) localValue.value = data.dni
      emit('dni-encontrado', data)
      toastSuccess('Datos de RENIEC cargados')
    } else {
      const data = await consultasService.consultarRuc(numero)
      if (!rucEncontrado(data)) {
        toastWarning('No se encontró en SUNAT. Puedes escribir el nombre a mano.')
        emit('consulta-sin-resultado')
        return
      }
      if (data.ruc) localValue.value = data.ruc
      emit('ruc-encontrado', data)
      toastSuccess('Datos de SUNAT cargados')
    }
  } catch (error) {
    toastWarning(mensajeErrorConsulta(error, tipo))
    emit('consulta-sin-resultado')
  } finally {
    isConsultando.value = false
  }
}
</script>
