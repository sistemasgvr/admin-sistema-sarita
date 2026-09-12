import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createGestionDocumentosVencimientoTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-documentos-vencimiento"]',
      popover: {
        title: '1. Permisos y certificados',
        description:
          'Registro de documentos con fecha de vencimiento: licencias de funcionamiento, SOAT, revisiones técnicas, certificados de Defensa Civil, brevetes… El sistema avisa cuando están por vencer.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="docvenc-resumen"]',
      popover: {
        title: '2. Semáforo',
        description: 'Total de documentos y cuántos están vigentes, por vencer o ya vencidos.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '3. Buscar y filtrar',
        description: `Busca por descripción o número. Filtros:${bulletList([
          ['Categoría', 'tipo de documento (municipal, vehicular, laboral…).'],
          ['Vencimiento', 'vigente, por vencer o vencido.'],
          ['Registro', 'activos o dados de baja.'],
        ])}`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="docvenc-nuevo"]',
      popover: {
        title: '4. Nuevo documento',
        description: 'Pulsa «Siguiente» para ver el formulario.',
        side: 'bottom',
        align: 'end',
        onNextClick: clickThenNext('[data-tutorial="docvenc-nuevo"]'),
      },
    },
    {
      element: '[data-tutorial="docvenc-datos"]',
      popover: {
        title: '5. Datos del documento',
        description: 'Categoría, descripción (por ejemplo «SOAT camión ABC-123») y número de documento.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="docvenc-alcance"]',
      popover: {
        title: '6. Alcance',
        description:
          'A quién aplica: a la empresa en general, a una sucursal o a un vehículo. Según el alcance eliges la sucursal o el vehículo concreto.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="docvenc-vigencia"]',
      popover: {
        title: '7. Vigencia',
        description:
          'Fecha de la última emisión o renovación y fecha de vencimiento. Con ellas se calcula el estado (vigente, por vencer, vencido) y los días restantes.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="docvenc-guardar"]',
      popover: {
        title: '8. Guardar',
        description: 'Registra el documento. Aparecerá en el listado y en las alertas de vencimiento.',
        side: 'top',
        align: 'end',
        onNextClick: closeModalThenNext(),
      },
    },
    {
      element: '[data-tutorial="docvenc-tabla"]',
      popover: {
        title: '9. Listado',
        description: 'Documento y número, categoría, alcance, fecha de vencimiento con los días que faltan y el estado.',
        side: 'top',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="docvenc-ver"]', {
      popover: {
        title: '10. Acciones',
        description: `${bulletList([
          ['Ver', 'ficha del documento con su historial de renovaciones.'],
          ['Renovar', 'registra la nueva fecha de vencimiento sin perder el historial.'],
          ['Editar', 'corrige descripción, alcance o fechas.'],
          ['Desactivar', 'baja lógica cuando el documento ya no aplica.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('gestion-documentos-vencimiento'),
      },
    }),
  ])
}
