import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

/**
 * CASO REAL (8 consultas entre el 10/11 y el 12/11): «no puedo hacer el recojo
 * de este balón».
 *
 * Causa: al devolver el cliente el envase, el usuario entra al libro de
 * cilindros y lo cambia a DISPONIBLE. `age_iniciar_recojo` exige que el balón
 * siga en EN_PODER_CLIENTE o PRESTADO_CLIENTE, así que el recojo queda
 * bloqueado y hay que corregir el estado a mano.
 *
 * Esta ruta enseña el orden correcto: primero cerrar el recojo, el sistema
 * libera el envase solo.
 */
export function createCasoRecojoBloqueadoTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-balones-cilindros"]',
      popover: {
        title: '1. El caso',
        description:
          'El cliente devolvió el balón, lo marcaste como DISPONIBLE en el libro de cilindros y ahora el recojo no se puede iniciar. Esta ruta explica por qué pasa y cuál es el orden correcto.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="cilindros-resumen"]',
      popover: {
        title: '2. Qué espera el sistema',
        description:
          'Para cerrar un recojo, el sistema necesita que el balón <strong>siga marcado como que lo tiene el cliente</strong>. Esa es la prueba de que había algo que recoger. Si ya lo pusiste DISPONIBLE, el recojo se queda sin respaldo y se bloquea.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '3. Revisa antes de tocar el estado',
        description:
          'Busca el código del balón (o escanéalo con la pistola) y abre su ficha. Si tiene un <strong>recojo pendiente</strong>, no cambies el estado a mano: el recojo lo va a cambiar él solo al cerrarse.',
        side: 'bottom',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="cilindros-acciones"]', {
      popover: {
        title: '4. El error más común',
        description: `Desde «Editar» puedes cambiar el estado del balón. Es útil para corregir datos, <strong>pero no para registrar una devolución</strong>.${bulletList([
          ['Lo que parece lógico', 'el cliente lo trajo → lo pongo DISPONIBLE.'],
          ['Lo que pasa en realidad', 'el recojo pierde su respaldo y se bloquea.'],
          ['Lo correcto', 'cierra el recojo y el sistema lo pone DISPONIBLE solo.'],
        ])}`,
        side: 'left',
        align: 'center',
      },
    }),
    {
      element: '[data-tutorial="cilindros-resumen"]',
      popover: {
        title: '5. El orden correcto',
        description: `Cuando el cliente devuelve un envase:${bulletList([
          ['1. Actividades', 'abre la actividad de RECOJO de ese balón.'],
          ['2. Iniciar recojo', 'el responsable asignado la pone en ruta.'],
          ['3. Verificar', 'escanea o marca los cilindros recibidos.'],
          ['4. Culminar', 'el sistema cierra el préstamo y libera el envase.'],
        ])}<p class="mt-2">No tienes que tocar el estado en ningún momento.</p>`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="cilindros-resumen"]',
      popover: {
        title: '6. Si ya cambiaste el estado',
        description:
          'Se arregla: vuelve a «Editar» y regresa el balón al estado <strong>EN PODER DEL CLIENTE</strong>. Con eso el recojo se desbloquea y puedes cerrarlo con el flujo normal. Si no te deja o no sabes qué estado tenía, revisa el historial en la ficha del cilindro antes de pedir apoyo.',
        side: 'bottom',
        align: 'start',
        onNextClick: () => finish('caso-recojo-bloqueado'),
      },
    },
  ])
}
