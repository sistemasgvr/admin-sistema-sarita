import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createComprasListadoTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-compras"]',
      popover: {
        title: '1. Compras',
        description:
          'Listado de todas las compras registradas: facturas de gas, mercadería, servicios y gastos con comprobante.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '2. Buscar',
        description: 'Por serie y número del comprobante, por la glosa o por el nombre del proveedor.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-filtros"]',
      popover: {
        title: '3. Filtros',
        description: `${bulletList([
          ['Desde / Hasta', 'rango de fechas.'],
          ['Proveedor y almacén', 'compras de un proveedor o que ingresaron a un almacén.'],
          ['Estado', 'activas o anuladas.'],
          ['Pendiente de comprobante', 'el gasto ya está registrado pero la factura aún no llega: esta es la lista de lo que hay que completar.'],
          ['Tipo de registro y categoría', 'mercadería, gasto, activo; y su categoría.'],
        ])}`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compras-exportar"]',
      popover: {
        title: '4. Exportar',
        description: 'Descarga a Excel el listado con los filtros aplicados.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="compras-nueva"]',
      popover: {
        title: '5. Nueva compra',
        description:
          'Abre el formulario de registro. Hay una ruta guiada aparte («Registrar una compra») que explica cada sección.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="compras-tabla"]',
      popover: {
        title: '6. Listado',
        description:
          'Cada fila muestra el comprobante, el proveedor, la categoría, el total y el estado. Debajo aparecen las <strong>dos fechas</strong>: «Gasto» (cuándo salió el dinero) y «Emisión» (la del comprobante). Si falta serie, número o fecha de emisión, la fila lleva la etiqueta <strong>Sin comprobante</strong> como recordatorio de completarla.',
        side: 'top',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="compras-ver"]', {
      popover: {
        title: '7. Ver detalle',
        description:
          'Ficha completa: cabecera, líneas con IGV, movimientos de inventario que generó y la cuenta por pagar asociada si fue a crédito.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="compras-acciones"]', {
      popover: {
        title: '8. Acciones',
        description: `${bulletList([
          ['Editar', 'corrige datos de una compra activa (categoría, condición de pago, glosa, líneas).'],
          ['Anular', 'revierte el ingreso de stock y la cuenta por pagar; la compra queda anulada, no se borra.'],
          ['Crear corrección', 'en una compra anulada, abre el formulario prellenado para registrarla de nuevo bien.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('compras-listado'),
      },
    }),
  ])
}
