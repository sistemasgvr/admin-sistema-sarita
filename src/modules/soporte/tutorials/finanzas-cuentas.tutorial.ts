import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export type FinanzasCuentasTipo = 'COBRAR' | 'PAGAR'

export const finanzasCuentasTutorialId = (tipo: FinanzasCuentasTipo) =>
  tipo === 'COBRAR' ? 'finanzas-cuentas-cobrar' : 'finanzas-cuentas-pagar'

/**
 * Ruta compartida por Cuentas por cobrar (clientes) y Cuentas por pagar (proveedores):
 * la vista es la misma, solo cambia el tercero y el origen de las cuentas.
 */
export function createFinanzasCuentasTutorial(
  tipo: FinanzasCuentasTipo,
  options: TutorialOptions = {},
) {
  const esCobrar = tipo === 'COBRAR'
  const tercero = esCobrar ? 'cliente' : 'proveedor'
  const titulo = esCobrar ? 'Cuentas por cobrar' : 'Cuentas por pagar'
  const tabKey = esCobrar ? 'cobrar' : 'pagar'

  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-finanzas"]',
      popover: {
        title: '1. Finanzas',
        description: esCobrar
          ? 'En el menú Finanzas controlas el dinero pendiente. Las ventas al crédito del POS crean automáticamente una cuenta por cobrar al cliente.'
          : 'En el menú Finanzas controlas el dinero pendiente. Las compras al crédito crean automáticamente una cuenta por pagar al proveedor.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: `[data-tutorial="tab-${tabKey}"]`,
      popover: {
        title: `2. Pestaña ${titulo}`,
        description: esCobrar
          ? 'Cada pestaña es un libro distinto: aquí ves lo que los clientes te deben. Las otras pestañas son garantías, cuentas por pagar y el libro diario.'
          : 'Aquí ves lo que la empresa debe a proveedores y otros terceros. La lógica es la misma que en cuentas por cobrar, pero el dinero sale en lugar de entrar.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="cuentas-resumen"]',
      popover: {
        title: '3. Resumen',
        description: `Cuatro indicadores del estado actual:${bulletList([
          ['Total pendiente', `suma de todos los saldos por ${esCobrar ? 'cobrar' : 'pagar'}.`],
          ['Documentos pendientes', 'cuentas simples y cuotas con saldo.'],
          ['Total vencido', 'lo que ya pasó su fecha de vencimiento (en rojo).'],
          [`${esCobrar ? 'Clientes' : 'Proveedores'} con saldo`, 'cuántos terceros tienen deuda.'],
        ])}`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '4. Buscar',
        description: `Busca por nombre del ${tercero}, su documento (RUC/DNI) o el número del comprobante que originó la cuenta.`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-filtros"]',
      popover: {
        title: '5. Filtros',
        description: `Filtra por ${tercero} o por estado (pendiente, vencida, parcial). Los filtros activos aparecen como chips arriba de la tabla para quitarlos de uno en uno.`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="cuentas-exportar"]',
      popover: {
        title: '6. Exportar',
        description: 'Descarga a Excel el listado con los filtros aplicados, útil para conciliar con contabilidad.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="cuentas-nueva"]',
      popover: {
        title: '7. Cuenta manual',
        description: `Las cuentas de ${esCobrar ? 'ventas' : 'compras'} se crean solas. Este botón es solo para cuentas <strong>externas</strong> (préstamos, aportes, devoluciones esperadas). Pulsa «Siguiente» para ver el formulario.`,
        side: 'bottom',
        align: 'end',
        onNextClick: clickThenNext('[data-tutorial="cuentas-nueva"]'),
      },
    },
    {
      element: '[data-tutorial="cuenta-plan"]',
      popover: {
        title: '8. ¿En cuotas?',
        description:
          'Cuenta simple: un solo saldo con un vencimiento. Plan de cuotas: el sistema genera N cuotas con su propio vencimiento y los pagos se aplican a cada una.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="cuenta-tercero"]',
      popover: {
        title: `9. ${esCobrar ? 'Cliente' : 'Proveedor'}`,
        description: `Elige un ${tercero} registrado o escribe un nombre libre si no está en el sistema. Si escribes uno parecido a otro ya existente, el sistema te lo sugiere para no duplicar saldos.`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="cuenta-fechas-monto"]',
      popover: {
        title: '10. Fechas y monto',
        description:
          'Fecha de emisión, vencimiento (o inicio de la primera cuota) y el monto. En un plan indicas además el número de cuotas y el día del mes de pago.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="cuenta-descripcion"]',
      popover: {
        title: '11. Concepto',
        description: 'Explica el origen de la cuenta: aparecerá en el listado y en el libro diario.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="cuenta-guardar"]',
      popover: {
        title: '12. Guardar',
        description: 'Registra la cuenta. Aparecerá de inmediato en la tabla con estado PENDIENTE.',
        side: 'top',
        align: 'end',
        onNextClick: closeModalThenNext(),
      },
    },
    {
      element: '[data-tutorial="cuentas-tabla"]',
      popover: {
        title: '13. Listado',
        description: `Cada fila muestra el ${tercero}, el comprobante de origen, el vencimiento (y días de atraso), el monto original, lo abonado y el saldo. Las cuentas en plan muestran cuántas cuotas tienen.`,
        side: 'top',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="cuentas-ver"]', {
      popover: {
        title: '14. Ver detalle',
        description:
          'Abre la ficha con el historial de pagos. En un plan de cuotas verás cada cuota con su estado y podrás pagar la que corresponda.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="cuentas-pagar"]', {
      popover: {
        title: `15. Registrar ${esCobrar ? 'cobro' : 'pago'}`,
        description: `Registra un abono total o parcial indicando medio de pago (efectivo, Yape/Plin, transferencia) y fecha. ${
          esCobrar
            ? 'Si es en efectivo, entra a la caja abierta del día.'
            : 'Si es en efectivo, sale de la caja abierta del día.'
        } Solo aparece en cuentas simples con saldo; las cuotas se pagan desde el detalle.`,
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="cuentas-editar"]', {
      popover: {
        title: '16. Editar y eliminar',
        description: `${bulletList([
          ['Editar', 'corrige vencimiento, monto o concepto de cuentas simples; con pagos registrados solo se ajustan algunos campos.'],
          ['Eliminar', 'quita cuentas manuales registradas por error.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish(finanzasCuentasTutorialId(tipo)),
      },
    }),
  ])
}
