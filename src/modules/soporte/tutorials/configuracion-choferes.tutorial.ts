import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createConfiguracionChoferesTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-configuracion-choferes"]',
      popover: {
        title: '1. Choferes de la empresa',
        description:
          'Conductores propios que salen en ruta pueblos y en las guías de remisión. Los choferes de clientes se registran desde la ficha del cliente.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="choferes-resumen"]',
      popover: {
        title: '2. Resumen',
        description: 'Total de choferes y cuántos están activos.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '3. Buscar y filtrar',
        description: 'Por nombres, documento o brevete; el filtro muestra activos o inactivos.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="choferes-nuevo"]',
      popover: {
        title: '4. Nuevo chofer',
        description: 'Pulsa «Siguiente» para ver el formulario.',
        side: 'bottom',
        align: 'end',
        onNextClick: clickThenNext('[data-tutorial="choferes-nuevo"]'),
      },
    },
    {
      element: '[data-tutorial="chofer-trabajador"]',
      popover: {
        title: '5. Trabajador',
        description: 'Opcional: vincula el chofer con su registro de trabajador para compartir documentos y vencimientos.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="chofer-documento"]',
      popover: {
        title: '6. Documento y nombres',
        description: 'Tipo y número de documento (DNI) y nombres completos, tal como van en la guía de remisión.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="chofer-licencia"]',
      popover: {
        title: '7. Licencia',
        description: 'Número de brevete, teléfono, tipo y categoría de licencia. SUNAT exige el brevete en las GRE.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="chofer-vigencia"]',
      popover: {
        title: '8. Vigencia',
        description: 'Fechas de emisión y vencimiento de la licencia. El sistema alerta en Gestión Empresa cuando está por vencer.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="chofer-guardar"]',
      popover: {
        title: '9. Guardar',
        description: 'Registra el chofer; queda disponible en ruta pueblos y documentos de salida.',
        side: 'top',
        align: 'end',
        onNextClick: closeModalThenNext(),
      },
    },
    tableStep('[data-tutorial="choferes-ver"]', {
      popover: {
        title: '10. Acciones',
        description: `${bulletList([
          ['Ver', 'ficha completa del chofer.'],
          ['Editar', 'actualiza licencia o datos de contacto.'],
          ['Eliminar', 'baja lógica; deja de aparecer en las selecciones.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('configuracion-choferes'),
      },
    }),
  ])
}
