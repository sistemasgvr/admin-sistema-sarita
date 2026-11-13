import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

/**
 * CASO REAL (17/10, 7/11, 9/11): «quiero cambiar esta boleta a factura»,
 * «le puse mal el cilindro», «ya estaba emitido pero no a SUNAT».
 *
 * Regla clave: antes de emitir a SUNAT se corrige; después solo con nota de
 * crédito. Y el cilindro NO se puede cambiar desde la corrección del
 * comprobante (regla de negocio: mantiene el orden de garantías, préstamos y
 * movimientos del envase).
 */
export function createCasoCorregirComprobanteTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-ventas-comprobantes"]',
      popover: {
        title: '1. El caso',
        description:
          'Registraste un comprobante y te diste cuenta de un error: el cliente equivocado, el monto, o el cliente ahora pide factura en vez de boleta. Lo que puedes hacer depende de <strong>una sola cosa</strong>: si ya se envió a SUNAT o no.',
        side: 'right',
        align: 'start',
      },
    }),
    tableStep('[data-tutorial="comprobantes-estado"]', {
      popover: {
        title: '2. La pregunta que decide todo',
        description: `Filtra por estado SUNAT y mira en qué situación está:${bulletList([
          ['Pendiente / Por emitir', 'todavía se puede corregir. Es el caso fácil.'],
          ['Aceptado', 'ya es un documento oficial: solo nota de crédito.'],
          ['Rechazado', 'se corrige y se reemite, pero con un correlativo nuevo.'],
        ])}`,
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="comprobantes-acciones"]', {
      popover: {
        title: '3. Si NO está emitido',
        description:
          'Usa <strong>Editar</strong> y corrige el cliente, los montos, la glosa o el tipo de comprobante. Guarda y recién entonces emite a SUNAT. Es la razón por la que el sistema separa «registrar» de «emitir»: te da esa ventana para revisar.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="comprobantes-acciones"]', {
      popover: {
        title: '4. ⚠️ El cilindro no se cambia aquí',
        description:
          'Aunque el comprobante esté sin emitir, <strong>no puedes agregar ni cambiar el cilindro</strong> desde la corrección. Es a propósito: el envase arrastra garantía, préstamo y movimientos de almacén. Si el cilindro está mal, hay que anular el comprobante y volver a registrarlo con el envase correcto.',
        side: 'left',
        align: 'center',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '5. Si YA está aceptado por SUNAT',
        description: `El documento es oficial y no se edita. El camino es:${bulletList([
          ['Nota de crédito', 'anula o corrige el comprobante aceptado.'],
          ['Nuevo comprobante', 'emite el correcto, con la fecha real.'],
        ])}<p class="mt-2">Hay una ruta aparte, «Notas de crédito», que explica este flujo paso a paso.</p>`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-filtros"]',
      popover: {
        title: '6. Si SUNAT lo rechazó',
        description:
          'Un rechazo <strong>consume el correlativo</strong>: ese número queda usado con su constancia de rechazo. Corriges el dato y reemites, pero sale con el número siguiente. Por eso a veces ves un salto en la numeración; está sustentado y no afecta la validez ni duplica la venta.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '7. Regla para recordar',
        description:
          '<strong>Revisa antes de emitir, no después.</strong> Antes de enviar a SUNAT, verifica cliente, montos, cilindro y glosa. Corregir antes toma un minuto; corregir después implica nota de crédito, reemisión y explicarle al cliente.',
        side: 'bottom',
        align: 'start',
        onNextClick: () => finish('caso-corregir-comprobante'),
      },
    },
  ])
}
