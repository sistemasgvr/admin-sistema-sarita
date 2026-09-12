<template>
  <div class="space-y-6">
    <PageBreadcrumb
      page-title="Soporte y tutoriales"
      help="Aprende usando una demostración guiada del sistema."
    />

    <div class="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside class="space-y-4">
        <TutorialMenuGroup
          v-for="group in tutorialGroups"
          :key="group.title"
          :title="group.title"
          :icon="group.icon"
          :tutorials="group.tutorials"
          :selected-id="selectedTutorialId"
          @select="selectTutorial"
        />
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

const tutorialsDashboard = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Resumen del negocio: dinero, deudas, envases en campo, ventas y alertas.',
    path: '/admin/dashboard',
    query: { tutorial: 'dashboard' },
  },
] as const

const tutorialsClientes = [
  {
    id: 'crear-cliente',
    title: 'Crear cliente',
    description: 'Registra los datos del cliente, contacto y ubicación.',
    path: '/admin/clientes/nuevo',
    query: { tutorial: 'crear-cliente' },
  },
  {
    id: 'asociar-datos-cliente',
    title: 'Asociar datos a un cliente',
    description: 'Agrega contactos, direcciones, choferes, vehículos y cuentas bancarias.',
    path: '/admin/clientes',
    query: { tutorial: 'asociar-datos-cliente' },
  },
  {
    id: 'mapa-clientes',
    title: 'Mapa de clientes',
    description: 'Ubica clientes y proveedores en el mapa y revisa los balones en custodia.',
    path: '/admin/clientes/mapa',
    query: { tutorial: 'mapa-clientes' },
  },
  {
    id: 'cliente-relacionados-listado',
    title: 'Listado general de clientes',
    description: 'Consulta el listado completo, busca y filtra clientes por estado.',
    path: '/admin/clientes',
    query: { tutorial: 'cliente-relacionados-listado' },
  },
] as const

const tutorialsVentas = [
  {
    id: 'ventas-caja',
    title: 'Abrir y cerrar caja',
    description: 'Apertura del día, gastos, depósitos y arqueo al cierre.',
    path: '/admin/ventas/caja',
    query: { tutorial: 'ventas-caja' },
  },
  {
    id: 'ventas-pos',
    title: 'Registrar una venta (POS)',
    description: 'Comprobante, cliente, ítems (producto, gas, alquiler, servicio), pago y emisión.',
    path: '/admin/ventas/pos',
    query: { tutorial: 'ventas-pos' },
  },
  {
    id: 'ventas-comprobantes',
    title: 'Consultar y emitir comprobantes',
    description: 'Buscar, estado SUNAT, emitir, orden de salida, anular y PDF.',
    path: '/admin/ventas/comprobantes',
    query: { tutorial: 'ventas-comprobantes' },
  },
  {
    id: 'ventas-sin-documento',
    title: 'Ventas sin documento',
    description: 'Ventas internas con ticket que no se declaran a SUNAT.',
    path: '/admin/ventas/vsd',
    query: { tutorial: 'ventas-sin-documento' },
  },
  {
    id: 'ventas-notas-credito',
    title: 'Notas de crédito',
    description: 'Anular o corregir un comprobante aceptado por SUNAT.',
    path: '/admin/ventas/notas-credito',
    query: { tutorial: 'ventas-notas-credito' },
  },
  {
    id: 'ventas-resumen-diario',
    title: 'Resumen diario de boletas',
    description: 'Declarar a SUNAT las boletas del día y hacer seguimiento.',
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
    path: '/admin/balones/tipos',
    query: { tutorial: 'balones-tipos' },
  },
  {
    id: 'balones-cilindro-crear',
    title: 'Registrar un cilindro',
    description: 'Código, tipo, propiedad y datos de P.H. de cada envase.',
    path: '/admin/balones/cilindros/nuevo',
    query: { tutorial: 'balones-cilindro-crear' },
  },
  {
    id: 'balones-cilindros',
    title: 'Libro de cilindros',
    description: 'Consultar, filtrar, exportar, dar de baja y reactivar cilindros.',
    path: '/admin/balones/cilindros',
    query: { tutorial: 'balones-cilindros' },
  },
  {
    id: 'balones-prestamos',
    title: 'Préstamos de cilindros',
    description: 'Cilindros de la empresa en poder de clientes, antigüedad y devolución.',
    path: '/admin/balones/prestamos',
    query: { tutorial: 'balones-prestamos' },
  },
  {
    id: 'balones-alquileres',
    title: 'Alquileres de accesorios',
    description: 'Vigencia, atrasos, renovación y devolución de accesorios alquilados.',
    path: '/admin/balones/alquileres',
    query: { tutorial: 'balones-alquileres' },
  },
  {
    id: 'balones-rutas-pueblos',
    title: 'Ruta pueblos',
    description: 'Salida de cilindros con chofer, retorno con pesaje y cierre.',
    path: '/admin/balones/rutas-pueblos',
    query: { tutorial: 'balones-rutas-pueblos' },
  },
  {
    id: 'balones-mantenimientos',
    title: 'Mantenimiento y P.H.',
    description: 'Ingreso a taller, prueba hidrostática, proveedor externo y finalización.',
    path: '/admin/balones/mantenimientos/nuevo',
    query: { tutorial: 'balones-mantenimientos' },
  },
] as const

const tutorialsProductos = [
  {
    id: 'productos-catalogo',
    title: 'Catálogo de productos',
    description: 'Gestiona el catálogo completo: gases, accesorios, servicios y más.',
    path: '/admin/productos/articulos',
    query: { tutorial: 'productos-catalogo' },
  },
  {
    id: 'productos-crear',
    title: 'Crear un producto',
    description: 'Registra un nuevo producto con categoría, precios y datos fiscales.',
    path: '/admin/productos/articulos/nuevo',
    query: { tutorial: 'productos-crear' },
  },
  {
    id: 'productos-categorias',
    title: 'Categorías',
    description: 'Administra las categorías de productos del catálogo.',
    path: '/admin/productos/categorias',
    query: { tutorial: 'productos-categorias' },
  },
  {
    id: 'productos-subcategorias',
    title: 'Subcategorías',
    description: 'Organiza los productos en subcategorías dentro de cada categoría.',
    path: '/admin/productos/sub-categorias',
    query: { tutorial: 'productos-subcategorias' },
  },
  {
    id: 'productos-stock',
    title: 'Stock por almacén',
    description: 'Consulta y ajusta las cantidades disponibles en cada almacén.',
    path: '/admin/productos/stock',
    query: { tutorial: 'productos-stock' },
  },
] as const

const tutorialsConfiguracion = [
  {
    id: 'configuracion-empresa',
    title: 'Datos de la empresa',
    description: 'RUC, razón social, dirección fiscal y parámetros operativos.',
    path: '/admin/configuracion/empresas',
    query: { tutorial: 'configuracion-empresa' },
  },
  {
    id: 'configuracion-sucursales',
    title: 'Sucursales',
    description: 'Cada local de la empresa con su caja y almacenes.',
    path: '/admin/configuracion/sucursales',
    query: { tutorial: 'configuracion-sucursales' },
  },
  {
    id: 'configuracion-almacenes',
    title: 'Almacenes',
    description: 'Lugares físicos donde se guarda el stock y los cilindros.',
    path: '/admin/configuracion/almacenes',
    query: { tutorial: 'configuracion-almacenes' },
  },
  {
    id: 'configuracion-choferes',
    title: 'Choferes',
    description: 'Personal habilitado para conducir la flota de la empresa.',
    path: '/admin/configuracion/choferes',
    query: { tutorial: 'configuracion-choferes' },
  },
  {
    id: 'configuracion-vehiculos',
    title: 'Vehículos',
    description: 'Flota de la empresa: placas, documentos y estado.',
    path: '/admin/configuracion/vehiculos',
    query: { tutorial: 'configuracion-vehiculos' },
  },
  {
    id: 'configuracion-cuentas-bancarias',
    title: 'Cuentas bancarias',
    description: 'Cuentas donde se reciben transferencias y depósitos.',
    path: '/admin/configuracion/cuentas-bancarias',
    query: { tutorial: 'configuracion-cuentas-bancarias' },
  },
  {
    id: 'configuracion-condiciones-pago',
    title: 'Condiciones de pago',
    description: 'Plantillas de crédito (contado, 30 días, cuotas) para ventas y compras.',
    path: '/admin/configuracion/condiciones-pago',
    query: { tutorial: 'configuracion-condiciones-pago' },
  },
  {
    id: 'configuracion-servicios',
    title: 'Servicios',
    description: 'Catálogo de servicios que ofrece la empresa (flete, mantenimiento, etc.).',
    path: '/admin/configuracion/servicios',
    query: { tutorial: 'configuracion-servicios' },
  },
  {
    id: 'configuracion-sunat',
    title: 'Configuración SUNAT',
    description: 'Credenciales, certificado digital y datos para comprobantes electrónicos.',
    path: '/admin/configuracion/sunat',
    query: { tutorial: 'configuracion-sunat' },
  },
] as const

const tutorialsCompras = [
  {
    id: 'compras-listado',
    title: 'Listado de compras',
    description: 'Todas las compras registradas: facturas, mercadería, servicios y gastos.',
    path: '/admin/compras',
    query: { tutorial: 'compras-listado' },
  },
  {
    id: 'compras-registrar',
    title: 'Registrar una compra',
    description: 'Comprobante, proveedor, clasificación, detalle y recarga externa.',
    path: '/admin/compras/nuevo',
    query: { tutorial: 'compras-registrar' },
  },
  {
    id: 'compras-gastos-caja',
    title: 'Gastos de caja',
    description: 'Salidas menudas pagadas con dinero de la caja del día.',
    path: '/admin/compras/gastos-caja',
    query: { tutorial: 'compras-gastos-caja' },
  },
] as const

const tutorialsFinanzas = [
  {
    id: 'finanzas-cuentas-cobrar',
    title: 'Cuentas por cobrar',
    description: 'Controla lo que los clientes te deben por ventas al crédito.',
    path: '/admin/finanzas',
    query: { tutorial: 'finanzas-cuentas-cobrar' },
  },
  {
    id: 'finanzas-cuentas-pagar',
    title: 'Cuentas por pagar',
    description: 'Controla lo que la empresa debe a proveedores y otros terceros.',
    path: '/admin/finanzas/pagar',
    query: { tutorial: 'finanzas-cuentas-pagar' },
  },
  {
    id: 'finanzas-garantias',
    title: 'Garantías',
    description: 'Depósitos y garantías de clientes, seguimiento y devolución.',
    path: '/admin/finanzas/garantias',
    query: { tutorial: 'finanzas-garantias' },
  },
  {
    id: 'finanzas-libro-diario',
    title: 'Libro diario',
    description: 'Asientos contables generados automáticamente por cada movimiento.',
    path: '/admin/finanzas/libro-diario',
    query: { tutorial: 'finanzas-libro-diario' },
  },
] as const

const tutorialsInventario = [
  {
    id: 'inventario-movimientos',
    title: 'Movimientos de inventario',
    description: 'Historial de entradas y salidas de stock: compras, ventas, ajustes y traslados.',
    path: '/admin/inventario/movimientos',
    query: { tutorial: 'inventario-movimientos' },
  },
  {
    id: 'inventario-documentos-salida',
    title: 'Documentos de salida',
    description: 'Órdenes de salida para entregar productos a clientes o trasladar.',
    path: '/admin/inventario/documentos-salida',
    query: { tutorial: 'inventario-documentos-salida' },
  },
] as const

const tutorialsActividades = [
  {
    id: 'actividades',
    title: 'Actividades operativas',
    description: 'Agenda de entregas, recojos, visitas y mantenimientos con calendario.',
    path: '/admin/operativa/actividades',
    query: { tutorial: 'actividades' },
  },
] as const

const tutorialsGestion = [
  {
    id: 'gestion-trabajadores',
    title: 'Trabajadores',
    description: 'Padrón de personal, áreas, cargos, acceso al sistema y choferes.',
    path: '/admin/trabajadores',
    query: { tutorial: 'gestion-trabajadores' },
  },
  {
    id: 'gestion-activos',
    title: 'Activos fijos',
    description: 'Inventario de bienes de la empresa: básculas, compresores, herramientas.',
    path: '/admin/activos',
    query: { tutorial: 'gestion-activos' },
  },
  {
    id: 'gestion-documentos-vencimiento',
    title: 'Documentos por vencer',
    description: 'Seguimiento de licencias, soats, permisos y documentos con fecha de expiración.',
    path: '/admin/documentos-vencimiento',
    query: { tutorial: 'gestion-documentos-vencimiento' },
  },
] as const

const tutorialsSistema = [
  {
    id: 'sistema-usuarios',
    title: 'Usuarios',
    description: 'Cuentas de acceso al sistema con roles y permisos.',
    path: '/admin/usuarios',
    query: { tutorial: 'sistema-usuarios' },
  },
  {
    id: 'sistema-roles',
    title: 'Roles',
    description: 'Perfiles de acceso que agrupan permisos por función.',
    path: '/admin/roles',
    query: { tutorial: 'sistema-roles' },
  },
  {
    id: 'sistema-permisos',
    title: 'Permisos',
    description: 'Detalles de qué puede hacer cada rol en el sistema.',
    path: '/admin/permisos',
    query: { tutorial: 'sistema-permisos' },
  },
] as const

const tutorialGroups = [
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
