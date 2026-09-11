import { bulletList, runTutorial, type TutorialOptions } from '@/modules/soporte/tutorials/tutorial-base'

export function createBalonesCilindroCrearTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-balones-cilindros"]',
      popover: {
        title: '1. Libro de cilindros',
        description:
          'En el menú Balones ingresa a Libro de cilindros y pulsa «Nuevo». Cada envase físico se registra una sola vez; después el sistema sigue su historial (recargas, préstamos, mantenimientos).',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="balon-codigo"]',
      popover: {
        title: '2. Código de balón',
        description:
          'Identificador único grabado en el cilindro. Puedes escribirlo o escanearlo con la pistola usando el botón de al lado. Si el número de serie es distinto, regístralo en el campo siguiente.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="balon-datos"]',
      popover: {
        title: '3. Datos',
        description: `${bulletList([
          ['Marca y tipo de válvula', 'catálogos; puedes crear uno nuevo con el «+».'],
          ['Libro, página y N° de recepción', 'referencia al registro físico.'],
          ['Estado y almacén', 'dónde está hoy el cilindro y en qué condición (disponible, lleno, en cliente…).'],
        ])}`,
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="balon-tipo"]',
      popover: {
        title: '4. Tipo de balón',
        description:
          'Obligatorio. Al elegir el tipo se sugiere automáticamente el gas y se toma la vigencia de P.H. para calcular el vencimiento. Si el tipo no existe, créalo desde el «+» sin salir del formulario.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="balon-propiedad"]',
      popover: {
        title: '5. Propiedad',
        description: `De quién es el envase:${bulletList([
          ['Empresa', 'cilindro propio; se puede prestar, alquilar o vender.'],
          ['Cliente', 'envase del cliente que solo se recarga; pide seleccionar el cliente.'],
          ['Planta', 'envase de un proveedor externo; pide el proveedor.'],
        ])}`,
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="balon-ph"]',
      popover: {
        title: '6. P.H. y datos técnicos',
        description:
          'Mes y año de fabricación grabados en el lomo: con la vigencia del tipo se calcula el vencimiento de la prueba hidrostática. También presión actual, peso aproximado, órgano inspector y sello. Las renovaciones posteriores se registran en Mantenimientos.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="balon-guardar"]',
      popover: {
        title: '7. Registrar cilindro',
        description:
          'Con código y tipo completos ya puedes guardar. El cilindro aparece en el libro y queda listo para recargas, préstamos y ventas.',
        side: 'top',
        align: 'end',
        onNextClick: () => finish('balones-cilindro-crear'),
      },
    },
  ])
}
