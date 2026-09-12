import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createProductosCategoriasTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-productos-categorias"]',
      popover: {
        title: '1. Categorías',
        description:
          'Las categorías agrupan los productos del catálogo (Gases, Accesorios, Servicios…). Sirven para filtrar listados y armar reportes.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '2. Buscar',
        description: 'Por nombre o descripción de la categoría.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="categorias-estado"]',
      popover: {
        title: '3. Activas / inactivas',
        description: 'Cambia a «Inactivas» para ver categorías eliminadas y restaurarlas.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="categorias-nuevo"]',
      popover: {
        title: '4. Nueva categoría',
        description: 'Pulsa «Siguiente» para ver el formulario.',
        side: 'bottom',
        align: 'end',
        onNextClick: clickThenNext('[data-tutorial="categorias-nuevo"]'),
      },
    },
    {
      element: '[data-tutorial="categoria-nombre"]',
      popover: {
        title: '5. Nombre',
        description: 'Nombre corto y único, por ejemplo «Gases» o «Accesorios».',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="categoria-descripcion"]',
      popover: {
        title: '6. Descripción',
        description: 'Opcional: aclara qué productos van en esta categoría.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="categoria-guardar"]',
      popover: {
        title: '7. Crear categoría',
        description: 'Guarda y queda disponible al crear o editar productos.',
        side: 'top',
        align: 'end',
        onNextClick: closeModalThenNext(),
      },
    },
    {
      element: '[data-tutorial="categorias-tabla"]',
      popover: {
        title: '8. Listado',
        description: 'Nombre, descripción, subcategorías que contiene y cantidad de productos asociados.',
        side: 'top',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="categorias-subcategorias"]', {
      popover: {
        title: '9. Subcategorías',
        description:
          'Pulsa las etiquetas para administrar las subcategorías de esa categoría sin salir de esta pantalla.',
        side: 'bottom',
        align: 'start',
      },
    }),
    tableStep('[data-tutorial="categorias-ver"]', {
      popover: {
        title: '10. Ver detalle',
        description: 'Ficha de la categoría con sus subcategorías y totales.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="categorias-acciones"]', {
      popover: {
        title: '11. Acciones',
        description: `${bulletList([
          ['Editar', 'cambia nombre o descripción.'],
          ['Eliminar', 'la desactiva; los productos conservan la referencia.'],
          ['Restaurar', 'reactiva una categoría inactiva.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('productos-categorias'),
      },
    }),
  ])
}
