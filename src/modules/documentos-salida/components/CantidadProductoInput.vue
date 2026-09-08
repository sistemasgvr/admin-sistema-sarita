<template>
  <div class="min-w-0">
    <!--
      La unidad va en un addon pegado al campo, no flotando encima: superpuesta
      chocaba con las flechas del input numérico y quedaba ilegible. Las flechas
      se ocultan (abajo, en el style) porque en cantidades con decimales no
      sirven de nada.
    -->
    <div
      class="flex items-stretch overflow-hidden rounded-lg border transition"
      :class="
        excede
          ? 'border-error-400 ring-1 ring-error-500/20'
          : 'border-gray-300 focus-within:border-brand-400 focus-within:ring-1 focus-within:ring-brand-500/20 dark:border-gray-700'
      "
    >
      <input
        ref="campo"
        :value="modelo"
        type="number"
        min="0"
        step="0.0001"
        :max="tope ?? undefined"
        placeholder="0"
        inputmode="decimal"
        :disabled="disabled || readonly"
        class="w-full min-w-0 bg-transparent px-3 py-2 text-sm font-medium tabular-nums text-gray-800 placeholder:font-normal placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:text-gray-400 dark:text-white/90"
        @input="onInput"
        @focusin="emit('focus')"
        @blur="emit('commit')"
        @keyup.enter="salirDelCampo"
      />
      <span
        v-if="unidad"
        class="flex shrink-0 items-center border-l border-gray-200 bg-gray-50 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-white/[0.04] dark:text-gray-400"
      >
        {{ unidad }}
      </span>
    </div>

    <!--
      Los dos techos de la cantidad en una sola línea: no se puede sacar más de
      lo que hay en el almacén, ni más de lo que cabe en los cilindros de la
      orden. El campo recorta al menor de los dos.
    -->
    <p
      v-if="pistas.length"
      class="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] leading-tight"
      :class="excede ? 'text-error-600 dark:text-error-400' : 'text-gray-400'"
    >
      <span v-for="(pista, i) in pistas" :key="pista">
        <span v-if="i > 0" class="mr-1.5 text-gray-300 dark:text-gray-600">·</span>
        <span :class="pista === pistaCritica ? 'font-semibold text-error-600 dark:text-error-400' : ''">
          {{ pista }}
        </span>
      </span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Stock del producto en el almacén de la orden. null = desconocido. */
    stock?: number | null
    /** Suma de capacidades de los balones que cargan este gas. null = no aplica. */
    capacidad?: number | null
    unidad?: string
    disabled?: boolean
    readonly?: boolean
  }>(),
  {
    stock: null,
    capacidad: null,
    unidad: undefined,
    disabled: false,
    readonly: false,
  },
)

const emit = defineEmits<{
  focus: []
  commit: []
}>()

// El input nativo escribe strings: la cantidad se normaliza al leerla.
const modelo = defineModel<number | string>({ default: '' })

const campo = ref<HTMLInputElement | null>(null)

/**
 * Recorta al tope mientras se teclea: el atributo `max` del HTML no impide
 * escribir de más. Solo aquí, no en un watcher: si el tope baja después (se
 * quitó un balón), el valor debe quedarse en rojo a la vista en vez de
 * corregirse solo por detrás.
 *
 * Se guarda el texto tal cual, sin convertir a número, para no romper el tecleo
 * de decimales ("1." se volvería 1 y borraría el punto).
 */
function onInput(evento: Event) {
  const campoHtml = evento.target as HTMLInputElement
  let texto = campoHtml.value

  if (texto !== '' && tope.value != null) {
    const n = Number(texto)
    if (Number.isFinite(n) && n > tope.value) {
      texto = String(tope.value)
      campoHtml.value = texto
    }
  }

  modelo.value = texto
}

/**
 * Enter sale del campo en vez de emitir `commit` por su cuenta: así el guardado
 * tiene un solo camino (el blur) y no se dispara dos veces al pulsar Enter y
 * luego mover el foco.
 */
function salirDelCampo() {
  campo.value?.blur()
}

const cantidad = computed(() => {
  const n = Number(modelo.value)
  return Number.isFinite(n) ? n : 0
})

/** El menor de los dos techos. */
const tope = computed(() => {
  const topes = [props.stock, props.capacidad].filter(
    (valor): valor is number => valor != null && Number.isFinite(valor),
  )
  if (!topes.length) return null
  return Math.min(...topes)
})

const excede = computed(() => tope.value != null && cantidad.value > tope.value)

function formatCantidad(valor: number) {
  return String(Number(valor.toFixed(4)))
}

const sinStock = computed(() => props.stock != null && props.stock <= 0)

const pistas = computed(() => {
  const items: string[] = []
  if (sinStock.value) {
    items.push('Sin stock aquí')
  } else if (props.stock != null) {
    items.push(`Stock ${formatCantidad(props.stock)}`)
  }
  if (props.capacidad != null) items.push(`Cabe ${formatCantidad(props.capacidad)}`)
  if (tope.value != null && tope.value > 0 && items.length > 1) {
    items.push(`máx ${formatCantidad(tope.value)}`)
  }
  return items
})

/** La pista que manda: la que fija el tope, resaltada cuando el valor se pasa. */
const pistaCritica = computed(() => {
  if (!excede.value || tope.value == null) return null
  if (props.stock != null && props.stock === tope.value) {
    return sinStock.value ? 'Sin stock aquí' : `Stock ${formatCantidad(props.stock)}`
  }
  if (props.capacidad != null && props.capacidad === tope.value) {
    return `Cabe ${formatCantidad(props.capacidad)}`
  }
  return null
})
</script>

<style scoped>
/* Las flechas del input numérico no aportan nada con decimales y le robaban
   sitio al addon de la unidad. */
input[type='number'] {
  -moz-appearance: textfield;
  appearance: textfield;
}

input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  margin: 0;
  -webkit-appearance: none;
  appearance: none;
}
</style>
