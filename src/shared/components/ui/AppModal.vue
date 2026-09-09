<template>
  <Teleport to="body">
    <!--
      La duración va explícita: la transición vive en el panel y en el velo, no en
      el contenedor raíz, y sin esto Vue lo desmontaría antes de que la salida se
      vea.
    -->
    <Transition name="app-modal" :duration="{ enter: 340, leave: 220 }">
      <div
        v-if="modelValue"
        class="fixed inset-0 flex items-end justify-center p-2 sm:items-center sm:p-6"
        :style="{ zIndex }"
      >
        <div
          class="app-modal__scrim fixed inset-0 h-full w-full bg-gray-900/25 backdrop-blur-[3px] dark:bg-gray-950/50"
          aria-hidden="true"
          @click="onBackdropClick"
        />

        <div
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          class="app-modal__panel relative flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-theme-lg dark:bg-gray-900 sm:max-h-[calc(100dvh-3rem)] sm:rounded-3xl"
          :class="panelSizeClass"
          @click.stop
        >
          <!--
            Borde de scroll: la línea solo aparece cuando hay contenido oculto
            debajo del encabezado. Sin contenido desplazado no separa nada, y una
            raya permanente es ruido.
          -->
          <div
            v-if="$slots.header || title || subtitle || showCloseButton"
            class="flex shrink-0 items-center gap-3 border-b px-4 py-3 transition-colors duration-200 sm:px-5"
            :class="
              contenidoSobreEncabezado
                ? 'border-gray-100 dark:border-gray-800'
                : 'border-transparent'
            "
          >
            <div class="min-w-0 flex-1">
              <slot name="header">
                <h4
                  v-if="title"
                  :id="titleId"
                  class="text-base font-semibold leading-snug tracking-[-0.01em] text-gray-800 dark:text-white/90 sm:text-lg"
                >
                  {{ title }}
                </h4>
                <p
                  v-if="subtitle"
                  class="mt-0.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm"
                >
                  {{ subtitle }}
                </p>
              </slot>
            </div>

            <button
              v-if="showCloseButton"
              type="button"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition duration-100 hover:bg-gray-200 hover:text-gray-600 active:scale-95 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-gray-300"
              aria-label="Cerrar modal"
              @click="close"
            >
              <AppIcon :name="ICONS.x" :size="18" />
            </button>
          </div>

          <div
            ref="contentScrollRef"
            :class="[
              'custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4',
              contentClass,
            ]"
            @scroll.passive="actualizarBordesScroll"
          >
            <slot />
          </div>

          <div
            v-if="$slots.footer"
            class="shrink-0 border-t px-4 py-2.5 transition-colors duration-200 sm:px-5 sm:py-3"
            :class="
              contenidoBajoPie ? 'border-gray-100 dark:border-gray-800' : 'border-transparent'
            "
          >
            <div
              class="flex flex-row gap-2 sm:justify-end sm:gap-2.5 [&_button]:min-h-9 [&_button]:min-w-0 [&_button]:flex-1 [&_button]:px-3 [&_button]:py-2 [&_button]:text-sm sm:[&_button]:min-h-0 sm:[&_button]:flex-none sm:[&_button]:px-3.5 sm:[&_button]:py-2 sm:[&_button]:w-auto"
            >
              <slot name="footer" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useId, watch } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

interface AppModalProps {
  title?: string
  subtitle?: string
  size?: ModalSize
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
  contentClass?: string
  /** z-index del overlay. Default 99999. Súbelo cuando este modal se abra encima de otro. */
  zIndex?: number
}

const props = withDefaults(defineProps<AppModalProps>(), {
  size: 'md',
  showCloseButton: true,
  closeOnBackdrop: true,
  contentClass: '',
  zIndex: 99999,
})

const modelValue = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  close: []
}>()

const titleId = useId()
const contentScrollRef = ref<HTMLElement | null>(null)

/**
 * Bordes de scroll en vez de divisores fijos: la línea del encabezado y la del
 * pie solo se dibujan cuando hay contenido oculto de ese lado. Así la separación
 * aparece cuando de verdad separa algo y el modal se lee más limpio en reposo.
 */
const contenidoSobreEncabezado = ref(false)
const contenidoBajoPie = ref(false)
let observadorContenido: ResizeObserver | null = null

function actualizarBordesScroll() {
  const el = contentScrollRef.value
  if (!el) return
  contenidoSobreEncabezado.value = el.scrollTop > 1
  contenidoBajoPie.value = el.scrollTop + el.clientHeight < el.scrollHeight - 1
}

/** El alto del contenido cambia solo (paneles condicionales, listas que cargan). */
function observarContenido() {
  desconectarObservador()
  const el = contentScrollRef.value
  if (!el || typeof ResizeObserver === 'undefined') return
  observadorContenido = new ResizeObserver(() => actualizarBordesScroll())
  observadorContenido.observe(el)
  if (el.firstElementChild) observadorContenido.observe(el.firstElementChild)
}

function desconectarObservador() {
  observadorContenido?.disconnect()
  observadorContenido = null
}

const panelSizeClass = computed(() => {
  const sizes: Record<ModalSize, string> = {
    sm: 'max-w-md',
    md: 'max-w-[700px]',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }

  return sizes[props.size]
})

const close = () => {
  modelValue.value = false
  emit('close')
}

const onBackdropClick = () => {
  if (props.closeOnBackdrop) {
    close()
  }
}

watch(modelValue, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''

  if (isOpen) {
    nextTick(() => {
      contentScrollRef.value?.scrollTo({ top: 0 })
      actualizarBordesScroll()
      observarContenido()
    })
    return
  }

  desconectarObservador()
})

onUnmounted(() => {
  document.body.style.overflow = ''
  desconectarObservador()
})
</script>

<style scoped>
/*
 * El panel se materializa: escala, desenfoque y opacidad viajan juntos, con una
 * curva sin rebote (equivalente a un muelle críticamente amortiguado, respuesta
 * ~0.34 s). La salida recorre el mismo camino a la inversa y algo más rápido,
 * para que cerrar se sienta como deshacer lo que se abrió.
 */
.app-modal-enter-active .app-modal__panel {
  transition:
    transform 340ms cubic-bezier(0.32, 0.72, 0, 1),
    opacity 200ms ease-out,
    filter 260ms ease-out;
  will-change: transform, opacity;
}

.app-modal-leave-active .app-modal__panel {
  transition:
    transform 220ms cubic-bezier(0.4, 0, 0.68, 0.28),
    opacity 180ms ease-in,
    filter 180ms ease-in;
  will-change: transform, opacity;
}

.app-modal-enter-from .app-modal__panel,
.app-modal-leave-to .app-modal__panel {
  opacity: 0;
  filter: blur(6px);
  transform: translateY(12px) scale(0.985);
}

.app-modal-enter-active .app-modal__scrim {
  transition: opacity 240ms ease-out;
}

.app-modal-leave-active .app-modal__scrim {
  transition: opacity 200ms ease-in;
}

.app-modal-enter-from .app-modal__scrim,
.app-modal-leave-to .app-modal__scrim {
  opacity: 0;
}

/* Sin transparencias: el velo se vuelve sólido en vez de desenfocar el fondo. */
@media (prefers-reduced-transparency: reduce) {
  .app-modal__scrim {
    backdrop-filter: none;
    background-color: rgb(31 41 55 / 0.6);
  }
}

/* Sin movimiento: se mantiene el cambio de opacidad, que sigue explicando qué pasó. */
@media (prefers-reduced-motion: reduce) {
  .app-modal-enter-active .app-modal__panel,
  .app-modal-leave-active .app-modal__panel {
    transition: opacity 160ms ease;
  }

  .app-modal-enter-from .app-modal__panel,
  .app-modal-leave-to .app-modal__panel {
    filter: none;
    transform: none;
  }
}
</style>
