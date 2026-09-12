import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createSistemaRolesTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-roles"]',
      popover: {
        title: '1. Roles',
        description:
          'Un rol agrupa permisos (Vendedor, Almacenero, Administrador…). En lugar de dar permisos uno por uno a cada usuario, le asignas roles.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '2. Buscar',
        description: 'Por nombre o descripción del rol.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="roles-nuevo"]',
      popover: {
        title: '3. Nuevo rol',
        description: 'Pulsa «Siguiente» para ver el formulario.',
        side: 'bottom',
        align: 'end',
        onNextClick: clickThenNext('[data-tutorial="roles-nuevo"]'),
      },
    },
    {
      element: '[data-tutorial="rol-nombre"]',
      popover: {
        title: '4. Nombre y descripción',
        description: 'Nombre corto del rol y una descripción de a quién está destinado.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="rol-guardar"]',
      popover: {
        title: '5. Guardar',
        description: 'Crea el rol vacío. El siguiente paso es asignarle permisos.',
        side: 'top',
        align: 'end',
        onNextClick: closeModalThenNext(),
      },
    },
    {
      element: '[data-tutorial="roles-tabla"]',
      popover: {
        title: '6. Listado',
        description: 'Nombre, descripción, cuántos permisos tiene y cuántos usuarios lo usan.',
        side: 'top',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="roles-permisos"]', {
      popover: {
        title: '7. Permisos del rol',
        description:
          'Abre la lista de permisos agrupados por módulo. Marca los que corresponden (ver, crear, editar, eliminar…) y guarda. Los cambios aplican a todos los usuarios con ese rol en su próximo inicio de sesión.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="roles-editar"]', {
      popover: {
        title: '8. Editar y eliminar',
        description: `${bulletList([
          ['Editar', 'cambia nombre o descripción.'],
          ['Eliminar', 'desactiva el rol; los usuarios que lo tenían pierden esos permisos.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('sistema-roles'),
      },
    }),
  ])
}
