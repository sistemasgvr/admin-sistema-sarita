import { bulletList, runTutorial, type TutorialOptions } from '@/modules/soporte/tutorials/tutorial-base'

export function createBalonesMantenimientosTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-balones-mantenimientos"]',
      popover: {
        title: '1. Mantenimientos',
        description:
          'Taller: prueba hidrostática, recertificación, cambio de válvula, pintado… tanto de cilindros propios como de los que trae un cliente. Desde el listado pulsa «Nuevo».',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="mantenimiento-item"]',
      popover: {
        title: '2. Tipo de ítem',
        description: `${bulletList([
          ['Cilindro', 'un envase del libro; si es de un cliente y no existe, regístralo desde aquí.'],
          ['Regulador / accesorio', 'un producto que entra a reparación.'],
        ])}`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="mantenimiento-servicio"]',
      popover: {
        title: '3. Datos del servicio',
        description:
          'Tipo de mantenimiento, estado (en proceso, finalizado), fecha de ingreso, costo y descripción del trabajo. Mientras está en taller el cilindro no se puede vender ni prestar.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="mantenimiento-ph"]',
      popover: {
        title: '4. Datos de P.H.',
        description:
          'Solo para prueba hidrostática o recertificación: fecha de la prueba, vigencia en años, N° de certificado y órgano inspector. Al finalizar, el cilindro actualiza su próximo vencimiento.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="mantenimiento-proveedor"]',
      popover: {
        title: '5. Proveedor externo',
        description: 'Si el trabajo lo hace un taller o proveedor de afuera, márcalo y selecciónalo para el control de costos.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="mantenimiento-comprobantes"]',
      popover: {
        title: '6. Comprobantes',
        description:
          'Enlaza la venta (si se cobró al cliente) o la compra (si se pagó al proveedor) para que el servicio quede conciliado.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="mantenimiento-guardar"]',
      popover: {
        title: '7. Registrar y finalizar',
        description:
          'Guarda el ingreso a taller. Cuando el trabajo termine, ve al listado y usa «Finalizar» en el menú de acciones: ahí registras la fecha de salida y el cilindro vuelve a estar disponible.',
        side: 'top',
        align: 'end',
        onNextClick: () => finish('balones-mantenimientos'),
      },
    },
  ])
}
