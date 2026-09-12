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
          ['Almacén y sucursal', 'a dónde entra el stock si la compra tiene productos.'],
          ['Moneda y condición de pago', 'contado, crédito a N días o plan de cuotas.'],
        ])}Si eliges crédito o cuotas, abajo aparece la previsualización de los vencimientos y se crea automáticamente la cuenta por pagar.`,
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-recarga-externa"]',
      popover: {
        title: '7. Recarga externa',
        description:
          'Solo para facturas de gas de una planta externa. Al activarlo vinculas la factura a una orden de recarga: el gas entra al stock cuando retornan los cilindros, con las cantidades de esta factura.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-detalle"]',
      popover: {
        title: '8. Detalle de productos',
        description:
          'Las líneas de la factura: producto, cantidad, precio unitario y si el precio incluye IGV. El sistema calcula subtotal, IGV y total; los productos con control de stock generan el ingreso al almacén al guardar.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-agregar-producto"]',
      popover: {
        title: '9. Agregar producto',
        description:
          'Busca el producto por nombre o código, o escanea su código de barras. Si no existe, créalo aquí mismo con el botón «+».',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-guardar"]',
      popover: {
        title: '10. Registrar compra',
        description:
          'Guarda la compra. Según la condición de pago: al contado sale de la caja abierta del día; a crédito queda como cuenta por pagar en Finanzas.',
        side: 'top',
        align: 'end',
        onNextClick: () => finish('compras-registrar'),
      },
    },
  ])
}
