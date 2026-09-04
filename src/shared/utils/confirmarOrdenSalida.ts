import Swal from 'sweetalert2'

const swalOrdenSalida = Swal.mixin({
  customClass: {
    confirmButton:
      'inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 mx-1',
    cancelButton:
      'inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 mx-1',
  },
  buttonsStyling: false,
})

/**
 * Siempre que una venta entrega un cilindro (préstamo, compra de envase o
 * alquiler con entrega) corresponde preguntar si el traslado requiere una
 * orden de salida (documento de salida / GRE) para el envío.
 */
export async function confirmarGenerarOrdenSalida(): Promise<boolean> {
  const result = await swalOrdenSalida.fire({
    title: '¿Es para envío?',
    text: 'Siempre que vas a hacer una entrega debes generar una orden de salida. ¿Quieres generar una?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, es para envío',
    cancelButtonText: 'No, no estoy enviando',
    reverseButtons: true,
  })

  return result.isConfirmed
}
