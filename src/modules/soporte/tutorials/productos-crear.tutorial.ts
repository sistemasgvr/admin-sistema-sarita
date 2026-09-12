import {
  bulletList,
  runTutorial,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createProductosCrearTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-productos-articulos"]',
      popover: {
        title: '1. Catálogo',
        description:
          'Desde Almacenes › Catálogo › Nuevo registras cualquier ítem: un gas, un accesorio con stock o un servicio que cobras.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="producto-tipo"]',
      popover: {
        title: '2. Producto o servicio',
        description: `${bulletList([
          ['Producto', 'algo físico: gas o accesorio. Puede controlar stock.'],
          ['Servicio', 'un cobro sin stock: flete, prueba hidrostática, alquiler de regulador.'],
        ])}`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="producto-codigo"]',
      popover: {
        title: '3. Código',
        description:
          'Identificador interno único. Pulsa «Generar» para obtener el siguiente correlativo. Al lado puedes registrar el código de barras escaneándolo con la pistola.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="producto-nombre"]',
      popover: {
        title: '4. Nombre',
        description: 'Como lo verás en el POS y en los comprobantes, por ejemplo «Oxígeno industrial».',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="producto-ubicacion"]',
      popover: {
        title: '5. Código de ubicación',
        description:
          'Dónde está en el almacén (ej. ARO-GEN-01). Se puede generar automáticamente con las iniciales del nombre y la marca; se imprime en etiquetas desde el catálogo.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="producto-categoria"]',
      popover: {
        title: '6. Categoría, subcategoría y unidad',
        description:
          'Clasifican el producto para filtros y reportes. La unidad de medida (unidad, m³, kg…) define cómo se cuenta el stock. Si falta alguna, créala con el botón «+».',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="producto-caracteristicas"]',
      popover: {
        title: '7. Características',
        description: `${bulletList([
          ['Es gas', 'su stock se controla en m³ y se vincula a los tipos de balón; pide los factores kg/m³ y lb/m³.'],
          ['Alquilable', 'se entrega con garantía y genera un alquiler (reguladores, carritos).'],
          ['Entra a taller', 'servicio que abre un mantenimiento de cilindro.'],
          ['Afecta stock', 'accesorio que descuenta del almacén al vender.'],
        ])}`,
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="producto-precio"]',
      popover: {
        title: '8. Precios',
        description:
          'Precio de venta (el que sugiere el POS), precio de compra de referencia y, si es alquilable o gas, el monto de garantía que se cobra al cliente.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="producto-imagenes"]',
      popover: {
        title: '9. Imágenes',
        description: 'Arrastra fotos del producto; la primera se muestra en el catálogo y en el POS.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="producto-guardar"]',
      popover: {
        title: '10. Crear',
        description: 'Guarda el producto. Queda disponible de inmediato en el POS, compras y stock.',
        side: 'top',
        align: 'end',
        onNextClick: () => finish('productos-crear'),
      },
    },
  ])
}
