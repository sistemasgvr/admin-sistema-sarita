import {
  bulletList,
  runTutorial,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

/**
 * CASO REAL (26/10 y 27/10): venta al contado de S/295 pagada con S/200 en
 * efectivo y S/95 por Yape. Se registró todo a un solo medio y la caja cerró
 * descuadrada dos días seguidos.
 *
 * La función de pagos múltiples SÍ existe (`PosPagosField`, payload `pagos[]`),
 * pero no estaba documentada en ninguna ruta. Esta la explica campo por campo,
 * incluyendo los mensajes de validación de `validarPagos`.
 */
export function createCasoPagoMixtoTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-ventas-pos"]',
      popover: {
        title: '1. El caso',
        description:
          'El cliente paga S/295 así: S/200 en efectivo y S/95 por Yape. Si registras todo a un solo medio, <strong>la caja cierra descuadrada</strong>: el arqueo espera S/295 en efectivo y solo hay S/200. Así se registra bien.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="pos-totales"]',
      popover: {
        title: '2. Primero el total',
        description:
          'Arma la venta normal (ítems, cantidades, precios) y mira el <strong>Total</strong>. Ese número es el que los pagos deben sumar exactamente. En el ejemplo: S/295.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="pos-pago"]',
      popover: {
        title: '3. Condición de pago: Contado',
        description:
          'Los pagos múltiples solo aparecen si la condición es <strong>al contado</strong>. Si eliges crédito, no se piden medios aquí: el cobro se registra después en Cuentas por cobrar.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="pos-pago"]',
      popover: {
        title: '4. 👉 «+ Agregar medio»',
        description: `Debajo del medio de pago hay un enlace <strong>«+ Agregar medio»</strong>. Ese es el que casi nadie usa.${bulletList([
          ['Pago 1', 'Efectivo — monto 200.00'],
          ['Pago 2', 'Yape — monto 95.00'],
        ])}<p class="mt-2">Al agregar el segundo, el sistema te propone el saldo que falta; solo confirmas.</p>`,
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="pos-pago"]',
      popover: {
        title: '5. El semáforo: Pendiente / Excedente',
        description: `A la derecha de «+ Agregar medio» aparece un aviso en rojo mientras las cuentas no cuadren:${bulletList([
          ['Pendiente', 'los pagos suman menos que el total: falta registrar.'],
          ['Excedente', 'suman más que el total: corrige un monto.'],
        ])}<p class="mt-2">Cuando desaparece, está cuadrado. <strong>Si no desaparece, el sistema no te deja guardar</strong> y te dice: «Los pagos suman S/ X y el total es S/ Y».</p>`,
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="pos-pago"]',
      popover: {
        title: '6. Datos de cada medio',
        description: `Según el medio que elijas se piden datos distintos:${bulletList([
          ['Efectivo', 'solo el monto.'],
          ['Yape / transferencia', 'la cuenta bancaria de destino y, opcional, el número de operación.'],
        ])}<p class="mt-2">No puedes repetir el mismo medio y cuenta en dos líneas: si el cliente yapeó dos veces a la misma cuenta, súmalo en una sola.</p>`,
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="pos-pago"]',
      popover: {
        title: '7. Efectivo recibido y vuelto',
        description:
          'Si una de las líneas es en efectivo, aparece <strong>«Efectivo recibido»</strong>. Pon lo que el cliente te entregó en la mano (ej. S/250) y el sistema calcula el <strong>Vuelto</strong> (S/50). Es solo una ayuda para el conteo: no cambia el total de la venta ni lo que se declara.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="pos-acciones"]',
      popover: {
        title: '8. Cómo queda en la caja',
        description:
          'Al guardar, cada pago entra por su propio medio: S/200 al efectivo y S/95 a Yape. <strong>El arqueo del cierre solo va a esperar los S/200 en efectivo</strong>, que es lo que realmente tienes en el cajón. Ahí se acaba el descuadre.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="pos-acciones"]',
      popover: {
        title: '9. Si ya lo guardaste mal',
        description: `Tiene arreglo y no hace falta anular. Desde <strong>Comprobantes</strong>, en el detalle del documento, se reparten los medios de pago correctamente. Funciona <strong>aunque ya esté emitido a SUNAT</strong>: cambia el cobro, no el comprobante.${bulletList([
          ['Requisito', 'la caja de la fecha del comprobante debe estar ABIERTA.'],
          ['Si está cerrada', 'reábrela primero (ver la ruta «Registrar algo en una fecha ya cerrada»).'],
        ])}<p class="mt-2">El sistema avisa: «El cambio de medio de pago afecta la caja del DD/MM/AAAA».</p>`,
        side: 'left',
        align: 'start',
        onNextClick: () => finish('caso-pago-mixto'),
      },
    },
  ])
}
