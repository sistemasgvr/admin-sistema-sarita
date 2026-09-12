import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createSistemaUsuariosTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-usuarios"]',
      popover: {
        title: '1. Usuarios',
        description:
          'Cuentas que pueden iniciar sesión en el sistema. Cada usuario tiene uno o más roles, y los roles definen qué puede ver y hacer.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '2. Buscar y filtrar',
        description: 'Por nombre o correo; el filtro muestra usuarios activos o desactivados.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="usuarios-nuevo"]',
      popover: {
        title: '3. Nuevo usuario',
        description: 'Pulsa «Siguiente» para ver el formulario.',
        side: 'bottom',
        align: 'end',
        onNextClick: clickThenNext('[data-tutorial="usuarios-nuevo"]'),
      },
    },
    {
      element: '[data-tutorial="usuario-datos"]',
      popover: {
        title: '4. Datos de acceso',
        description:
          'Nombre, correo (es el usuario para iniciar sesión) y contraseña. Al editar, deja la contraseña vacía para no cambiarla.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="usuario-trabajador"]',
      popover: {
        title: '5. Trabajador vinculado',
        description: 'Relaciona la cuenta con un trabajador del padrón para que sus acciones queden asociadas a la persona.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="usuario-roles"]',
      popover: {
        title: '6. Roles',
        description:
          'Marca los roles del usuario. Sus permisos son la suma de los permisos de todos sus roles. Si no marcas ninguno, podrá iniciar sesión pero no verá módulos.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="usuario-guardar"]',
      popover: {
        title: '7. Guardar',
        description: 'Crea el usuario; puede iniciar sesión de inmediato con su correo y contraseña.',
        side: 'top',
        align: 'end',
        onNextClick: closeModalThenNext(),
      },
    },
    {
      element: '[data-tutorial="usuarios-tabla"]',
      popover: {
        title: '8. Listado',
        description: 'Nombre, correo, estado, roles asignados y fecha de creación.',
        side: 'top',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="usuarios-editar"]', {
      popover: {
        title: '9. Acciones',
        description: `${bulletList([
          ['Editar', 'cambia nombre, correo, contraseña o roles.'],
          ['Desactivar', 'bloquea el inicio de sesión sin borrar el historial. No puedes desactivarte a ti mismo.'],
          ['Activar', 'en usuarios desactivados, les devuelve el acceso.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('sistema-usuarios'),
      },
    }),
  ])
}
