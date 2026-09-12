import {
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createConfiguracionServiciosTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-configuracion-servicios"]',
      popover: {
        title: '1. Servicios externos',
        description:
          'Accesos a plataformas de terceros que usa la empresa (portal SUNAT, banca, proveedores web). Es un directorio seguro para no perder usuarios y URLs.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '2. Buscar',
        description: 'Por código, nombre o URL del servicio.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="servicios-nuevo"]',
      popover: {
        title: '3. Nuevo servicio',
        description:
          'Registra código, nombre, usuario, contraseña, correo, URL y una observación. La contraseña se guarda cifrada y solo se puede reemplazar, no ver.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="servicios-tabla"]',
      popover: {
        title: '4. Listado',
        description: 'Código, nombre, usuario, correo, URL y si tiene contraseña configurada.',
        side: 'top',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="servicios-editar"]', {
      popover: {
        title: '5. Editar y eliminar',
        description: 'Actualiza el acceso (por ejemplo al cambiar la contraseña) o desactiva el servicio.',
        side: 'left',
        align: 'center',
        onNextClick: () => finish('configuracion-servicios'),
      },
    }),
  ])
}
