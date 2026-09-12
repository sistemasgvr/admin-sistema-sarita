import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createConfiguracionVehiculosTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-configuracion-vehiculos"]',
      popover: {
        title: '1. Vehículos de la empresa',
        description:
          'Unidades propias que transportan cilindros: van en ruta pueblos y en las guías de remisión. Los vehículos de clientes se registran desde la ficha del cliente.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="vehiculos-resumen"]',
      popover: {
        title: '2. Resumen',
        description: 'Total de vehículos y cuántos están activos.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '3. Buscar y filtrar',
        description: 'Por placa, marca o modelo; el filtro muestra activos o inactivos.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="vehiculos-nuevo"]',
      popover: {
        title: '4. Nuevo vehículo',
        description: 'Pulsa «Siguiente» para ver el formulario.',
        side: 'bottom',
        align: 'end',
        onNextClick: clickThenNext('[data-tutorial="vehiculos-nuevo"]'),
      },
    },
    {
      element: '[data-tutorial="vehiculo-tipo"]',
      popover: {
        title: '5. Tipo de vehículo',
        description: 'Camión, camioneta, motocarga… Sirve para clasificar y para los datos de traslado de la guía.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="vehiculo-placa"]',
      popover: {
        title: '6. Placa, marca y modelo',
        description: 'La placa principal es la que va en la GRE; la secundaria es para remolques o carretas.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="vehiculo-certificado"]',
      popover: {
        title: '7. Certificados',
        description: 'Número de certificado de inscripción (tarjeta de propiedad). SUNAT puede exigirlo en el traslado.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="vehiculo-guardar"]',
      popover: {
        title: '8. Guardar',
        description: 'Registra el vehículo; queda disponible en ruta pueblos y documentos de salida.',
        side: 'top',
        align: 'end',
        onNextClick: closeModalThenNext(),
      },
    },
    tableStep('[data-tutorial="vehiculos-ver"]', {
      popover: {
        title: '9. Acciones',
        description: `${bulletList([
          ['Ver', 'ficha completa del vehículo.'],
          ['Editar', 'actualiza placa, certificados o características.'],
          ['Eliminar', 'baja lógica; deja de aparecer en las selecciones.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('configuracion-vehiculos'),
      },
    }),
  ])
}
