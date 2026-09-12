import {
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createConfiguracionSucursalesTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-configuracion-sucursales"]',
      popover: {
        title: '1. Sucursales',
        description:
          'Cada local de la empresa es una sucursal. Cada una tiene su propia caja diaria y sus almacenes; los comprobantes indican desde qué sucursal se emitieron.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '2. Buscar',
        description: 'Por código, nombre o dirección.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="sucursales-nuevo"]',
      popover: {
        title: '3. Nueva sucursal',
        description: 'Pulsa «Siguiente» para ver el formulario.',
        side: 'bottom',
        align: 'end',
        onNextClick: clickThenNext('[data-tutorial="sucursales-nuevo"]'),
      },
    },
    {
      element: '[data-tutorial="sucursal-codigo-nombre"]',
      popover: {
        title: '4. Código y nombre',
        description: 'Código corto único (SUC-001) y el nombre con el que verás la sucursal en cajas, almacenes y reportes.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="sucursal-direccion"]',
      popover: {
        title: '5. Dirección',
        description: 'Dirección del local; se usa como punto de partida en las guías de remisión.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="sucursal-ubigeo"]',
      popover: {
        title: '6. Ubigeo',
        description: 'País, departamento, provincia y distrito. SUNAT exige el ubigeo del punto de partida en las guías electrónicas.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="sucursal-guardar"]',
      popover: {
        title: '7. Guardar',
        description: 'Crea la sucursal. Luego asígnale al menos un almacén en Configuración › Almacenes.',
        side: 'top',
        align: 'end',
        onNextClick: closeModalThenNext(),
      },
    },
    {
      element: '[data-tutorial="sucursales-tabla"]',
      popover: {
        title: '8. Listado',
        description: 'Código, nombre, dirección y teléfono de cada sucursal.',
        side: 'top',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="sucursales-editar"]', {
      popover: {
        title: '9. Editar y eliminar',
        description: 'Edita los datos o desactiva la sucursal. No se puede eliminar si tiene cajas o almacenes con movimientos.',
        side: 'left',
        align: 'center',
        onNextClick: () => finish('configuracion-sucursales'),
      },
    }),
  ])
}
