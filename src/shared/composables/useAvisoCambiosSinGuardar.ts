import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

/**
 * Aviso al salir de un formulario con cambios sin guardar.
 *
 * Antes ningún formulario avisaba: un clic en el menú lateral borraba una
 * compra o una orden de salida a medio llenar (ver
 * docs/RESPUESTA-REVISION-PREVENTIVA.md §3).
 *
 * Uso en una vista:
 *   const { marcarGuardado } = useAvisoCambiosSinGuardar()
 *   <div ref="contenedorAvisoCambios"> <MiForm @saved="marcarGuardado" /> </div>
 *
 * El formulario se considera «con cambios» desde que el usuario escribe o
 * cambia un campo dentro de ese elemento (eventos `input`/`change`). Así no
 * hay que exponer el estado interno de cada formulario hijo. Después de
 * guardar, `marcarGuardado()` lo limpia; `permitirSalida()` lo limpia justo
 * antes de una navegación que ya fue confirmada por otro medio.
 */

// ── Confirmación compartida (la dibuja AppSalidaSinGuardarDialog en App.vue) ──
const dialogoAbierto = ref(false)
let resolverPendiente: ((salir: boolean) => void) | null = null

function pedirConfirmacion(): Promise<boolean> {
  // Si ya hay una pregunta abierta, la anterior se da por cancelada.
  resolverPendiente?.(false)
  dialogoAbierto.value = true
  return new Promise((resolve) => {
    resolverPendiente = resolve
  })
}

function responder(salir: boolean) {
  const resolver = resolverPendiente
  resolverPendiente = null
  dialogoAbierto.value = false
  resolver?.(salir)
}

export function useDialogoSalidaSinGuardar() {
  return {
    abierto: dialogoAbierto,
    salir: () => responder(true),
    quedarse: () => responder(false),
  }
}

// ── Composable para las vistas ──
/** Nombre del `ref` de plantilla que delimita el formulario vigilado. */
const REF_CONTENEDOR = 'contenedorAvisoCambios'

export function useAvisoCambiosSinGuardar(
  options: {
    /** Si es `false`, no se pregunta (p. ej. una vista que guarda cada cambio al momento). */
    habilitado?: Ref<boolean>
    /** Fuente explícita de «hay cambios» (p. ej. el carrito del POS tiene ítems). */
    sucio?: Ref<boolean>
  } = {},
) {
  const contenedor = useTemplateRef<HTMLElement>(REF_CONTENEDOR)
  const cambiosEnCampos = ref(false)
  const hayCambios = computed(() => {
    if (options.habilitado && !options.habilitado.value) return false
    return cambiosEnCampos.value || Boolean(options.sucio?.value)
  })

  const marcarCambio = (event: Event) => {
    // Los buscadores de los filtros y combos no son datos del formulario.
    const target = event.target as HTMLElement | null
    if (target?.closest('[data-sin-aviso-cambios]')) return
    cambiosEnCampos.value = true
  }

  const marcarGuardado = () => {
    cambiosEnCampos.value = false
  }

  const alSalirDeLaPagina = (event: BeforeUnloadEvent) => {
    if (!hayCambios.value) return
    event.preventDefault()
    // Requerido por algunos navegadores para mostrar el diálogo nativo.
    event.returnValue = ''
  }

  watch(contenedor, (nuevo, anterior) => {
    anterior?.removeEventListener('input', marcarCambio, true)
    anterior?.removeEventListener('change', marcarCambio, true)
    nuevo?.addEventListener('input', marcarCambio, true)
    nuevo?.addEventListener('change', marcarCambio, true)
  })

  onMounted(() => window.addEventListener('beforeunload', alSalirDeLaPagina))
  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', alSalirDeLaPagina)
    contenedor.value?.removeEventListener('input', marcarCambio, true)
    contenedor.value?.removeEventListener('change', marcarCambio, true)
  })

  onBeforeRouteLeave(async () => {
    if (!hayCambios.value) return true
    const salir = await pedirConfirmacion()
    if (salir) cambiosEnCampos.value = false
    return salir
  })

  return {
    hayCambios,
    marcarGuardado,
    permitirSalida: marcarGuardado,
  }
}
