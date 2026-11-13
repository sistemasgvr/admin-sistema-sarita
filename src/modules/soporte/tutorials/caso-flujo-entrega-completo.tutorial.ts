import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

/**
 * CASO REAL (5 consultas): «me sale pendiente de envío» / «el balón no figura
 * como entregado ni como devuelto».
 *
 * Causa: se genera la orden de salida y ahí se detiene el flujo. La actividad
 * de entrega nunca se crea ni se finaliza, así que el préstamo no se registra
 * y después el recojo tampoco se puede hacer.
 *
 * José pidió explícitamente este flujo el 13/10: «¿tienes los flujos de
 * actividad de cada operación que se realiza en la empresa?».
 */
export function createCasoFlujoEntregaCompletoTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-actividades"]',
      popover: {
        title: '1. El caso',
        description:
          'Hiciste la venta y la orden de salida, pero el balón sigue apareciendo como «pendiente de envío». Esta ruta recorre el flujo completo, de punta a punta, para que nada quede a medias.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '2. Los 5 pasos del flujo',
        description: `Una entrega no termina en la orden de salida. Son cinco pasos:${bulletList([
          ['1. Venta', 'comprobante o VSD en el punto de venta.'],
          ['2. Orden de salida', 'desde el comprobante, autoriza sacar la mercadería.'],
          ['3. Actividad de entrega', 'se asigna a un chofer o responsable.'],
          ['4. Iniciar y verificar', 'el chofer la toma y confirma los cilindros.'],
          ['5. Culminar', 'recién aquí el balón queda como entregado.'],
        ])}<p class="mt-2"><strong>Si te detienes en el paso 2, el balón queda «pendiente de envío» para siempre.</strong></p>`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-filtros"]',
      popover: {
        title: '3. Encuentra lo que quedó a medias',
        description:
          'Filtra por estado <strong>Pendiente</strong> o <strong>En curso</strong> y por tipo <strong>Entrega</strong>. Lo que aparezca aquí de días pasados son entregas que nunca se cerraron: cada una es un balón que el sistema no sabe dónde está.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="actividades-nueva"]',
      popover: {
        title: '4. Si la actividad no existe',
        description:
          'Lo normal es que la entrega se genere desde la guía o la orden de salida, con el cliente y los ítems ya cargados. Si no se creó, puedes hacerla aquí a mano: tipo <strong>Entrega</strong>, el cliente, la dirección y <strong>los cilindros que salieron</strong>. Sin los cilindros, el préstamo no se registra.',
        side: 'bottom',
        align: 'end',
      },
    },
    tableStep('[data-tutorial="actividades-acciones"]', {
      popover: {
        title: '5. Cerrar la entrega',
        description: `En las acciones de la actividad:${bulletList([
          ['Verificar por escaneo', 'escanea los cilindros que se entregaron.'],
          ['Marcar realizada', 'cierra la entrega y registra el préstamo.'],
        ])}<p class="mt-2">Al culminar, el sistema crea <strong>automáticamente</strong> la actividad de recojo con la fecha de devolución pactada.</p>`,
        side: 'left',
        align: 'center',
      },
    }),
    {
      element: '[data-tutorial="actividades-generar-recojos"]',
      popover: {
        title: '6. El retorno',
        description:
          'El recojo sigue el mismo camino en sentido inverso: iniciar → verificar → culminar. Y recuerda: <strong>no cambies el estado del balón a mano</strong> cuando el cliente lo devuelva; el recojo lo hace solo. Ese atajo es la causa número uno de bloqueos.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="actividades-tabla"]',
      popover: {
        title: '7. Por qué importa',
        description:
          'Cada entrega sin cerrar acumula información perdida: no sabes qué cliente tiene qué envase, no puedes cobrar días de préstamo, y el recojo y la recarga quedan bloqueados. Al principio no se nota; a las dos semanas sí.',
        side: 'top',
        align: 'start',
        onNextClick: () => finish('caso-flujo-entrega-completo'),
      },
    },
  ])
}
