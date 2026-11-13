import {
  bulletList,
  runTutorial,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

const selectTab = (key: string) => {
  document.querySelector<HTMLElement>(`[data-tutorial="tab-${key}"]`)?.click()
}

/**
 * CASO REAL (24/10 y 26/10): «el cilindro 21Y598109 no aparece, llegó
 * recargado el 21/05 y no se sabe dónde está» y «te envío 3 códigos: 2 figuran
 * disponibles y 1 en cliente pero no dice cuál».
 *
 * Causa de fondo: un envase que salió sin registrar el préstamo queda como
 * DISPONIBLE aunque esté en la calle. El sistema solo sabe lo que se registró.
 *
 * La pestaña «Días en préstamo» (PrestamosAntiguedadView) es la pantalla que
 * responde «¿quién tiene qué y desde cuándo?», con rangos 180+/90–180/30–90/<30.
 */
export function createCasoCilindroPerdidoTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ tutorial, sidebarStep, finish }) => {
    const goToTab = (key: string) => () => {
      selectTab(key)
      window.setTimeout(() => tutorial.moveNext(), 300)
    }

    return [
      sidebarStep({
        element: '[data-tutorial="menu-balones-prestamos"]',
        popover: {
          title: '1. El caso',
          description:
            'No encuentras un envase: no está en el almacén, pero el sistema lo da por disponible. O sabes que un cliente lo tiene, pero el sistema no dice cuál. Esta ruta explica cómo rastrearlo y cómo corregir el registro.',
          side: 'right',
          align: 'start',
        },
      }),
      {
        element: '[data-tutorial="tabs"]',
        popover: {
          title: '2. Dos vistas distintas',
          description: `${bulletList([
            ['Préstamos', 'cada entrega registrada, con su comprobante.'],
            ['Días en préstamo', 'quién tiene qué y hace cuántos días. Para rastrear, usa esta.'],
          ])}`,
          side: 'bottom',
          align: 'start',
          onNextClick: goToTab('antiguedad'),
        },
      },
      {
        element: '[data-tutorial="lista-filtros"]',
        popover: {
          title: '3. Los rangos de alerta',
          description: `Las tarjetas de arriba agrupan por antigüedad y sirven de atajo:${bulletList([
            ['180+ días', 'rojo: llevan medio año fuera. Son los que se pierden.'],
            ['90–180 y 30–90', 'seguimiento y atención.'],
            ['< 30 días', 'rotación normal.'],
          ])}<p class="mt-2">Para buscar un envase extraviado, empieza por <strong>180+ días</strong>.</p>`,
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="lista-buscador"]',
        popover: {
          title: '4. Buscar el código',
          description:
            'Escribe el código del cilindro (o escanéalo). Si aparece aquí, <strong>sí está registrado como prestado</strong>: la fila te dice el cliente, desde qué fecha y cuántos días lleva. Ese es el dato que necesitas para ir a cobrarlo o recogerlo.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="lista-filtros"]',
        popover: {
          title: '5. Filtrar por cliente',
          description:
            'Si lo que quieres es saber cuántos envases tiene un cliente, filtra por <strong>Cliente</strong> y marca <strong>Solo pendientes</strong>. Te quedas con lo que aún no devuelve. Es el reporte que conviene llevar cuando se va a hacer una cobranza o un recojo.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="lista-buscador"]',
        popover: {
          title: '6. ⚠️ Si el código NO aparece aquí',
          description: `Entonces el sistema cree que está en el almacén. Eso pasa cuando <strong>salió sin registrarse el préstamo</strong>: se hizo la venta o la orden de salida y el flujo quedó a medias.${bulletList([
            ['Revisa la ficha', 'en el Libro de cilindros, mira su historial de movimientos.'],
            ['Sin movimientos', 'nunca se registró la salida: el dato hay que reconstruirlo.'],
          ])}`,
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="lista-buscador"]',
        popover: {
          title: '7. Cómo regularizarlo',
          description:
            'Si averiguas quién lo tiene (por la guía, el cuaderno o llamando al cliente), <strong>registra el préstamo con la fecha real</strong> de salida. Así el envase deja de figurar como disponible, empieza a contar sus días y el recojo se puede programar. Es preferible a cambiarle el estado a mano, que no deja rastro.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="lista-filtros"]',
        popover: {
          title: '8. Exportar para inventariar',
          description:
            'Puedes exportar el listado con los filtros puestos y usarlo para el conteo físico: lo que está en el papel y no en el almacén, debería estar en algún cliente. El Excel del Libro de cilindros trae además la columna <strong>«En poder de»</strong>.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tutorial="lista-buscador"]',
        popover: {
          title: '9. Para que no vuelva a pasar',
          description:
            'Un envase se pierde del sistema cuando sale sin registrar. Cerrar siempre el flujo —venta, orden de salida, actividad de entrega y culminar— es lo que mantiene esta lista confiable. Si no, en unos meses nadie sabe dónde está nada.',
          side: 'bottom',
          align: 'start',
          onNextClick: () => {
            selectTab('prestamos')
            finish('caso-cilindro-perdido')
          },
        },
      },
    ]
  })
}
