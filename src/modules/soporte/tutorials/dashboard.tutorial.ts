import {
  TUTORIAL_WAIT_FOR_ELEMENT_MS,
  bulletList,
  runTutorial,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createDashboardTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-dashboard"]',
      popover: {
        title: '1. Dashboard',
        description:
          'Resumen del negocio en una pantalla: dinero, deudas, envases en campo, ventas contra compras y alertas. Es la primera pantalla al entrar.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="dashboard-filtros"]',
      popover: {
        title: '2. Filtros generales',
        description:
          'Cliente, sucursal y rango de fechas. Se aplican a todas las pestañas del dashboard; «Limpiar» vuelve a la vista completa.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="tabs"]',
      popover: {
        title: '3. Pestañas',
        description: `${bulletList([
          ['Panel principal', 'indicadores económicos y operativos.'],
          ['Gestión de clientes', 'deudas, clientes nuevos y frecuencia de compra.'],
          ['Analítica de productos', 'qué se vende más y rotación de stock.'],
          ['Control de cilindros', 'estado de los envases, préstamos y P.H.'],
        ])}`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="dashboard-economico"]',
      waitForElement: TUTORIAL_WAIT_FOR_ELEMENT_MS,
      popover: {
        title: '4. Resumen económico',
        description:
          'Ventas, cobranzas, compras, gastos y saldo del periodo. Pasa el cursor sobre una tarjeta para ver el detalle que la compone.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="dashboard-eficiencia"]',
      waitForElement: TUTORIAL_WAIT_FOR_ELEMENT_MS,
      popover: {
        title: '5. Eficiencia de deudas',
        description:
          'Porcentaje cobrado de las cuentas por cobrar y pagado de las cuentas por pagar. Clic en un medidor para ir a Finanzas.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="dashboard-envases"]',
      waitForElement: TUTORIAL_WAIT_FOR_ELEMENT_MS,
      popover: {
        title: '6. Envases en campo',
        description: 'Cilindros de la empresa en poder de clientes, cilindros de clientes en la empresa y el balance neto.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="dashboard-acciones"]',
      waitForElement: TUTORIAL_WAIT_FOR_ELEMENT_MS,
      popover: {
        title: '7. Acciones rápidas',
        description: 'Atajos a las tareas más frecuentes: abrir caja, nueva venta, registrar compra, nuevo cliente.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="dashboard-graficos"]',
      waitForElement: TUTORIAL_WAIT_FOR_ELEMENT_MS,
      popover: {
        title: '8. Gráficos',
        description:
          'Comparativo mensual de ventas contra compras y demanda por tipo de gas. Clic en una barra abre el listado de ese mes o producto.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="dashboard-alertas"]',
      waitForElement: TUTORIAL_WAIT_FOR_ELEMENT_MS,
      popover: {
        title: '9. Alertas',
        description: 'Los clientes con mayor deuda y los productos con stock crítico, con acceso directo a cada uno.',
        side: 'top',
        align: 'start',
        onNextClick: () => finish('dashboard'),
      },
    },
  ])
}
