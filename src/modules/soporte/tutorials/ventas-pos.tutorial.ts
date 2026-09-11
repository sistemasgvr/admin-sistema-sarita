import {
  MODAL_TRANSITION_MS,
  bulletList,
  runTutorial,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createVentasPosTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-ventas-pos"]',
      popover: {
        title: '1. Punto de venta',
        description:
          'En el menú Ventas ingresa a Punto de venta. Desde una sola pantalla registras cualquier tipo de venta: productos, gas, alquileres y servicios.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="pos-comprobante"]',
      popover: {
        title: '2. Tipo de comprobante',
        description: `Elige qué documento se emitirá:${bulletList([
          ['Boleta (B001)', 'consumidor final; se declara a SUNAT en el resumen diario.'],
          ['Factura (F001)', 'requiere un cliente con RUC; se emite en línea.'],
          ['Venta sin documento (VSD)', 'documento interno con ticket; no va a SUNAT.'],
        ])}La serie y el número se asignan automáticamente.`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="pos-cliente"]',
      popover: {
        title: '3. Cliente',
        description:
          'Busca por nombre o documento. Si no existe puedes crearlo desde aquí con el botón «+». Para boletas al paso usa «Clientes varios».',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="pos-almacen"]',
      popover: {
        title: '4. Almacén',
        description:
          'Almacén del que sale la mercadería. Es obligatorio para vender gas o alquilar, porque descuenta stock y registra qué cilindro se entrega.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="pos-anadir"]',
      popover: {
        title: '5. Añadir ítems',
        description:
          'Cada cosa que se lleva el cliente es un ítem. Pulsa «Siguiente» para ver los tipos disponibles.',
        side: 'left',
        align: 'start',
        onNextClick: clickThenNext('[data-tutorial="pos-anadir"]'),
      },
    },
    {
      element: '[data-tutorial="pos-tipo-accesorio"]',
      popover: {
        title: '6. Producto o accesorio',
        description:
          'Venta de stock: válvulas, reguladores, mascarillas, descartables. Eliges el producto del catálogo, la cantidad y el precio.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="pos-tipo-gas"]',
      popover: {
        title: '7. Gas',
        description: `El ítem principal del negocio. Al elegir el producto de gas defines qué pasa con el cilindro:${bulletList([
          ['Trae su cilindro', 'se recarga el balón registrado del cliente.'],
          ['Cilindro no registrado', 'solo se cobra el gas; el balón no se registra.'],
          ['Le prestamos uno', 'sale un cilindro de la empresa en préstamo, con o sin garantía.'],
          ['Se lo vende', 'se cobra gas + envase y el cilindro pasa a ser del cliente.'],
        ])}`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="pos-tipo-alquiler"]',
      popover: {
        title: '8. Alquiler de accesorio',
        description:
          'Regulador u otro equipo que el cliente devuelve después. Se cobra el alquiler y, si aplica, una garantía reembolsable que no entra al comprobante.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="pos-tipo-servicio"]',
      popover: {
        title: '9. Servicio',
        description:
          'Cobros sin stock: flete, mantenimiento de cilindro u otros servicios. Solo indicas el importe.',
        side: 'top',
        align: 'start',
        onNextClick: closeModalThenNext(MODAL_TRANSITION_MS),
      },
    },
    {
      element: '[data-tutorial="pos-carrito"]',
      popover: {
        title: '10. Carrito',
        description:
          'Resume los ítems añadidos con sus importes. En gas se detalla por separado el gas, el envase vendido o el préstamo con su garantía.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="pos-totales"]',
      popover: {
        title: '11. Totales',
        description:
          'Valor de venta, IGV incluido y total del comprobante. Si hay garantía se muestra aparte con el «Total a cobrar», porque la garantía no se declara a SUNAT.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="pos-pago"]',
      popover: {
        title: '12. Condición y medio de pago',
        description: `${bulletList([
          ['Contado', 'indica el medio (efectivo, Yape/Plin, transferencia) y la cuenta si no es efectivo; entra a caja hoy.'],
          ['Crédito', 'define plazo y cuotas; el cobro se registra después en Cuentas por cobrar.'],
        ])}`,
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="pos-acciones"]',
      popover: {
        title: '13. Guardar y emitir',
        description: `${bulletList([
          ['Guardar venta', 'registra el comprobante, descuenta stock y mueve los cilindros.'],
          ['Emitir SUNAT / Imprimir ticket', 'aparece tras guardar: envía el comprobante a SUNAT o imprime el ticket de la VSD.'],
        ])}Si no emites en unos segundos, la pantalla se limpia para el siguiente cliente y el comprobante queda pendiente en la lista.`,
        side: 'left',
        align: 'start',
        onNextClick: () => finish('ventas-pos'),
      },
    },
  ])
}
