<template>
  <div class="space-y-6">
    <PageBreadcrumb
      page-title="Soporte y tutoriales"
      help="Aprende usando una demostración guiada del sistema."
    />

    <div class="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside class="space-y-4">
        <!-- Buscador en lenguaje del usuario: escribe el problema, no el modulo. -->
        <div class="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
          <label
            for="buscador-soporte"
            class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90"
          >
            ¿Qué necesitas hacer?
          </label>

          <div class="relative">
            <AppInput
              id="buscador-soporte"
              v-model="busqueda"
              type="search"
              placeholder="Ej.: no me deja hacer el recojo"
            />
            <button
              v-if="buscando"
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/[0.06]"
              aria-label="Limpiar búsqueda"
              @click="limpiarBusqueda"
            >
              <AppIcon :name="ICONS.x" :size="16" />
            </button>
          </div>

          <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Escríbelo como se lo dirías a un compañero.
          </p>

          <!-- Consultas mas frecuentes, como atajo -->
          <div v-if="!buscando" class="mt-3 flex flex-wrap gap-1.5">
            <button
              v-for="sugerencia in sugerencias"
              :key="sugerencia"
              type="button"
              class="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
              @click="busqueda = sugerencia"
            >
              {{ sugerencia }}
            </button>
          </div>
        </div>

        <!-- Resultados: reemplazan al menu por modulos mientras se busca -->
        <template v-if="buscando">
          <div
            v-if="resultados.length === 0"
            class="rounded-2xl border border-dashed border-gray-300 p-6 text-center dark:border-gray-700"
          >
            <AppIcon :name="ICONS.search" :size="24" class="mx-auto text-gray-400" />
            <p class="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Sin resultados para «{{ busqueda }}»
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Prueba con una palabra suelta: «caja», «balón», «factura», «garantía».
            </p>
            <button
              type="button"
              class="mt-3 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              @click="limpiarBusqueda"
            >
              Ver todas las rutas
            </button>
          </div>

          <div v-else class="space-y-2">
            <p class="px-1 text-xs text-gray-500 dark:text-gray-400">
              {{ resultados.length }}
              {{ resultados.length === 1 ? 'resultado' : 'resultados' }}
            </p>
            <button
              v-for="resultado in resultados"
              :key="resultado.caso.id"
              type="button"
              class="w-full rounded-xl border p-3 text-left transition"
              :class="
                resultado.caso.id === selectedTutorialId
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                  : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]'
              "
              @click="selectDesdeBusqueda(resultado.caso.id)"
            >
              <span class="flex items-start justify-between gap-2">
                <span class="block text-sm font-semibold">{{ resultado.caso.title }}</span>
                <span
                  v-if="idsCasos.has(resultado.caso.id)"
                  class="shrink-0 rounded-full bg-warning-50 px-2 py-0.5 text-[10px] font-medium text-warning-700 dark:bg-warning-500/15 dark:text-warning-400"
                >
                  Caso
                </span>
              </span>
              <span class="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                {{ resultado.caso.description }}
              </span>
            </button>
          </div>
        </template>

        <template v-else>
          <TutorialMenuGroup
            v-for="group in tutorialGroups"
            :key="group.title"
            :title="group.title"
            :icon="group.icon"
            :tutorials="group.tutorials"
            :selected-id="selectedTutorialId"
            @select="selectTutorial"
          />
        </template>
      </aside>

      <DetailSectionCard :title="selectedTutorial.title" :icon="ICONS.bookOpen">
        <template #actions>
          <div class="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-lg bg-warning-500 px-3 py-2 text-sm border border-1 font-medium"
              @click="restartTutorial"
            >
              <AppIcon :name="ICONS.refreshCw" :size="16" />
              Repetir ruta
            </button>
            <a
              :href="tutorialUrl"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
            >
              <AppIcon :name="ICONS.externalLink" :size="16" />
              Abrir ruta
            </a>
          </div>
        </template>

        <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {{ selectedTutorial.description }}
        </p>

        <iframe
          :key="`${tutorialUrl}-${iframeVersion}`"
          :src="tutorialUrl"
          :title="selectedTutorial.title"
          class="h-[760px] w-full rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800"
        />
      </DetailSectionCard>
    </div>

    <AppModal
      v-model="tutorialFinished"
      title="¡Tutorial completado!"
      :subtitle="`Ya conoces el flujo «${selectedTutorial.title}» en el sistema.`"
      size="sm"
      :z-index="100000"
    >
      <img
        src="/images/logo/logo-o-sarita.webp"
        alt="Oxígeno Sarita"
        class="mx-auto h-20 w-auto object-contain"
      />

      <template #footer>
        <button
          type="button"
          class="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          @click="tutorialFinished = false"
        >
          Cerrar
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg bg-warning-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-warning-600"
          @click="restartTutorial"
        >
          <AppIcon :name="ICONS.refreshCw" :size="16" />
          Repetir tutorial
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import TutorialMenuGroup from '@/modules/soporte/components/TutorialMenuGroup.vue'
import { AppModal } from '@/shared/components'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { AppInput } from '@/shared/components'
import {
  buscarCasos,
  type CasoBuscable,
} from '@/modules/soporte/utils/buscarCasos'

/**
 * Casos reales reportados por el equipo durante la marcha blanca.
 * A diferencia del resto, no describen una pantalla: resuelven «me pasó esto,
 * ¿cómo lo registro?», que es el grueso de las consultas del día a día.
 */
const tutorialsCasos = [
  {
    id: 'caso-recojo-bloqueado',
    title: 'No puedo hacer el recojo de un balón',
    description:
      'El cliente devolvió el envase, lo pusiste DISPONIBLE y ahora el recojo se bloquea. Por qué pasa y cómo se arregla.',
    keywords: [
      'no puedo realizar el recojo',
      'no me permite iniciar el recojo',
      'no puedo dar ingreso',
      'le quiero dar ingreso pero no me permite',
      'aun no me permite iniciar el recojo del balon',
      'el cliente ya lo trajo a almacen',
      'cambiar el estado del balon',
      'estado del balon',
      'disponible',
      'en prestamo',
      'prestado',
      'devolvio el balon',
      'devolucion',
      'recojo',
      'recoger',
      'balon',
      'cilindro',
      'envase',
      'codigo del cilindro',
      'bloqueado',
      'no se puede recoger',
    ],
    path: '/admin/balones/cilindros',
    query: { tutorial: 'caso-recojo-bloqueado' },
  },
  {
    id: 'caso-flujo-entrega-completo',
    title: 'Un balón quedó «pendiente de envío»',
    description:
      'El flujo completo de una entrega: venta, orden de salida, actividad, verificación y cierre. Y el retorno.',
    keywords: [
      'pendiente de envio',
      'me sale pendiente de envio',
      'porque me sale pendiente de envio',
      'no se registra el balon como entregado',
      'orden de salida',
      'ordenes de salida',
      'actividad de entrega',
      'reparto',
      'chofer',
      'entrega',
      'flujo',
      'flujo de actividades',
      'no continuan con el flujo',
      'finalizar actividad',
      'actividad',
      'verificar items',
      'no aparece la actividad',
      'entregar balon',
      'salida de balon',
    ],
    path: '/admin/operativa/actividades',
    query: { tutorial: 'caso-flujo-entrega-completo' },
  },
  {
    id: 'caso-caja-reabrir',
    title: 'Registrar algo en una fecha ya cerrada',
    description:
      'Cobros o gastos de días anteriores: cómo reabrir la caja sin descuadrar el fondo ni los correlativos.',
    keywords: [
      'reabrir caja',
      'no lo deja cerrar la caja',
      'no me deja cerrar caja',
      'cerrar caja',
      'apertura de caja',
      'como se apertura caja',
      'abrir caja',
      'caja cerrada',
      'caja del dia anterior',
      'fecha anterior',
      'dia anterior',
      'registrar en fecha real',
      'fecha real',
      'regularizar',
      'monto inicial',
      'fondo',
      'fondo inicial',
      'caja negativa',
      'descuadre',
      'no cuadra la caja',
      'cobranza de dias pasados',
      'factura de ayer',
      'olvide cerrar caja',
      'caja',
    ],
    path: '/admin/ventas/caja',
    query: { tutorial: 'caso-caja-reabrir' },
  },
  {
    id: 'caso-corregir-comprobante',
    title: 'Me equivoqué en un comprobante',
    description:
      'Qué se puede corregir antes de emitir a SUNAT, qué exige nota de crédito y por qué el cilindro no se cambia ahí.',
    keywords: [
      'corregir factura',
      'corregir boleta',
      'me equivoque',
      'cambiar boleta a factura',
      'quiero cambiarlo a una factura',
      'me podrias ayudar a corregir esa factura',
      'aun no la he emitido',
      'ya estaba emitido',
      'anular comprobante',
      'nota de credito',
      'rechazado por sunat',
      'me sale error al enviar a sunat',
      'no me deja emitir',
      'correlativo',
      'salto de correlativo',
      'cambiar cliente',
      'comprobante',
      'factura',
      'boleta',
      'vsd',
    ],
    path: '/admin/ventas/comprobantes',
    query: { tutorial: 'caso-corregir-comprobante' },
  },
  {
    id: 'caso-compra-fecha-real',
    title: 'Me dieron la factura días después',
    description:
      'Fecha de gasto vs. fecha de emisión: registra el gasto hoy y completa el comprobante cuando llegue.',
    keywords: [
      'registrar compra',
      'subir la compra',
      'fecha de emision de la factura',
      'fecha de la factura',
      'fecha de gasto',
      'fecha de emision',
      'dos fechas',
      'pendiente de comprobante',
      'aun no llega la factura',
      'no tengo el comprobante',
      'completar comprobante despues',
      'compra sin factura',
      'el proveedor se demoro en alcanzarme',
      'factura de dias pasados',
      'compra con fecha anterior',
      'igv',
      'igv diferente',
      '10.5',
      'igv de comida',
      'editar igv',
      'clasificacion de gasto',
      'gasto',
      'compra',
      'proveedor',
      'afecta stock',
      'uso interno',
      'credito',
      'contado',
    ],
    path: '/admin/compras/nuevo',
    query: { tutorial: 'caso-compra-fecha-real' },
  },
  {
    id: 'caso-pago-mixto',
    title: 'El cliente paga con efectivo y Yape',
    description:
      'Repartir una venta al contado entre varios medios de pago para que la caja cierre cuadrada.',
    keywords: [
      'yape',
      'paga con yape',
      'efectivo y yape',
      'parte en efectivo y parte en yape',
      'dos medios de pago',
      'varios medios de pago',
      'medio de pago',
      'transferencia',
      'deposito',
      'la caja no cuadra',
      'no cuadra',
      'descuadre',
      'ocasionando que la caja no cuadre',
      'cambiar medio de pago',
      'agregar medio',
      'vuelto',
      'efectivo recibido',
      'pago mixto',
      'contado',
    ],
    path: '/admin/ventas/pos',
    query: { tutorial: 'caso-pago-mixto' },
  },
  {
    id: 'caso-devolver-garantia',
    title: 'Devolver la garantía a un cliente',
    description:
      'Dónde se registra el reembolso del depósito, con qué campos y en qué se diferencia del recojo.',
    keywords: [
      'garantia',
      'garantias',
      'devolver garantia',
      'devolver la garantia',
      'reembolso',
      'devolver el deposito',
      'el cliente trajo el balon y quiere su dinero',
      'dejo garantia',
      'no dejo garantia',
      'mandame lo de las garantias',
      'deposito del cliente',
      'reembolsar',
      'devolucion de dinero',
      'saldo pendiente',
      'anular reembolso',
    ],
    path: '/admin/finanzas/garantias',
    query: { tutorial: 'caso-devolver-garantia' },
  },
  {
    id: 'caso-renovar-alquiler',
    title: 'Renovar el alquiler de un regulador',
    description:
      'Vencido el periodo: renovar emite comprobante nuevo. Y qué hacer si el cliente lo devuelve.',
    keywords: [
      'alquiler',
      'alquileres',
      'renovar',
      'renovacion',
      'renovar alquiler',
      'regulador',
      'alquiler de regulador',
      'no me deja renovar',
      'desde el apartado de alquileres',
      'vencido',
      'por vencer',
      'dias de atraso',
      'periodo',
      'quincena',
      'devolver regulador',
      'dar ingreso al regulador',
      'accesorio',
      'canula',
      'vaso humidificador',
    ],
    path: '/admin/balones/alquileres',
    query: { tutorial: 'caso-renovar-alquiler' },
  },
  {
    id: 'caso-cilindro-perdido',
    title: 'No sé dónde está un cilindro',
    description:
      'Rastrear quién tiene cada envase y desde cuándo, y regularizar los que salieron sin registrar.',
    keywords: [
      'no aparece el cilindro',
      'no se donde esta',
      'cilindro perdido',
      'balon perdido',
      'no identifica en que ubicacion se encuentra',
      'quien tiene el balon',
      'quien lo tiene',
      'en poder de',
      'figura disponible pero lo tiene un cliente',
      'no sabe su ubicacion',
      'dias en prestamo',
      'dias de atraso',
      'antiguedad',
      '180 dias',
      'buscar codigo',
      'inventario',
      'exportar excel',
      'reporte de cilindros',
      'balones en clientes',
    ],
    path: '/admin/balones/prestamos',
    query: { tutorial: 'caso-cilindro-perdido' },
  },
  {
    id: 'caso-permisos-bloqueo',
    title: 'El sistema no me deja hacer algo',
    description:
      'Distinguir un permiso de una falla, cómo están repartidos y qué hacer si falta un compañero.',
    keywords: [
      'no me deja',
      'no me permite',
      'no puedo guardar',
      'no me aparece el boton',
      'sin permiso',
      'permisos',
      'dale permiso a mi compañera',
      'le puedes dar permiso',
      'habilitar permiso',
      'no puedo dar ingreso a los gastos',
      'no me deja registrar gastos',
      'usuario',
      'acceso',
      'mi compañero no vino',
      'si uno no se presenta',
      'rol',
      'administrador',
      'autorizacion',
    ],
    path: '/admin/usuarios',
    query: { tutorial: 'caso-permisos-bloqueo' },
  },
] as const

const tutorialsDashboard = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Resumen del negocio: dinero, deudas, envases en campo, ventas y alertas.',
    keywords: [
      'dashboard',
      'tablero',
      'resumen',
      'metricas',
      'graficos',
      'indicadores',
      'inicio',
    ],
    path: '/admin/dashboard',
    query: { tutorial: 'dashboard' },
  },
] as const

const tutorialsClientes = [
  {
    id: 'crear-cliente',
    title: 'Crear cliente',
    description: 'Registra los datos del cliente, contacto y ubicación.',
    keywords: [
      'crear cliente',
      'nuevo cliente',
      'registrar cliente',
      'ruc',
      'dni',
      'sunat',
      'agregar cliente',
      'datos del cliente',
    ],
    path: '/admin/clientes/nuevo',
    query: { tutorial: 'crear-cliente' },
  },
  {
    id: 'asociar-datos-cliente',
    title: 'Asociar datos a un cliente',
    description: 'Agrega contactos, direcciones, choferes, vehículos y cuentas bancarias.',
    keywords: [
      'contacto',
      'contactos',
      'direccion',
      'direcciones',
      'mas de una direccion',
      'segundo contacto',
      'chofer del cliente',
      'cuenta bancaria del cliente',
    ],
    path: '/admin/clientes',
    query: { tutorial: 'asociar-datos-cliente' },
  },
  {
    id: 'mapa-clientes',
    title: 'Mapa de clientes',
    description: 'Ubica clientes y proveedores en el mapa y revisa los balones en custodia.',
    keywords: [
      'mapa',
      'ubicacion',
      'gps',
      'coordenadas',
      'google maps',
      'link de ubicacion',
      'donde queda el cliente',
    ],
    path: '/admin/clientes/mapa',
    query: { tutorial: 'mapa-clientes' },
  },
  {
    id: 'cliente-relacionados-listado',
    title: 'Listado general de clientes',
    description: 'Consulta el listado completo, busca y filtra clientes por estado.',
    keywords: [
      'listado de clientes',
      'buscar cliente',
      'no me sale en el buscador',
      'buscar por nombre',
      'clientes',
      'no me sale en el buscador',
      'buscar por apellido',
      'no encuentro al cliente',
    ],
    path: '/admin/clientes',
    query: { tutorial: 'cliente-relacionados-listado' },
  },
] as const

const tutorialsVentas = [
  {
    id: 'ventas-caja',
    title: 'Abrir y cerrar caja',
    description: 'Apertura del día, gastos, depósitos y arqueo al cierre.',
    keywords: [
      'caja',
      'abrir caja',
      'cerrar caja',
      'arqueo',
      'fondo',
      'gasto de caja',
      'deposito',
      'efectivo',
      'cuadrar caja',
    ],
    path: '/admin/ventas/caja',
    query: { tutorial: 'ventas-caja' },
  },
  {
    id: 'ventas-pos',
    title: 'Registrar una venta (POS)',
    description: 'Comprobante, cliente, ítems (producto, gas, alquiler, servicio), pago y emisión.',
    keywords: [
      'vender',
      'registrar venta',
      'punto de venta',
      'pos',
      'nueva venta',
      'carrito',
      'cobrar',
      'emitir',
      'como registro una venta',
      'hacer una venta',
      'vender un balon',
      'cobrar al cliente',
      'venta al contado',
      'venta a credito',
      'glosa',
    ],
    path: '/admin/ventas/pos',
    query: { tutorial: 'ventas-pos' },
  },
  {
    id: 'ventas-comprobantes',
    title: 'Consultar y emitir comprobantes',
    description: 'Buscar, estado SUNAT, emitir, orden de salida, anular y PDF.',
    keywords: [
      'comprobantes',
      'facturas',
      'boletas',
      'emitir a sunat',
      'estado sunat',
      'descargar pdf',
      'xml',
      'declarar',
      'glosa',
      'no se ve la glosa',
      'glosa en el pdf',
      'observacion del comprobante',
      'pendiente de envio a sunat',
      'validar comprobante',
      'reenviar a sunat',
    ],
    path: '/admin/ventas/comprobantes',
    query: { tutorial: 'ventas-comprobantes' },
  },
  {
    id: 'ventas-sin-documento',
    title: 'Ventas sin documento',
    description: 'Ventas internas con ticket que no se declaran a SUNAT.',
    keywords: [
      'vsd',
      'venta sin documento',
      'sin comprobante',
      'cliente varios',
      'ticket',
      'glosa',
      'convertir vsd a factura',
      'pasar vsd a boleta',
    ],
    path: '/admin/ventas/vsd',
    query: { tutorial: 'ventas-sin-documento' },
  },
  {
    id: 'ventas-notas-credito',
    title: 'Notas de crédito',
    description: 'Anular o corregir un comprobante aceptado por SUNAT.',
    keywords: [
      'nota de credito',
      'anular factura',
      'anular boleta',
      'devolucion',
      'corregir emitido',
      'anular una venta ya emitida',
      'devolver una venta',
    ],
    path: '/admin/ventas/notas-credito',
    query: { tutorial: 'ventas-notas-credito' },
  },
  {
    id: 'ventas-resumen-diario',
    title: 'Resumen diario de boletas',
    description: 'Declarar a SUNAT las boletas del día y hacer seguimiento.',
    keywords: [
      'resumen diario',
      'declarar boletas',
      'envio de boletas',
      'resumen de boletas sunat',
    ],
    path: '/admin/ventas/resumen-diario',
    query: { tutorial: 'ventas-resumen-diario' },
  },
] as const

/** Orden de aprendizaje: primero el maestro (tipos), luego cilindros y su operativa. */
const tutorialsBalones = [
  {
    id: 'balones-tipos',
    title: 'Crear tipos de balón',
    description: 'Gas, capacidad, tara y vigencia de P.H. que heredan los cilindros.',
    keywords: [
      'tipo de balon',
      'tipos de balon',
      'capacidad',
      'm3',
      'tara',
      'vigencia ph',
      'crear tipo',
    ],
    path: '/admin/balones/tipos',
    query: { tutorial: 'balones-tipos' },
  },
  {
    id: 'balones-cilindro-crear',
    title: 'Registrar un cilindro',
    description: 'Código, tipo, propiedad y datos de P.H. de cada envase.',
    keywords: [
      'registrar cilindro',
      'nuevo balon',
      'crear balon',
      'codigo de balon',
      'numero de serie',
      'marca',
      'ano de fabricacion',
    ],
    path: '/admin/balones/cilindros/nuevo',
    query: { tutorial: 'balones-cilindro-crear' },
  },
  {
    id: 'balones-cilindros',
    title: 'Libro de cilindros',
    description: 'Consultar, filtrar, exportar, dar de baja y reactivar cilindros.',
    keywords: [
      'libro de cilindros',
      'listado de balones',
      'buscar balon',
      'escanear',
      'pistola',
      'codigo de barras',
      'exportar balones',
      'dar de baja',
      'estado del balon',
    ],
    path: '/admin/balones/cilindros',
    query: { tutorial: 'balones-cilindros' },
  },
  {
    id: 'balones-prestamos',
    title: 'Préstamos de cilindros',
    description: 'Cilindros de la empresa en poder de clientes, antigüedad y devolución.',
    keywords: [
      'prestamo',
      'prestamos',
      'balones en clientes',
      'quien tiene el balon',
      'devolucion de balon',
      'dias en prestamo',
    ],
    path: '/admin/balones/prestamos',
    query: { tutorial: 'balones-prestamos' },
  },
  {
    id: 'balones-alquileres',
    title: 'Alquileres de accesorios',
    description: 'Vigencia, atrasos, renovación y devolución de accesorios alquilados.',
    keywords: [
      'alquiler',
      'alquileres',
      'regulador',
      'accesorio',
      'renovar',
      'vencido',
    ],
    path: '/admin/balones/alquileres',
    query: { tutorial: 'balones-alquileres' },
  },
  {
    id: 'balones-rutas-pueblos',
    title: 'Ruta pueblos',
    description: 'Salida de cilindros con chofer, retorno con pesaje y cierre.',
    keywords: [
      'ruta pueblos',
      'pueblos',
      'salida a pueblos',
      'pesaje',
      'retorno',
      'chofer',
    ],
    path: '/admin/balones/rutas-pueblos',
    query: { tutorial: 'balones-rutas-pueblos' },
  },
  {
    id: 'balones-mantenimientos',
    title: 'Mantenimiento y P.H.',
    description: 'Ingreso a taller, prueba hidrostática, proveedor externo y finalización.',
    keywords: [
      'mantenimiento',
      'prueba hidrostatica',
      'ph',
      'taller',
      'reparacion',
      'balon danado',
      'ph vencida',
      'ph por vencer',
      'prueba hidrostatica vencida',
      'renovar ph',
      'organo inspector',
    ],
    path: '/admin/balones/mantenimientos/nuevo',
    query: { tutorial: 'balones-mantenimientos' },
  },
] as const

const tutorialsProductos = [
  {
    id: 'productos-catalogo',
    title: 'Catálogo de productos',
    description: 'Gestiona el catálogo completo: gases, accesorios, servicios y más.',
    keywords: [
      'productos',
      'catalogo',
      'articulos',
      'lista de productos',
      'buscar producto',
    ],
    path: '/admin/productos/articulos',
    query: { tutorial: 'productos-catalogo' },
  },
  {
    id: 'productos-crear',
    title: 'Crear un producto',
    description: 'Registra un nuevo producto con categoría, precios y datos fiscales.',
    keywords: [
      'crear producto',
      'nuevo producto',
      'registrar producto',
      'precio',
      'categoria',
    ],
    path: '/admin/productos/articulos/nuevo',
    query: { tutorial: 'productos-crear' },
  },
  {
    id: 'productos-categorias',
    title: 'Categorías',
    description: 'Administra las categorías de productos del catálogo.',
    keywords: [
      'categoria',
      'categorias',
      'grupo de productos',
    ],
    path: '/admin/productos/categorias',
    query: { tutorial: 'productos-categorias' },
  },
  {
    id: 'productos-subcategorias',
    title: 'Subcategorías',
    description: 'Organiza los productos en subcategorías dentro de cada categoría.',
    keywords: [
      'subcategoria',
      'subcategorias',
      'subgrupo',
    ],
    path: '/admin/productos/sub-categorias',
    query: { tutorial: 'productos-subcategorias' },
  },
  {
    id: 'productos-stock',
    title: 'Stock por almacén',
    description: 'Consulta y ajusta las cantidades disponibles en cada almacén.',
    keywords: [
      'stock',
      'inventario',
      'cantidad disponible',
      'no hay stock suficiente',
      'stock por almacen',
      'ajustar stock',
      'no hay stock suficiente',
      'no me deja vender por stock',
      'stock negativo',
      'ajuste de stock',
      'inventario fisico',
    ],
    path: '/admin/productos/stock',
    query: { tutorial: 'productos-stock' },
  },
] as const

const tutorialsConfiguracion = [
  {
    id: 'configuracion-empresa',
    title: 'Datos de la empresa',
    description: 'RUC, razón social, dirección fiscal y parámetros operativos.',
    keywords: [
      'empresa',
      'datos de la empresa',
      'ruc de la empresa',
      'razon social',
    ],
    path: '/admin/configuracion/empresas',
    query: { tutorial: 'configuracion-empresa' },
  },
  {
    id: 'configuracion-sucursales',
    title: 'Sucursales',
    description: 'Cada local de la empresa con su caja y almacenes.',
    keywords: [
      'sucursal',
      'sucursales',
      'local',
    ],
    path: '/admin/configuracion/sucursales',
    query: { tutorial: 'configuracion-sucursales' },
  },
  {
    id: 'configuracion-almacenes',
    title: 'Almacenes',
    description: 'Lugares físicos donde se guarda el stock y los cilindros.',
    keywords: [
      'almacen',
      'almacenes',
      'almacen principal',
      'almacen lambayeque',
    ],
    path: '/admin/configuracion/almacenes',
    query: { tutorial: 'configuracion-almacenes' },
  },
  {
    id: 'configuracion-choferes',
    title: 'Choferes',
    description: 'Personal habilitado para conducir la flota de la empresa.',
    keywords: [
      'chofer',
      'choferes',
      'licencia',
      'conductor',
    ],
    path: '/admin/configuracion/choferes',
    query: { tutorial: 'configuracion-choferes' },
  },
  {
    id: 'configuracion-vehiculos',
    title: 'Vehículos',
    description: 'Flota de la empresa: placas, documentos y estado.',
    keywords: [
      'vehiculo',
      'vehiculos',
      'placa',
      'flota',
      'camion',
    ],
    path: '/admin/configuracion/vehiculos',
    query: { tutorial: 'configuracion-vehiculos' },
  },
  {
    id: 'configuracion-cuentas-bancarias',
    title: 'Cuentas bancarias',
    description: 'Cuentas donde se reciben transferencias y depósitos.',
    keywords: [
      'cuenta bancaria',
      'cuentas bancarias',
      'bcp',
      'banco',
      'transferencia',
    ],
    path: '/admin/configuracion/cuentas-bancarias',
    query: { tutorial: 'configuracion-cuentas-bancarias' },
  },
  {
    id: 'configuracion-condiciones-pago',
    title: 'Condiciones de pago',
    description: 'Plantillas de crédito (contado, 30 días, cuotas) para ventas y compras.',
    keywords: [
      'condicion de pago',
      'credito',
      'contado',
      'cuotas',
      'plazo',
      '30 dias',
    ],
    path: '/admin/configuracion/condiciones-pago',
    query: { tutorial: 'configuracion-condiciones-pago' },
  },
  {
    id: 'configuracion-servicios',
    title: 'Servicios',
    description: 'Catálogo de servicios que ofrece la empresa (flete, mantenimiento, etc.).',
    keywords: [
      'servicio',
      'servicios',
      'flete',
    ],
    path: '/admin/configuracion/servicios',
    query: { tutorial: 'configuracion-servicios' },
  },
  {
    id: 'configuracion-sunat',
    title: 'Configuración SUNAT',
    description: 'Credenciales, certificado digital y datos para comprobantes electrónicos.',
    keywords: [
      'sunat',
      'certificado digital',
      'clave sol',
      'usuario secundario',
      'facturacion electronica',
      'credenciales',
      'no me deja emitir',
      'error de sunat',
      'servicio de sunat caido',
      'certificado vencido',
      'rechazado',
    ],
    path: '/admin/configuracion/sunat',
    query: { tutorial: 'configuracion-sunat' },
  },
] as const

const tutorialsCompras = [
  {
    id: 'compras-listado',
    title: 'Listado de compras',
    description: 'Todas las compras registradas: facturas, mercadería, servicios y gastos.',
    keywords: [
      'compras',
      'listado de compras',
      'buscar compra',
      'glosa de compra',
    ],
    path: '/admin/compras',
    query: { tutorial: 'compras-listado' },
  },
  {
    id: 'compras-registrar',
    title: 'Registrar una compra',
    description: 'Comprobante, proveedor, clasificación, detalle y recarga externa.',
    keywords: [
      'registrar compra',
      'nueva compra',
      'factura de proveedor',
      'ingresar mercaderia',
      'recarga en planta',
    ],
    path: '/admin/compras/nuevo',
    query: { tutorial: 'compras-registrar' },
  },
  {
    id: 'compras-gastos-caja',
    title: 'Gastos de caja',
    description: 'Salidas menudas pagadas con dinero de la caja del día.',
    keywords: [
      'gastos',
      'gasto de caja',
      'registrar gasto',
      'pasajes',
      'gastos menudos',
      'no puedo dar ingreso a los gastos',
    ],
    path: '/admin/compras/gastos-caja',
    query: { tutorial: 'compras-gastos-caja' },
  },
] as const

const tutorialsFinanzas = [
  {
    id: 'finanzas-cuentas-cobrar',
    title: 'Cuentas por cobrar',
    description: 'Controla lo que los clientes te deben por ventas al crédito.',
    keywords: [
      'cuentas por cobrar',
      'deuda del cliente',
      'cobranza',
      'registrar cobro',
      'saldo pendiente',
      'credito del cliente',
      'el cliente pago de mas',
      'saldo a favor',
      'excedente',
      'pago parcial',
      'cuotas',
      'plan de pagos',
      'dias de atraso',
      'cliente moroso',
    ],
    path: '/admin/finanzas',
    query: { tutorial: 'finanzas-cuentas-cobrar' },
  },
  {
    id: 'finanzas-cuentas-pagar',
    title: 'Cuentas por pagar',
    description: 'Controla lo que la empresa debe a proveedores y otros terceros.',
    keywords: [
      'cuentas por pagar',
      'deuda a proveedor',
      'pagar proveedor',
      'registrar pago',
    ],
    path: '/admin/finanzas/pagar',
    query: { tutorial: 'finanzas-cuentas-pagar' },
  },
  {
    id: 'finanzas-garantias',
    title: 'Garantías',
    description: 'Depósitos y garantías de clientes, seguimiento y devolución.',
    keywords: [
      'garantia',
      'garantias',
      'deposito',
      'reembolso',
    ],
    path: '/admin/finanzas/garantias',
    query: { tutorial: 'finanzas-garantias' },
  },
  {
    id: 'finanzas-libro-diario',
    title: 'Libro diario',
    description: 'Asientos contables generados automáticamente por cada movimiento.',
    keywords: [
      'libro diario',
      'asientos',
      'contabilidad',
    ],
    path: '/admin/finanzas/libro-diario',
    query: { tutorial: 'finanzas-libro-diario' },
  },
] as const

const tutorialsInventario = [
  {
    id: 'inventario-movimientos',
    title: 'Movimientos de inventario',
    description: 'Historial de entradas y salidas de stock: compras, ventas, ajustes y traslados.',
    keywords: [
      'movimientos',
      'kardex',
      'entradas y salidas',
      'historial de stock',
      'movimientos de inventario',
    ],
    path: '/admin/inventario/movimientos',
    query: { tutorial: 'inventario-movimientos' },
  },
  {
    id: 'inventario-documentos-salida',
    title: 'Documentos de salida',
    description: 'Órdenes de salida para entregar productos a clientes o trasladar.',
    keywords: [
      'documento de salida',
      'orden de salida',
      'guia',
      'traslado',
      'salida de mercaderia',
      'guia de remision',
      'gre',
      'guia',
      'traslado entre almacenes',
      'cambiar cliente de la orden',
      'destinatario',
    ],
    path: '/admin/inventario/documentos-salida',
    query: { tutorial: 'inventario-documentos-salida' },
  },
] as const

const tutorialsActividades = [
  {
    id: 'actividades',
    title: 'Actividades operativas',
    description: 'Agenda de entregas, recojos, visitas y mantenimientos con calendario.',
    keywords: [
      'actividades',
      'agenda',
      'calendario',
      'reparto',
      'entrega',
      'recojo',
      'programar',
      'responsable',
      'asignar',
    ],
    path: '/admin/operativa/actividades',
    query: { tutorial: 'actividades' },
  },
] as const

const tutorialsGestion = [
  {
    id: 'gestion-trabajadores',
    title: 'Trabajadores',
    description: 'Padrón de personal, áreas, cargos, acceso al sistema y choferes.',
    keywords: [
      'trabajador',
      'trabajadores',
      'personal',
      'empleado',
      'asignar usuario',
    ],
    path: '/admin/trabajadores',
    query: { tutorial: 'gestion-trabajadores' },
  },
  {
    id: 'gestion-activos',
    title: 'Activos fijos',
    description: 'Inventario de bienes de la empresa: básculas, compresores, herramientas.',
    keywords: [
      'activos',
      'activo fijo',
      'equipos',
      'bienes de la empresa',
    ],
    path: '/admin/activos',
    query: { tutorial: 'gestion-activos' },
  },
  {
    id: 'gestion-documentos-vencimiento',
    title: 'Documentos por vencer',
    description: 'Seguimiento de licencias, soats, permisos y documentos con fecha de expiración.',
    keywords: [
      'documentos por vencer',
      'permisos',
      'certificados',
      'soat',
      'minsa',
      'vencimiento',
    ],
    path: '/admin/documentos-vencimiento',
    query: { tutorial: 'gestion-documentos-vencimiento' },
  },
] as const

const tutorialsSistema = [
  {
    id: 'sistema-usuarios',
    title: 'Usuarios',
    description: 'Cuentas de acceso al sistema con roles y permisos.',
    keywords: [
      'usuario',
      'usuarios',
      'crear usuario',
      'acceso al sistema',
      'clave',
      'cuenta',
    ],
    path: '/admin/usuarios',
    query: { tutorial: 'sistema-usuarios' },
  },
  {
    id: 'sistema-roles',
    title: 'Roles',
    description: 'Perfiles de acceso que agrupan permisos por función.',
    keywords: [
      'rol',
      'roles',
      'perfil',
    ],
    path: '/admin/roles',
    query: { tutorial: 'sistema-roles' },
  },
  {
    id: 'sistema-permisos',
    title: 'Permisos',
    description: 'Detalles de qué puede hacer cada rol en el sistema.',
    keywords: [
      'permiso',
      'permisos',
      'que puede hacer cada rol',
    ],
    path: '/admin/permisos',
    query: { tutorial: 'sistema-permisos' },
  },
] as const

const tutorialGroups = [
  {
    title: 'Casos frecuentes',
    icon: ICONS.circleHelp,
    tutorials: tutorialsCasos,
  },
  {
    title: 'Dashboard',
    icon: ICONS.dashboard,
    tutorials: tutorialsDashboard,
  },
  {
    title: 'Módulo Clientes',
    icon: ICONS.users,
    tutorials: tutorialsClientes,
  },
  {
    title: 'Módulo Ventas',
    icon: ICONS.shoppingCart,
    tutorials: tutorialsVentas,
  },
  {
    title: 'Módulo Balones',
    icon: ICONS.cylinder,
    tutorials: tutorialsBalones,
  },
  {
    title: 'Productos y Almacén',
    icon: ICONS.package,
    tutorials: tutorialsProductos,
  },
  {
    title: 'Configuración',
    icon: ICONS.settings,
    tutorials: tutorialsConfiguracion,
  },
  {
    title: 'Compras y Gastos',
    icon: ICONS.receipt,
    tutorials: tutorialsCompras,
  },
  {
    title: 'Finanzas',
    icon: ICONS.wallet,
    tutorials: tutorialsFinanzas,
  },
  {
    title: 'Inventario',
    icon: ICONS.boxes,
    tutorials: tutorialsInventario,
  },
  {
    title: 'Actividades',
    icon: ICONS.calendarRange,
    tutorials: tutorialsActividades,
  },
  {
    title: 'Gestión',
    icon: ICONS.clipboardCheck,
    tutorials: tutorialsGestion,
  },
  {
    title: 'Sistema',
    icon: ICONS.shield,
    tutorials: tutorialsSistema,
  },
] as const

const allTutorials = [
  ...tutorialsCasos,
  ...tutorialsDashboard,
  ...tutorialsClientes,
  ...tutorialsVentas,
  ...tutorialsBalones,
  ...tutorialsProductos,
  ...tutorialsConfiguracion,
  ...tutorialsCompras,
  ...tutorialsFinanzas,
  ...tutorialsInventario,
  ...tutorialsActividades,
  ...tutorialsGestion,
  ...tutorialsSistema,
]

const router = useRouter()

/** Índice plano para la búsqueda: título, descripción y frases del usuario. */
const casosBuscables: CasoBuscable[] = allTutorials.map((tutorial) => ({
  id: tutorial.id,
  title: tutorial.title,
  description: tutorial.description,
  keywords: 'keywords' in tutorial ? tutorial.keywords : undefined,
}))

/** Id de los casos reales, para distinguirlos visualmente en los resultados. */
const idsCasos = new Set<string>(tutorialsCasos.map((caso) => caso.id))

const busqueda = ref('')
const buscando = computed(() => busqueda.value.trim().length > 0)
const resultados = computed(() => buscarCasos(casosBuscables, busqueda.value))

/**
 * Sugerencias con las consultas más repetidas en soporte. Son atajos: al
 * pulsarlas se escriben en el buscador y se muestran sus resultados.
 */
const sugerencias = [
  'no me deja hacer el recojo',
  'pendiente de envio',
  'caja cerrada',
  'efectivo y yape',
  'no se donde esta un balon',
  'corregir factura',
  'devolver garantia',
  'no me deja registrar gastos',
] as const

const limpiarBusqueda = () => {
  busqueda.value = ''
}

const selectedTutorialId = ref<string>('crear-cliente')
const iframeVersion = ref(0)
const tutorialFinished = ref(false)
const selectedTutorial = computed(
  () => allTutorials.find((tutorial) => tutorial.id === selectedTutorialId.value) ?? allTutorials[0],
)
const tutorialUrl = computed(() =>
  router.resolve({ path: selectedTutorial.value.path, query: selectedTutorial.value.query }).href,
)

const selectTutorial = (id: string) => {
  selectedTutorialId.value = id
  tutorialFinished.value = false
  iframeVersion.value += 1
}

/** Desde los resultados: abre la ruta y devuelve el panel al menú por módulos. */
const selectDesdeBusqueda = (id: string) => {
  selectTutorial(id)
  limpiarBusqueda()
}

const restartTutorial = () => {
  tutorialFinished.value = false
  iframeVersion.value += 1
}

const onTutorialMessage = (event: MessageEvent<{ type?: string; tutorialId?: string }>) => {
  if (event.origin !== window.location.origin) return
  if (event.data?.type === 'tutorial-completado' && event.data.tutorialId === selectedTutorialId.value) {
    tutorialFinished.value = true
  }
}

onMounted(() => window.addEventListener('message', onTutorialMessage))
onBeforeUnmount(() => window.removeEventListener('message', onTutorialMessage))
</script>
