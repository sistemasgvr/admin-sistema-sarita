import { onBeforeUnmount, readonly, ref } from 'vue'

/** Segundos que el POS espera antes de limpiarse solo tras guardar una venta. */
export const SEGUNDOS_AUTO_LIMPIEZA = 10

/**
 * Cuenta regresiva para emitir en caliente después de guardar una venta.
 *
 * En el mostrador la venta se guarda y, acto seguido, se emite o se imprime.
 * Cuando no se emite, el POS se quedaba con la venta anterior en pantalla y el
 * siguiente cliente empezaba sobre datos viejos. Este contador da una ventana
 * corta para pulsar Emitir y, si nadie lo hace, limpia el POS.
 *
 * La venta NO se pierde: ya está guardada en la base cuando arranca el
 * contador. Limpiar solo vacía la pantalla; el comprobante se puede emitir
 * después desde la lista de comprobantes.
 */
export function usePosAutoLimpieza(limpiar: () => void | Promise<void>) {
  const segundosRestantes = ref<number | null>(null)
  let intervalo: ReturnType<typeof setInterval> | null = null

  function detener() {
    if (intervalo !== null) {
      clearInterval(intervalo)
      intervalo = null
    }
    segundosRestantes.value = null
  }

  function iniciar(segundos = SEGUNDOS_AUTO_LIMPIEZA) {
    detener()
    segundosRestantes.value = segundos
    intervalo = setInterval(() => {
      const actual = segundosRestantes.value
      if (actual === null) return
      if (actual <= 1) {
        detener()
        void limpiar()
        return
      }
      segundosRestantes.value = actual - 1
    }, 1000)
  }

  // Si el panel se desmonta (por ejemplo, al navegar a la orden de salida) el
  // intervalo tiene que morir con él: limpiar un formulario que ya no está en
  // pantalla dispararía peticiones sueltas sin que nadie las vea.
  onBeforeUnmount(detener)

  return {
    segundosRestantes: readonly(segundosRestantes),
    iniciarAutoLimpieza: iniciar,
    detenerAutoLimpieza: detener,
  }
}
