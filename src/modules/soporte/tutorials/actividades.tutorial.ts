import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

const selectTab = (key: string) => {
  document.querySelector<HTMLElement>(`[data-tutorial="tab-${key}"]`)?.click()
}

export function createActividadesTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ tutorial, sidebarStep, finish }) => {
    const goToTab = (key: string) => () => {
      selectTab(key)
      window.setTimeout(() => tutorial.moveNext(), 300)
    }

    return [
      sidebarStep({
        element: '[data-tutorial="menu-actividades"]',
        popover: {
          title: '1. Actividades',
          description:
            'Agenda operativa de la empresa: entregas, recojos de cilindros, visitas, mantenimientos. Cada actividad tiene fecha, responsable, prioridad y estado.',
          side: 'right',
          align: 'start',
        },
      }),
      {
        element: '[data-tutorial="lista-buscador"]',
        popover: {
          title: '2. Buscar',
          description: 'Por título de la actividad o nombre del cliente.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="lista-filtros"]',
        popover: {
          title: '3. Filtros',
          description: `${bulletList([
            ['Estado', 'pendiente, en curso, realizada, cancelada.'],
            ['Tipo y prioridad', 'entrega, recojo, visita… y su urgencia.'],
            ['Asignación', 'mis actividades, sin asignar o de un responsable.'],
            ['Desde / Hasta', 'rango de fechas programadas.'],
          ])}`,
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="actividades-generar-recojos"]',
        popover: {
          title: '4. Generar recojos',
          description:
            'Crea de una vez las actividades de recojo para los préstamos de cilindros vencidos o por vencer. Si un préstamo ya tiene recojo abierto, no lo duplica.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '[data-tutorial="actividades-nueva"]',
        popover: {
          title: '5. Nueva actividad',
          description:
            'Abre el formulario: título, tipo, cliente y dirección, fecha y horario estimado, responsable (chofer o usuario), prioridad y cilindros involucrados.',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '[data-tutorial="tabs"]',
        popover: {
          title: '6. Tres vistas',
          description: `${bulletList([
            ['Lista', 'tabla con filtros y acciones.'],
            ['Calendario', 'las actividades por día; clic en un día para crear una.'],
            ['Colaboradores', 'ranking y carga de trabajo por responsable.'],
          ])}`,
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="actividades-tabla"]',
        popover: {
          title: '7. Lista',
          description:
            'Actividad y cliente, fecha y horario, tipo, responsable, prioridad y estado. Arriba de la lista aparecen avisos de las actividades en curso o próximas de hoy.',
          side: 'top',
          align: 'start',
        },
      },
      tableStep('[data-tutorial="actividades-ver"]', {
        popover: {
          title: '8. Ver detalle',
          description: 'Ficha completa con la ubicación en el mapa, cilindros asociados y el historial de cambios.',
          side: 'left',
          align: 'center',
        },
      }),
      tableStep('[data-tutorial="actividades-acciones"]', {
        popover: {
          title: '9. Acciones',
          description: `${bulletList([
            ['Editar', 'reprograma o cambia el responsable.'],
            ['Marcar realizada', 'cierra la actividad.'],
            ['Verificar por escaneo', 'en recojos y entregas, escanea los cilindros para confirmar.'],
            ['Cancelar / Eliminar', 'anula la actividad.'],
          ])}`,
          side: 'left',
          align: 'center',
          onNextClick: goToTab('calendario'),
        },
      }),
      {
        element: '[data-tutorial="actividades-calendario"]',
        popover: {
          title: '10. Calendario',
          description:
            'Vista mensual o semanal. Clic en una actividad para ver su detalle; clic en un día vacío para programar una nueva en esa fecha.',
          side: 'top',
          align: 'start',
          onNextClick: goToTab('colaboradores'),
        },
      },
      {
        element: '[data-tutorial="actividades-colaboradores"]',
        popover: {
          title: '11. Colaboradores',
          description:
            'Ranking de cumplimiento y carga de actividades por responsable en el rango filtrado. Útil para repartir el trabajo.',
          side: 'top',
          align: 'start',
          onNextClick: () => {
            selectTab('lista')
            finish('actividades')
          },
        },
      },
    ]
  })
}
