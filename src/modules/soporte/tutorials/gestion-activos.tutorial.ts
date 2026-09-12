import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createGestionActivosTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-activos"]',
      popover: {
        title: '1. Activos',
        description:
          'Inventario de bienes de la empresa: básculas, compresores, computadoras, herramientas, mobiliario. Sirve para saber qué hay, dónde está y quién es responsable.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="activos-resumen"]',
      popover: {
        title: '2. Resumen',
        description: 'Cantidad de activos y valor total registrado.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '3. Buscar y filtrar',
        description: 'Por descripción, marca, modelo o serie. Filtra por estado, tipo de activo o sucursal.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="activos-nuevo"]',
      popover: {
        title: '4. Nuevo activo',
        description: 'Pulsa «Siguiente» para ver el formulario.',
        side: 'bottom',
        align: 'end',
        onNextClick: clickThenNext('[data-tutorial="activos-nuevo"]'),
      },
    },
    {
      element: '[data-tutorial="activo-datos"]',
      popover: {
        title: '5. Datos del activo',
        description: 'Tipo (puedes crear nuevos con «+»), descripción, marca, modelo y número de serie.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="activo-adquisicion"]',
      popover: {
        title: '6. Adquisición',
        description: 'Fecha de compra, importe y sucursal donde se encuentra.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="activo-responsable"]',
      popover: {
        title: '7. Responsable e imagen',
        description: 'Trabajador a cargo del bien y una foto para identificarlo.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="activo-guardar"]',
      popover: {
        title: '8. Guardar',
        description: 'Registra el activo en el inventario.',
        side: 'top',
        align: 'end',
        onNextClick: closeModalThenNext(),
      },
    },
    {
      element: '[data-tutorial="activos-tabla"]',
      popover: {
        title: '9. Listado',
        description: 'Imagen, descripción, sucursal, marca y modelo, serie, fecha de compra, importe y estado.',
        side: 'top',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="activos-ver"]', {
      popover: {
        title: '10. Acciones',
        description: `${bulletList([
          ['Ver', 'ficha del activo.'],
          ['Editar', 'cambia responsable, sucursal o datos.'],
          ['Dar de baja', 'marca el activo como inactivo (vendido, desechado).'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('gestion-activos'),
      },
    }),
  ])
}
