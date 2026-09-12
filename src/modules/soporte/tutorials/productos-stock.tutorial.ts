import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createProductosStockTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-productos-stock"]',
      popover: {
        title: '1. Stock',
        description:
          'Saldo actual de cada producto por almacén. Los ingresos entran por Compras y las salidas por Ventas; aquí solo ajustas o trasladas.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="stock-resumen"]',
      popover: {
        title: '2. Resumen',
        description: 'Ítems en stock, cuántos están bajo el mínimo, cuántos están OK y las unidades totales.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '3. Buscar y escanear',
        description:
          'Busca por almacén, código o nombre del producto, o pulsa el ícono de la pistola y escanea el código de barras para ir directo a su saldo.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-filtros"]',
      popover: {
        title: '4. Filtros',
        description: 'Filtra por almacén o muestra solo los productos bajo el stock mínimo para reponer.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="stock-ajuste"]',
      popover: {
        title: '5. Ajuste',
        description:
          'Corrige el saldo cuando el conteo físico no coincide (merma, rotura, error). Registra un movimiento de ajuste con entrada o salida.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="stock-traslado"]',
      popover: {
        title: '6. Traslado',
        description: 'Mueve unidades de un almacén a otro. Resta en el origen y suma en el destino.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="stock-historial"]',
      popover: {
        title: '7. Historial',
        description: 'Abre Movimientos de inventario con todas las entradas y salidas registradas.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="stock-tabla"]',
      popover: {
        title: '8. Listado',
        description:
          'Almacén y sucursal, producto con su categoría, unidad, saldo actual, stock mínimo y estado. Los saldos bajo el mínimo se marcan en rojo.',
        side: 'top',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="stock-ver"]', {
      popover: {
        title: '9. Ver detalle',
        description: 'Ficha del stock con los últimos movimientos de ese producto en ese almacén.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="stock-acciones"]', {
      popover: {
        title: '10. Acciones',
        description: `${bulletList([
          ['Ver en movimientos', 'historial filtrado por este producto y almacén.'],
          ['Ajuste / Traslado', 'abre el formulario ya prellenado con este producto.'],
          ['Stock mínimo', 'define el umbral de alerta para reponer.'],
          ['Eliminar', 'solo con saldo en cero; se puede restaurar después.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('productos-stock'),
      },
    }),
  ])
}
