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
] as const

const tutorialGroups = [
  {
    title: 'Módulo Clientes',
    icon: ICONS.users,
    tutorials,
  },
] as const

const router = useRouter()
const selectedTutorialId = ref<string>('crear-cliente')
const iframeVersion = ref(0)
const tutorialFinished = ref(false)
const selectedTutorial = computed(
  () => tutorials.find((tutorial) => tutorial.id === selectedTutorialId.value) ?? tutorials[0],
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
