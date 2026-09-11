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

const tutorials = [
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

const tutorialGroups = [
  {
    title: 'Módulo Clientes',
    icon: ICONS.users,
    tutorials,
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
] as const

const allTutorials = [...tutorials, ...tutorialsVentas, ...tutorialsBalones]

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
