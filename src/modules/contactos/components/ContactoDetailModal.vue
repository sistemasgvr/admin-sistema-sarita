<template>
  <AppModal
    v-model="open"
    title="Detalle del contacto"
    :subtitle="contacto ? getContactoNombre(contacto) : undefined"
    size="lg"
  >
    <div v-if="contacto" class="space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <AppBadge :color="contacto.estado === 1 ? 'success' : 'error'">
          {{ contacto.estado === 1 ? 'Activo' : 'Inactivo' }}
        </AppBadge>
        <AppBadge v-if="contacto.es_principal" color="primary" :icon="ICONS.star">
          Principal
        </AppBadge>
      </div>

      <section
        v-for="section in sections"
        :key="section.title"
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <h5 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
          {{ section.title }}
        </h5>

        <dl class="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <div
            v-for="item in section.items"
            :key="item.label"
            :class="item.fullWidth ? 'sm:col-span-2' : ''"
          >
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">{{ item.label }}</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ item.value ?? '—' }}
            </dd>
          </div>
        </dl>
      </section>

      <section
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <h5 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">Auditoría</h5>
        <dl class="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <div>
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Creado por</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ contacto.nombre_usuario_creacion ?? '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Fecha de creación</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ formatDateTime(contacto.fecha_creacion) }}
            </dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Modificado por</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ contacto.nombre_usuario_modificacion ?? '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Última modificación</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ formatDateTime(contacto.fecha_modificacion) }}
            </dd>
          </div>
        </dl>
      </section>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        @click="open = false"
      >
        Cerrar
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Contacto } from '@/modules/contactos/interfaces/contacto.interface'
import { useContactoDetailQuery } from '@/modules/contactos/composables/useContactoDetailQuery'
import { AppBadge, AppModal } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'
import { formatDateTime } from '@/shared/utils/date'

interface ContactoDetailModalProps {
  contacto?: Contacto | null
}

const props = defineProps<ContactoDetailModalProps>()

const open = defineModel<boolean>({ default: false })

const idReferencia = computed(() => props.contacto?.id)
const contactoDetailQuery = useContactoDetailQuery(idReferencia, open)
const contacto = computed<Contacto | null>(
  () => contactoDetailQuery.data.value ?? props.contacto ?? null,
)

const getClienteNombreEmbebido = (c: Contacto): string | null => {
  if (c.cliente_razon_social) return c.cliente_razon_social

  const nombreCompleto = [c.cliente_nombres, c.cliente_apellido_paterno, c.cliente_apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()

  return nombreCompleto || c.cliente_numero_documento || null
}

const getContactoNombre = (contacto: Contacto) =>
  [contacto.nombre, contacto.apellido_paterno, contacto.apellido_materno].filter(Boolean).join(' ').trim()

interface DetailItem {
  label: string
  value: string | null
  fullWidth?: boolean
}

interface DetailSection {
  title: string
  items: DetailItem[]
}

const sections = computed<DetailSection[]>(() => {
  const c = contacto.value
  if (!c) return []

  return [
    {
      title: 'Datos generales',
      items: [
        { label: 'Nombre completo', value: getContactoNombre(c) },
        { label: 'Cliente / Proveedor', value: getClienteNombreEmbebido(c) ?? null },
        { label: 'Dirección', value: c.direccion ?? null, fullWidth: true },
      ],
    },
    {
      title: 'Contacto',
      items: [
        { label: 'Correo', value: c.email ?? null },
        { label: 'Teléfono 1', value: c.telefono1 ?? null },
        { label: 'Teléfono 2', value: c.telefono2 ?? null },
        { label: 'Teléfono 3', value: c.telefono3 ?? null },
      ],
    },
  ]
})
</script>
