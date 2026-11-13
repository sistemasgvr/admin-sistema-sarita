import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

/**
 * CASO REAL (12/10, 16/10, 17/10, 10/11): «no me deja registrar gastos»,
 * «habilítale el permiso a mi compañera», «si uno no viene el otro queda
 * incapacitado en el sistema».
 *
 * Los permisos se repartieron por responsabilidad (Clara: kardex e
 * inventario; José: compras, ventas, finanzas y gastos), y cada ausencia
 * genera una consulta. Esta ruta enseña a identificar que es un permiso
 * —y no un error— y a quién pedírselo.
 */
export function createCasoPermisosBloqueoTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-usuarios"]',
      popover: {
        title: '1. El caso',
        description:
          'Intentas registrar un gasto, emitir un comprobante o abrir una caja y el sistema no te deja —o el botón simplemente no aparece. Antes de reportarlo como falla, conviene descartar que sea un <strong>permiso</strong>.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '2. Cómo reconocer un permiso',
        description: `Son dos síntomas distintos:${bulletList([
          ['No veo el botón', 'casi siempre es permiso: el sistema oculta lo que no te toca.'],
          ['Veo el botón y da error', 'puede ser permiso o una regla del negocio; lee el mensaje.'],
        ])}<p class="mt-2">Si a tu compañero sí le funciona en la misma pantalla, es permiso.</p>`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '3. Cómo están repartidos hoy',
        description: `Los accesos se dividieron por responsabilidad:${bulletList([
          ['Kardex, inventario y cilindros', 'perfil de almacén.'],
          ['Compras, ventas, finanzas y gastos', 'perfil administrativo.'],
          ['Abrir caja de días anteriores y aprobar bajas', 'solo administrador.'],
        ])}<p class="mt-2">Es a propósito: cada quien responde por lo que registra.</p>`,
        side: 'bottom',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="usuarios-editar"]', {
      popover: {
        title: '4. Quién lo cambia',
        description:
          'Desde aquí el administrador ajusta el rol o los permisos de un usuario. <strong>El equipo administrativo no puede dárselos a sí mismo</strong>: lo autoriza el administrador de la empresa. Es la razón por la que estos cambios se piden y no se hacen solos.',
        side: 'left',
        align: 'center',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '5. Si tu compañero no vino',
        description: `Para que una ausencia no detenga la operación, hay dos caminos:${bulletList([
          ['Permiso temporal', 'el administrador habilita lo que falta ese día.'],
          ['Permiso permanente', 'si el caso se repite, conviene dejar a dos personas habilitadas.'],
        ])}<p class="mt-2">Lo segundo evita la llamada cada vez que alguien falta.</p>`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '6. Qué informar al pedirlo',
        description:
          'Para que te lo resuelvan de una: <strong>tu usuario</strong>, <strong>la pantalla</strong> donde estás y <strong>qué querías hacer</strong>. Con eso se habilita el permiso exacto; sin eso hay que ir averiguando. Después del cambio, actualiza la página con F5.',
        side: 'bottom',
        align: 'start',
        onNextClick: () => finish('caso-permisos-bloqueo'),
      },
    },
  ])
}
