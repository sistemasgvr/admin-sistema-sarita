import {
  TUTORIAL_WAIT_FOR_ELEMENT_MS,
  bulletList,
  runTutorial,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createFinanzasLibroDiarioTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-finanzas"]',
      popover: {
        title: '1. Finanzas',
        description:
          'El libro diario es la vista operativa del dinero: todo lo que entró y salió en un día o en un rango de fechas. No es el Resumen diario de SUNAT.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="tab-libro-diario"]',
      popover: {
        title: '2. Pestaña Libro diario',
        description:
          'Reúne ventas, cobranzas, pagos a proveedores, gastos, depósitos y observaciones en una sola pantalla.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="libro-filtros"]',
      popover: {
        title: '3. Rango de fechas y cliente',
        description:
          'Por defecto muestra el día de hoy. Cambia «Desde» y «Hasta» para revisar un mes completo, o filtra por cliente para ver solo sus movimientos. El botón de Excel exporta lo que estás viendo.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="libro-observacion"]',
      popover: {
        title: '4. Observaciones del día',
        description:
          'Anota hechos relevantes que no son un movimiento de dinero (por ejemplo, «se compraron cilindros a Swiss Gas»). Quedan registrados con fecha y usuario.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="libro-resumen"]',
      waitForElement: TUTORIAL_WAIT_FOR_ELEMENT_MS,
      popover: {
        title: '5. Totales del rango',
        description: `${bulletList([
          ['Contado / Crédito', 'ventas cobradas al momento y ventas que generaron cuenta por cobrar.'],
          ['Cobranzas', 'abonos recibidos de cuentas por cobrar.'],
          ['Pagos a proveedores', 'abonos de cuentas por pagar.'],
          ['Gastos y depósitos', 'salidas de caja y dinero llevado al banco.'],
        ])}`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="libro-secciones"]',
      waitForElement: TUTORIAL_WAIT_FOR_ELEMENT_MS,
      popover: {
        title: '6. Secciones por tipo',
        description:
          'Cada bloque se despliega y muestra sus movimientos con un acceso al documento de origen: la venta abre el comprobante, la cobranza abre la cuenta por cobrar, el pago abre la compra y el depósito lleva a la caja del día.',
        side: 'top',
        align: 'start',
        onNextClick: () => finish('finanzas-libro-diario'),
      },
    },
  ])
}
