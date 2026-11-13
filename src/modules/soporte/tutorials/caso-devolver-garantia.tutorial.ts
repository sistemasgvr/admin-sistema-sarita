import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

/**
 * CASO REAL (12/10, 13/10, 22/10): «el cliente trajo el balón, ¿dónde le
 * devuelvo su garantía?», «no me permite dar ingreso al regulador»,
 * «mándame lo de las garantías».
 *
 * Campos reales del modal «Devolver garantía»: Monto a devolver, Fecha,
 * Método de reembolso (+ cuenta/operación) y Observaciones.
 * Validaciones de `fin_reembolsar_garantia`: no se puede devolver dos veces
 * y la fecha no puede ser anterior a la de recepción.
 */
export function createCasoDevolverGarantiaTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-finanzas-garantias"]',
      popover: {
        title: '1. El caso',
        description:
          'El cliente dejó un depósito al llevarse el envase y ahora lo devuelve: toca regresarle su dinero. La devolución <strong>no se registra en el balón ni en la venta</strong>, se registra aquí, en Garantías.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '2. Encontrar la garantía',
        description:
          'Busca por <strong>nombre del cliente</strong> o por el <strong>comprobante</strong> con el que se dejó el depósito. Si el cliente tiene varias, se listan todas con su fecha y su monto: fíjate en cuál corresponde al envase que trajo.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-filtros"]',
      popover: {
        title: '3. Filtra por pendientes',
        description: `Para no confundirte con las que ya devolviste, filtra por estado:${bulletList([
          ['Pendiente', 'el dinero sigue en poder de la empresa.'],
          ['Devuelta', 'ya se reembolsó; aparece la fecha.'],
        ])}`,
        side: 'bottom',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="garantias-ver"]', {
      popover: {
        title: '4. Verifica antes de devolver',
        description:
          'Abre el detalle y confirma <strong>a qué comprobante y a qué envase</strong> corresponde. Es el paso que evita devolver la garantía equivocada cuando el cliente tiene varias abiertas.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="garantias-devolver"]', {
      popover: {
        title: '5. «Devolver garantía»',
        description: `Este botón abre el formulario de reembolso. Arriba te muestra, de referencia, el <strong>saldo pendiente</strong> y el <strong>método con el que se recibió</strong> el depósito.`,
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="garantias-devolver"]', {
      popover: {
        title: '6. Los 4 campos',
        description: `${bulletList([
          ['Monto a devolver', 'viene con el saldo; puedes devolver menos si se descuenta algo.'],
          ['Fecha', 'el día en que entregas el dinero.'],
          ['Método de reembolso', 'efectivo, Yape o transferencia (+ cuenta y operación).'],
          ['Observaciones', 'opcional: «entregado en tienda», voucher, etc.'],
        ])}<p class="mt-2">El método de devolución <strong>no tiene que ser el mismo</strong> con el que se recibió.</p>`,
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="garantias-devolver"]', {
      popover: {
        title: '7. Dos reglas que te pueden frenar',
        description: `${bulletList([
          ['Una sola vez', '«Esta garantía ya fue reembolsada el DD/MM/AAAA».'],
          ['Fecha coherente', 'no puede ser anterior al día en que se recibió el depósito.'],
        ])}<p class="mt-2">Si devolviste por error, existe <strong>anular el reembolso</strong> para dejarla otra vez como pendiente.</p>`,
        side: 'left',
        align: 'center',
      },
    }),
    {
      element: '[data-tutorial="garantias-tabla"]',
      popover: {
        title: '8. Efecto en la caja',
        description:
          'Si devuelves en efectivo, <strong>sale dinero de la caja del día</strong> y el arqueo del cierre ya lo considera. Por eso conviene registrar la devolución el mismo día en que entregas el dinero: si lo haces después, el conteo de ese día no va a cuadrar.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="garantias-tabla"]',
      popover: {
        title: '9. Devolución y recojo son distintos',
        description:
          'Son dos registros separados y los dos hacen falta: la <strong>garantía</strong> devuelve el dinero, el <strong>recojo</strong> (en Actividades) devuelve el envase al almacén. Hacer uno no hace el otro. Y recuerda: no cambies el estado del balón a mano.',
        side: 'top',
        align: 'start',
        onNextClick: () => finish('caso-devolver-garantia'),
      },
    },
  ])
}
