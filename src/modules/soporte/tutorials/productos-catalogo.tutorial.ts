import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createProductosCatalogoTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-productos-articulos"]',
      popover: {
        title: '1. Catálogo',
        description:
          'En Almacenes › Catálogo viven todos los ítems que vendes o compras: gases, accesorios con stock y servicios (flete, mantenimiento, alquiler de regulador).',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="productos-resumen"]',
      popover: {
        title: '2. Resumen',
        description: 'Cuántos ítems hay en total y cómo se reparten entre accesorios, gases y servicios.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '3. Buscar',
        description: 'Por código, código de ubicación, nombre o marca.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-filtros"]',
      popover: {
        title: '4. Filtros',
        description: 'Categoría y subcategoría para acotar el listado.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="productos-estado"]',
      popover: {
        title: '5. Activos / inactivos',
        description:
          'Por defecto se muestran los activos. Cambia a «Inactivos» para encontrar productos eliminados y restaurarlos.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="productos-imprimir"]',
      popover: {
        title: '6. Imprimir ubicación',
        description:
          'Genera etiquetas con el código de ubicación para pegar en las estanterías del almacén.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="productos-nuevo"]',
      popover: {
        title: '7. Nuevo producto',
        description:
          'Abre el formulario de creación. La ruta «Crear un producto» explica cada campo.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="productos-tabla"]',
      popover: {
        title: '8. Listado',
        description: `Cada fila muestra imagen, código, ubicación, nombre, categoría, tipo, unidad de medida, precios y estado.${bulletList([
          ['Tipo', 'servicio, taller, gas o accesorio con stock (íconos).'],
          ['Precios', 'de venta (azul) y de compra (gris).'],
        ])}`,
        side: 'top',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="productos-ver"]', {
      popover: {
        title: '9. Ver detalle',
        description: 'Ficha completa del producto con sus imágenes y stock por almacén.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="productos-acciones"]', {
      popover: {
        title: '10. Acciones',
        description: `${bulletList([
          ['Editar', 'cambia nombre, precios, categoría o características.'],
          ['Eliminar', 'lo desactiva; deja de aparecer en el POS y en compras.'],
          ['Restaurar', 'reactiva un producto eliminado (visible en «Inactivos»).'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('productos-catalogo'),
      },
    }),
  ])
}
