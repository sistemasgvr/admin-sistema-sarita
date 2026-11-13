import {
  bulletList,
  runTutorial,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

/**
 * CASO REAL (27/10 y 13/11): «agradecería que informaran cuando esté listo el
 * tema de las compras para poder subirlas con la fecha de emisión de la
 * factura» y «ya tengo la factura del día 11 que el proveedor se demoró en
 * alcanzarme».
 *
 * El sistema ya separa las dos fechas (CompraForm):
 *   - «Fecha de gasto» (fecha): día en que salió el dinero; define la caja.
 *   - «Fecha de emisión» (fechaEmision): la del comprobante del proveedor.
 *     Vacía = la compra queda PENDIENTE DE COMPROBANTE.
 *
 * Regla verificada en com_actualizar_compra_cabecera.sql (líneas 51-53):
 * completar después tipo/serie/número/emisión NO toca la caja; mover la fecha
 * de gasto sí exige la caja de destino abierta. Y la emisión no puede ser
 * futura (el formulario la limita con :max="today()").
 */
export function createCasoCompraFechaRealTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-compras"]',
      popover: {
        title: '1. El caso',
        description:
          'Pagaste hoy pero la factura llega recién en tres días. O ya la tienes, con fecha de la semana pasada. El sistema maneja <strong>dos fechas distintas</strong> justamente para esto, y ahí está la confusión que genera consultas.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="compra-documento"]',
      popover: {
        title: '2. 👉 Son DOS fechas, no una',
        description: `Este bloque tiene dos campos de fecha y confundirlos es el error más común:${bulletList([
          ['Fecha de gasto', 'el día en que salió el dinero. <strong>Define en qué caja entra.</strong>'],
          ['Fecha de emisión', 'la que trae el comprobante del proveedor.'],
        ])}<p class="mt-2">No tienen por qué ser iguales: pagas el lunes y el proveedor factura el miércoles.</p>`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-documento"]',
      popover: {
        title: '3. ⭐ Si la factura aún no llegó',
        description:
          'Deja la <strong>Fecha de emisión vacía</strong> y guarda. La compra queda marcada como <strong>pendiente de comprobante</strong>: el gasto ya está registrado en la caja del día correcto, y el documento lo completas cuando el proveedor te lo alcance. <strong>Ya no hay que esperar la factura para registrar el gasto.</strong>',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-documento"]',
      popover: {
        title: '4. Completar el comprobante después',
        description: `Cuando llegue la factura, edita la compra y llena tipo, serie, número y fecha de emisión.${bulletList([
          ['No toca la caja', 'completar el comprobante no mueve ni recalcula nada.'],
          ['Emisión no futura', 'el sistema no acepta una fecha posterior a hoy.'],
          ['Volver a pendiente', 'si borras la fecha de emisión, vuelve a quedar pendiente.'],
        ])}<p class="mt-2">Esto es lo que resuelve el caso del 13/11: «ya tengo la factura del día 11 que el proveedor se demoró en alcanzarme».</p>`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-documento"]',
      popover: {
        title: '5. ⚠️ Cambiar la fecha de gasto es distinto',
        description:
          'Si editas la <strong>Fecha de gasto</strong>, el pago se mueve a la caja de esa nueva fecha, y <strong>esa caja debe estar abierta</strong>. Si la de origen ya estaba cerrada, su arqueo se recalcula. Por eso conviene acertar con la fecha de gasto al registrar, y dejar para después solo los datos del comprobante.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-pago"]',
      popover: {
        title: '6. 👉 Lo que define la caja',
        description: `La condición de pago decide si esto toca la caja o no:${bulletList([
          ['Al contado', 'el desembolso entra en la caja de la fecha de gasto.'],
          ['Al crédito', 'no toca la caja: queda en Cuentas por pagar.'],
        ])}<p class="mt-2">Recuerda: lo que manda para la caja es la <strong>fecha de gasto</strong>, no la de emisión del comprobante.</p>`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-clasificacion"]',
      popover: {
        title: '7. Clasifica bien el gasto',
        description:
          'Combustible, mantenimiento, servicios, útiles de oficina… Esta clasificación es la que después permite comparar gastos por rubro y cruzar ventas contra compras. Una compra sin clasificar aparece en el total pero no en ningún análisis.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-detalle"]',
      popover: {
        title: '8. IGV editable',
        description:
          'El IGV viene en 18% por defecto, pero <strong>se puede editar</strong>. Sirve para los casos con tasa distinta —por ejemplo consumo de comida al 10.5%— sin tener que forzar los montos para que cuadre.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-detalle"]',
      popover: {
        title: '9. Qué afecta el stock',
        description:
          'En el detalle marcas, producto por producto, cuál ingresa al almacén. Lo que es de uso interno (un USB, una reparación) se registra como gasto y no toca el inventario. Así el stock no se infla con cosas que nunca se van a vender.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="compra-guardar"]',
      popover: {
        title: '10. Antes de guardar',
        description: `Repasa:${bulletList([
          ['Fecha de gasto', 'el día real en que salió el dinero.'],
          ['Fecha de emisión', 'la del comprobante, o vacía si aún no llega.'],
          ['Serie y número', 'igual al documento físico.'],
          ['Condición', 'contado o crédito según corresponda.'],
          ['Stock', 'marcado solo en lo que entra al almacén.'],
        ])}<p class="mt-2">Si la compra ya ingresó stock y luego se vendió, anularla se bloquea: primero hay que regularizar el inventario.</p>`,
        side: 'top',
        align: 'end',
        onNextClick: () => finish('caso-compra-fecha-real'),
      },
    },
  ])
}
