import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createInventarioDocumentosSalidaTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-inventario-documentos-salida"]',
      popover: {
        title: '1. Documentos de salida',
        description:
          'Órdenes de salida de mercadería o cilindros del almacén: entregas a clientes, envíos a planta para recarga y traslados. Pueden convertirse en guía de remisión electrónica (GRE).',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '2. Buscar',
        description: 'Por número, serie de la guía o nombre del cliente.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-filtros"]',
      popover: {
        title: '3. Filtros',
        description: `${bulletList([
          ['Tipo', 'entrega, recarga en planta, traslado.'],
          ['Estado', 'borrador, generado, en retorno, cerrado, anulado.'],
          ['Almacén y cliente', 'de dónde salió y a quién.'],
          ['Emitido SUNAT', 'si ya tiene GRE aceptada.'],
        ])}`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="docsalida-nuevo"]',
      popover: {
        title: '4. Nuevo documento',
        description:
          'Crea una orden de salida: eliges tipo, almacén, destinatario y los productos o cilindros que salen. Las ventas del POS con orden de salida también aparecen aquí.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="docsalida-tabla"]',
      popover: {
        title: '5. Listado',
        description:
          'Número, tipo, estado del ciclo, estado SUNAT, fecha, cliente o destinatario, almacén y cantidad de ítems.',
        side: 'top',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="docsalida-ver"]', {
      popover: {
        title: '6. Ver / editar',
        description: 'Abre el documento con su detalle; en borrador aún puedes modificar las líneas.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="docsalida-acciones"]', {
      popover: {
        title: '7. Acciones',
        description: `${bulletList([
          ['Generar', 'confirma el borrador y descuenta el stock.'],
          ['Registrar retorno', 'en recargas: cilindros que vuelven de planta, con pesaje.'],
          ['Datos de traslado / Dirección', 'transportista, vehículo y punto de llegada para la guía.'],
          ['Convertir a GRE / Emitir a SUNAT', 'genera y envía la guía de remisión electrónica.'],
          ['Descargar PDF', 'imprime el documento.'],
          ['Anular', 'revierte la salida si no fue emitida.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('inventario-documentos-salida'),
      },
    }),
  ])
}
