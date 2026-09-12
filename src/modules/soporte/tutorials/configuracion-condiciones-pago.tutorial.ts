import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createConfiguracionCondicionesPagoTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-configuracion-condiciones-pago"]',
      popover: {
        title: '1. Condiciones de pago',
        description:
          'Definen cómo se cobra una venta o se paga una compra: al contado, a crédito con N días o en cuotas mensuales. Se eligen en el POS y en Compras.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '2. Buscar',
        description: 'Por código o nombre de la condición.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="condiciones-nuevo"]',
      popover: {
        title: '3. Nueva condición',
        description: 'Pulsa «Siguiente» para ver el formulario.',
        side: 'bottom',
        align: 'end',
        onNextClick: clickThenNext('[data-tutorial="condiciones-nuevo"]'),
      },
    },
    {
      element: '[data-tutorial="condicion-codigo"]',
      popover: {
        title: '4. Código y nombre',
        description: 'Código corto (CONTADO, CRED30, CUOTAS3) y el nombre que verá el vendedor.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="condicion-modalidad"]',
      popover: {
        title: '5. Modalidad',
        description: `${bulletList([
          ['Contado', 'se cobra al momento; no genera cuenta por cobrar.'],
          ['Crédito', 'un solo vencimiento a N días; crea una cuenta por cobrar/pagar.'],
          ['Cuotas', 'reparte el total en N cuotas mensuales en un día fijo del mes.'],
        ])}Según la modalidad aparecen los campos de días de crédito, cantidad de cuotas y día de cobro.`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="condicion-guardar"]',
      popover: {
        title: '6. Guardar',
        description: 'Crea la condición. Queda disponible de inmediato en el POS y en el registro de compras.',
        side: 'top',
        align: 'end',
        onNextClick: closeModalThenNext(),
      },
    },
    {
      element: '[data-tutorial="condiciones-tabla"]',
      popover: {
        title: '7. Listado',
        description: 'Código, nombre, modalidad, días de crédito, número de cuotas y día de cobro.',
        side: 'top',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="condiciones-editar"]', {
      popover: {
        title: '8. Editar y eliminar',
        description: 'Ajusta plazos o desactiva una condición. Las ventas ya registradas conservan la condición con la que se emitieron.',
        side: 'left',
        align: 'center',
        onNextClick: () => finish('configuracion-condiciones-pago'),
      },
    }),
  ])
}
