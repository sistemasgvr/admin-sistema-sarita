import {
  TUTORIAL_WAIT_FOR_ELEMENT_MS,
  bulletList,
  runTutorial,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

/**
 * CASO REAL (27/10 y 7/11): «necesito registrar algo de un día anterior» y
 * «no me deja cerrar la caja del día 5».
 *
 * Causa del segundo: al reabrir, `fin_abrir_caja_sesion` REEMPLAZA
 * `monto_inicial` con el monto que se escribe. Se escribió 0 creyendo que
 * «0 = no agregar nada», pero eso borró el fondo de S/160 y el arqueo quedó
 * descuadrado en -0.50.
 *
 * Regla a transmitir: al reabrir hay que volver a escribir el MISMO fondo
 * con el que se abrió ese día.
 */
export function createCasoCajaReabrirTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-ventas-caja"]',
      popover: {
        title: '1. El caso',
        description:
          'Llegó una factura de ayer, o te avisan de un cobro de hace dos días, y la caja de esa fecha ya está cerrada. Esta ruta explica cómo registrarlo en su fecha real sin descuadrar el arqueo.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="caja-estado"]',
      popover: {
        title: '2. Solo una caja abierta a la vez',
        description:
          'El sistema permite <strong>una sola caja abierta por sucursal</strong>. Para reabrir la de un día anterior, primero tienes que cerrar la de hoy. Al terminar, vuelves a abrir la de hoy.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="caja-filtros"]',
      popover: {
        title: '3. Ubica la fecha',
        description:
          'Cambia la fecha a la del día que necesitas corregir. El sistema te muestra esa sesión con su estado y su fondo inicial. <strong>Anota el fondo que ves aquí</strong>: lo vas a necesitar en el paso siguiente.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="caja-acciones"]',
      popover: {
        title: '4. ⚠️ El error que descuadra la caja',
        description: `Al reabrir, el sistema te pide un monto inicial. <strong>Ese monto reemplaza el fondo original</strong>, no se suma ni se ignora.${bulletList([
          ['Si escribes 0', 'borras el fondo del día (ej. S/160) y el arqueo queda mal.'],
          ['Qué escribir', 'el MISMO fondo con el que se abrió ese día.'],
        ])}<p class="mt-2">Es exactamente lo que pasó el 7/11: se puso 0 y la caja quedó en -0.50 y no se podía cerrar.</p>`,
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="caja-arqueo"]',
      popover: {
        title: '5. Verifica el arqueo',
        description:
          'Después de reabrir, revisa que el «efectivo que debería haber» coincida con el fondo correcto. Si ves un número raro o negativo, el fondo se escribió mal: ciérrala, reabre y corrige el monto.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="caja-movimientos"]',
      waitForElement: TUTORIAL_WAIT_FOR_ELEMENT_MS,
      popover: {
        title: '6. Registra y vuelve a cerrar',
        description: `Con la caja abierta en esa fecha, registra el cobro, la venta o el gasto que faltaba. Luego:${bulletList([
          ['Cierra esa caja', 'con el efectivo contado de ese día.'],
          ['Abre la de hoy', 'con su fondo normal, y sigue trabajando.'],
        ])}`,
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="caja-estado"]',
      popover: {
        title: '7. Cuidado con los correlativos',
        description:
          'Si ya emitiste comprobantes <strong>hoy</strong>, no los pases a la fecha anterior: los correlativos de SUNAT quedarían desordenados. Los comprobantes van en la fecha en que se emitieron; lo que se regulariza en la caja anterior son los <strong>cobros y gastos</strong> de ese día.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="caja-estado"]',
      popover: {
        title: '8. La bitácora deja constancia',
        description: `Cada apertura, cierre, reapertura y ajuste queda anotado con su autor y su hora. Si ves estos renglones, significan:${bulletList([
          ['Reapertura', 'alguien volvió a abrir esta caja.'],
          ['Ajuste de fondo', 'se corrigió el fondo inicial.'],
          ['Ajuste por compra', 'se movió la fecha de gasto de una compra y el arqueo se recalculó.'],
        ])}<p class="mt-2">Ante un descuadre, la bitácora es el primer lugar donde mirar: dice qué pasó y quién lo hizo.</p>`,
        side: 'bottom',
        align: 'start',
        onNextClick: () => finish('caso-caja-reabrir'),
      },
    },
  ])
}
