import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createBalonesTiposTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-balones-tipos"]',
      popover: {
        title: '1. Tipos de balón',
        description:
          'Todo empieza aquí: el tipo describe la familia de cilindros (gas, capacidad, tara, vigencia de P.H.). Cada cilindro que registres después pertenece a un tipo, que le da el gas y calcula sus vencimientos.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '2. Buscar',
        description: 'Busca un tipo por su nombre o por el gas que contiene.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="tipos-nuevo"]',
      popover: {
        title: '3. Nuevo tipo',
        description: 'Pulsa «Siguiente» para ver el formulario de un tipo nuevo.',
        side: 'bottom',
        align: 'end',
        onNextClick: clickThenNext('[data-tutorial="tipos-nuevo"]'),
      },
    },
    {
      element: '[data-tutorial="tipo-nombre"]',
      popover: {
        title: '4. Nombre',
        description:
          'Nombre con el que lo verás en todo el sistema, por ejemplo «Oxígeno Industrial D/E» o «Oxígeno Medicinal 10 m³».',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="tipo-gas"]',
      popover: {
        title: '5. Gas (producto)',
        description:
          'El producto de gas que llevan estos cilindros. Solo aparecen productos marcados como gas; es el que se sugiere al registrar el cilindro y al recargar.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="tipo-capacidad"]',
      popover: {
        title: '6. Capacidad',
        description:
          'Cuánto gas contiene lleno: en m³ (o la unidad que elijas abajo) y su equivalente en libras. Se usa para el stock de gas y las conversiones en báscula.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="tipo-tara"]',
      popover: {
        title: '7. Peso tara',
        description:
          'Peso del cilindro vacío en kg y lb. Con él se calcula el gas neto al pesar (bruto − tara). El sistema muestra un rango de referencia por tipo de gas para detectar errores.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="tipo-presion"]',
      popover: {
        title: '8. Presión de llenado',
        description:
          'PSI del cilindro a capacidad nominal. Permite estimar los m³ que quedan a partir de la presión que marca el manómetro.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="tipo-vigencia"]',
      popover: {
        title: '9. Vigencia de P.H.',
        description:
          'Años de validez de la prueba hidrostática según el gas (normalmente 5 o 10). Con la fecha de fabricación de cada cilindro, el sistema calcula cuándo vence y lo alerta en el libro.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="tipo-guardar"]',
      popover: {
        title: '10. Crear tipo',
        description: 'Guarda el tipo. Desde ese momento estará disponible al registrar cilindros.',
        side: 'top',
        align: 'end',
        onNextClick: closeModalThenNext(),
      },
    },
    tableStep('[data-tutorial="tipos-ver"]', {
      popover: {
        title: '11. Ver detalle',
        description: 'Muestra la ficha del tipo y cuántos cilindros activos están asociados.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="tipos-acciones"]', {
      popover: {
        title: '12. Acciones',
        description: `${bulletList([
          ['Editar', 'corrige capacidad, tara o vigencia; aplica a todos los cilindros del tipo.'],
          ['Eliminar', 'solo si ningún cilindro lo usa.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('balones-tipos'),
      },
    }),
  ])
}
