import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createGestionTrabajadoresTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-trabajadores"]',
      popover: {
        title: '1. Trabajadores',
        description:
          'Padrón de personal de la empresa (RR.HH.). Desde aquí también se crea el usuario de acceso al sistema y se vincula el chofer si conduce.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="trabajadores-resumen"]',
      popover: {
        title: '2. Resumen',
        description: 'Total de trabajadores, activos y cesados.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '3. Buscar y filtrar',
        description: 'Por nombres o documento; el filtro muestra activos o cesados.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="trabajadores-nuevo"]',
      popover: {
        title: '4. Nuevo trabajador',
        description: 'Pulsa «Siguiente» para ver el formulario.',
        side: 'bottom',
        align: 'end',
        onNextClick: clickThenNext('[data-tutorial="trabajadores-nuevo"]'),
      },
    },
    {
      element: '#seccion-personal',
      popover: {
        title: '5. Datos personales',
        description: 'Documento, nombres y apellidos, fecha de nacimiento, correo y teléfono.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#seccion-direccion',
      popover: {
        title: '6. Dirección',
        description: 'Domicilio con ubigeo y, opcionalmente, ubicación en el mapa.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#seccion-laboral',
      popover: {
        title: '7. Datos laborales',
        description: 'Área y cargo (puedes crearlos con «+»), fecha de inicio y, si corresponde, fecha de cese.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '#seccion-acceso',
      popover: {
        title: '8. Acceso al sistema',
        description:
          'Activa «crear usuario» para darle acceso con un rol. Si además conduce, registra aquí su brevete para que aparezca como chofer.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="trabajador-guardar"]',
      popover: {
        title: '9. Guardar',
        description: 'Registra al trabajador y, si lo activaste, crea su usuario y chofer en un solo paso.',
        side: 'top',
        align: 'end',
        onNextClick: closeModalThenNext(),
      },
    },
    {
      element: '[data-tutorial="trabajadores-tabla"]',
      popover: {
        title: '10. Listado',
        description: 'Trabajador, área y cargo, correo, edad, fecha de inicio, estado y días desde el cese.',
        side: 'top',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="trabajadores-ver"]', {
      popover: {
        title: '11. Acciones',
        description: `${bulletList([
          ['Ver', 'ficha completa del trabajador.'],
          ['Editar', 'actualiza datos personales o laborales.'],
          ['Asignar usuario', 'crea o vincula su acceso al sistema si aún no lo tiene.'],
          ['Dar de baja', 'marca el cese; el usuario queda desactivado.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('gestion-trabajadores'),
      },
    }),
  ])
}
