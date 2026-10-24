import {
  bulletList,
  runTutorial,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createComprasRegistrarTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-compras"]',
      popover: {
        title: '1. Compras',
        description:
          'En Gastos y Compras › Compras registras las facturas de proveedores: gas de planta, productos para el almacén, servicios o cualquier gasto con comprobante.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="compra-comprobante"]',
      popover: {
        title: '2. Comprobante',
        description:
          'Los datos del documento que te entregó el proveedor. Si no entregó comprobante, igual puedes registrar la compra y quedará marcada como «sin comprobante».',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-proveedor"]',
      popover: {
        title: '3. Proveedor',
        description:
          'Busca al proveedor por nombre o RUC. Si todavía no existe, créalo con el botón «+» sin salir del formulario.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-documento"]',
      popover: {
        title: '4. Fecha, tipo, serie y número',
        description:
          'Fecha de emisión, tipo de comprobante según el catálogo SUNAT (factura, boleta, recibo por honorarios…), y la serie y número tal como figuran en el documento. El sistema evita duplicar el mismo comprobante del mismo proveedor.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-declarar-sunat"]',
      popover: {
        title: '5. Declarar SUNAT',
        description:
          'Activo para compras con comprobante válido que van al registro de compras y dan derecho a crédito fiscal. Desactívalo en compras informales o sin comprobante.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-clasificacion"]',
      popover: {
        title: '6. Clasificación',
        description: `${bulletList([
          ['Tipo registro', 'compra de mercadería, gasto o activo.'],
          ['Categoría de gasto', 'para los reportes (combustible, mantenimiento, planilla…).'],
          ['Almacén y sucursal', 'a dónde entra el stock y de qué caja sale un pago al contado.'],
          ['Moneda', 'en la que está emitido el comprobante.'],
        ])}`,
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-pago"]',
      popover: {
        title: '7. Pago',
        description: `${bulletList([
          ['Contado', 'indica el medio de pago (y la cuenta o Nº de operación si aplica). El pago sale de la caja de la sucursal en la fecha de la compra; si es efectivo, Yape o Plin esa caja debe estar abierta.'],
          ['Crédito o cuotas', 'aparece la previsualización de los vencimientos y se crea la cuenta por pagar; cada pago sale de la caja cuando lo registras.'],
        ])}No registres la misma compra además como gasto de caja: se duplicaría la salida.`,
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-recarga-externa"]',
      popover: {
        title: '8. Recarga externa',
        description:
          'Solo para facturas de gas de una planta externa. Al activarlo vinculas la factura a una orden de recarga: el gas entra al stock cuando retornan los cilindros, con las cantidades de esta factura.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-detalle"]',
      popover: {
        title: '9. Detalle de productos',
        description:
          'Las líneas de la factura: producto, cantidad, precio unitario y si el precio incluye IGV. El sistema calcula subtotal, IGV y total; los productos con control de stock generan el ingreso al almacén al guardar.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-agregar-producto"]',
      popover: {
        title: '10. Agregar producto',
        description:
          'Busca el producto por nombre o código, o escanea su código de barras. Si no existe, créalo aquí mismo con el botón «+».',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-guardar"]',
      popover: {
        title: '11. Registrar compra',
        description:
          'Guarda la compra. Al contado queda como pago a proveedor en la caja de la sucursal (Ventas › Caja y libro diario); a crédito queda como cuenta por pagar en Finanzas.',
        side: 'top',
        align: 'end',
        onNextClick: () => finish('compras-registrar'),
      },
    },
  ])
}
