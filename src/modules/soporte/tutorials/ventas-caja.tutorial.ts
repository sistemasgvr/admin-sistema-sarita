import {
  TUTORIAL_WAIT_FOR_ELEMENT_MS,
  bulletList,
  runTutorial,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createVentasCajaTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-ventas-caja"]',
      popover: {
        title: '1. Caja',
        description:
          'El día de ventas empieza aquí: en el menú Ventas ingresa a Caja. Sin una caja abierta el punto de venta no deja registrar ventas.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="caja-estado"]',
      popover: {
        title: '2. Estado de la caja',
        description:
          'Muestra si la caja está ABIERTA, CERRADA o SIN APERTURA, el fondo inicial y quién la abrió. Desde «Historial» y «Sesiones» revisas días anteriores.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="caja-filtros"]',
      popover: {
        title: '3. Fecha y sucursal',
        description:
          'Cada sucursal maneja su propia caja por día. Selecciona la sucursal antes de abrir; con la fecha puedes consultar cajas de días pasados.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="caja-acciones"]',
      popover: {
        title: '4. Acciones del día',
        description: `Los botones cambian según el estado de la caja:${bulletList([
          ['Abrir caja', 'registra el fondo inicial en efectivo y habilita las ventas.'],
          ['Gasto', 'salidas menudas pagadas con dinero de caja (pasajes, compras pequeñas).'],
          ['Depósito', 'dinero que se retira de la caja para llevarlo al banco.'],
          ['Cerrar caja', 'cuentas el efectivo real y el sistema calcula la diferencia.'],
        ])}`,
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="caja-resumen"]',
      popover: {
        title: '5. Resumen del día',
        description:
          'Totales de ventas, cobranzas, gastos y depósitos de la sesión, separados por medio de pago (efectivo, Yape/Plin, transferencia).',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="caja-arqueo"]',
      popover: {
        title: '6. Dinero que debería haber',
        description:
          'Suma lo que entró (fondo, ventas y cobros en efectivo) y resta lo que salió (depósitos, gastos, devoluciones de garantía). Es el monto contra el que se compara el conteo al cerrar.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="caja-movimientos"]',
      waitForElement: TUTORIAL_WAIT_FOR_ELEMENT_MS,
      popover: {
        title: '7. Gastos y depósitos',
        description:
          'Aquí quedan listados los movimientos registrados en la sesión. Mientras la caja siga abierta puedes anular uno registrado por error; una vez cerrada ya no se modifican.',
        side: 'top',
        align: 'start',
        onNextClick: () => finish('ventas-caja'),
      },
    },
  ])
}
