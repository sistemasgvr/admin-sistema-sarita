import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

/**
 * CASO REAL (2/11): «quiero renovar desde alquileres y no me deja», resuelto
 * en meet con «te enseño cómo hacerlo correctamente».
 *
 * Puntos que la ruta aclara, verificados en código:
 * - Renovar EMITE un comprobante nuevo solo por el regulador (AlquilerRenovarModal).
 * - Usa el mismo PosPagosField: admite pago en varios medios.
 * - `bal_renovar_alquiler` exige regulador vinculado.
 * - Devolver exige condición BUENO o PARA_REPARAR.
 */
export function createCasoRenovarAlquilerTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-balones-alquileres"]',
      popover: {
        title: '1. El caso',
        description:
          'Se venció el periodo del regulador que tiene un cliente y lo va a seguir usando. Eso <strong>no es un alquiler nuevo</strong>: es una renovación del que ya existe, y se cobra el siguiente periodo.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="lista-filtros"]',
      popover: {
        title: '2. Ver qué está por vencer',
        description: `No persigas los vencimientos uno por uno:${bulletList([
          ['Columna Inicio / Fin', 'la vigencia de cada alquiler en el listado.'],
          ['Filtro Estado', 'para quedarte solo con los que siguen activos.'],
          ['Pestaña «Días de atraso»', 'los ordena por cuánto se pasaron: empieza por ahí.'],
        ])}`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '3. Ubica el alquiler',
        description:
          'Busca por <strong>nombre del cliente</strong> o por el número de alquiler. Importante: trabaja siempre sobre el alquiler existente; crear uno nuevo duplicaría el equipo y dejaría el anterior abierto para siempre.',
        side: 'bottom',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="alquileres-acciones"]', {
      popover: {
        title: '4. «Renovar»',
        description:
          'En las acciones de la fila está <strong>Renovar</strong>. Abre un formulario que ya trae el regulador del alquiler. Si el alquiler no tiene un regulador vinculado, el sistema avisa: «no se puede renovar»; en ese caso corrige primero el alquiler.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="alquileres-acciones"]', {
      popover: {
        title: '5. ⚠️ Renovar emite comprobante',
        description:
          'Esto sorprende a todos: al renovar <strong>se emite una boleta o factura nueva</strong>, solo por el regulador. No es un trámite interno. Por eso te pide tipo de comprobante y medio de pago, igual que una venta.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="alquileres-acciones"]', {
      popover: {
        title: '6. Los campos',
        description: `${bulletList([
          ['Comprobante', 'boleta o factura, según lo que pida el cliente.'],
          ['Monto periodo', 'lo que se cobra por la nueva quincena.'],
          ['Fecha de emisión', 'el día en que cobras.'],
          ['Inicio y fin de periodo', 'vienen propuestos; ajústalos si acordaron otro plazo.'],
        ])}<p class="mt-2">Abajo eliges el medio de pago, y <strong>también aquí puedes partirlo</strong> entre efectivo y Yape con «+ Agregar medio».</p>`,
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="alquileres-acciones"]', {
      popover: {
        title: '7. Si avisa por la caja',
        description:
          'Como se cobra dinero, la renovación necesita la <strong>caja abierta</strong> en esa fecha. Si ves un aviso amarillo en el formulario, abre la caja del día y vuelve a intentar. Es el mismo motivo por el que no se puede cobrar con la caja cerrada.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="alquileres-acciones"]', {
      popover: {
        title: '8. Cuando ya no lo quiere',
        description: `Si en vez de renovar el cliente devuelve el equipo, usa <strong>Devolver regulador</strong>. Te pide en qué condición vuelve:${bulletList([
          ['Bueno', 'regresa al stock y se puede volver a alquilar.'],
          ['Para reparar', 'sale de circulación hasta repararlo.'],
        ])}<p class="mt-2">Sin elegir una de las dos, el sistema no deja cerrar la devolución.</p>`,
        side: 'left',
        align: 'center',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '9. Para que no se acumule',
        description:
          'Un alquiler que ni se renueva ni se devuelve sigue sumando días de atraso y el regulador queda como entregado aunque esté en el almacén. Revisar la pestaña «Días de atraso» una vez por semana evita que se vuelva una lista imposible de ordenar.',
        side: 'bottom',
        align: 'start',
        onNextClick: () => finish('caso-renovar-alquiler'),
      },
    },
  ])
}
