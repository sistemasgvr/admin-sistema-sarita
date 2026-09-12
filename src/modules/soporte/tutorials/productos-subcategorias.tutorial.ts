import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createProductosSubcategoriasTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-productos-sub-categorias"]',
      popover: {
        title: '1. Subcategorías',
        description:
          'Segundo nivel de clasificación dentro de una categoría: por ejemplo, en «Gases» puedes tener «Oxígeno industrial», «Oxígeno medicinal», «Argón».',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '2. Buscar',
        description: 'Por nombre de la subcategoría.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-filtros"]',
      popover: {
        title: '3. Filtrar por categoría',
        description: 'Muestra solo las subcategorías de una categoría.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="subcategorias-nuevo"]',
      popover: {
        title: '4. Nueva subcategoría',
        description: 'Pulsa «Siguiente» para ver el formulario.',
        side: 'bottom',
        align: 'end',
        onNextClick: clickThenNext('[data-tutorial="subcategorias-nuevo"]'),
      },
    },
    {
      element: '[data-tutorial="subcategoria-categoria"]',
      popover: {
        title: '5. Categoría padre',
        description: 'A qué categoría pertenece. Toda subcategoría cuelga de una categoría.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="subcategoria-nombre"]',
      popover: {
        title: '6. Nombre',
        description: 'Único dentro de su categoría, por ejemplo «Oxígeno industrial».',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="subcategoria-guardar"]',
      popover: {
        title: '7. Crear subcategoría',
        description: 'Guarda y queda disponible al clasificar productos.',
        side: 'top',
        align: 'end',
        onNextClick: closeModalThenNext(),
      },
    },
    {
      element: '[data-tutorial="subcategorias-tabla"]',
      popover: {
        title: '8. Listado',
        description: 'Categoría y subcategoría, descripción y cuántos productos la usan.',
        side: 'top',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="subcategorias-acciones"]', {
      popover: {
        title: '9. Acciones',
        description: `${bulletList([
          ['Editar', 'cambia nombre, descripción o categoría padre.'],
          ['Eliminar / Restaurar', 'desactiva o reactiva la subcategoría.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('productos-subcategorias'),
      },
    }),
  ])
}
