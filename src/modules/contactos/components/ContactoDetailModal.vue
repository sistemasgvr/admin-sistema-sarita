<template>
  <AppModal
    v-model="open"
    title="Detalle del contacto"
    :subtitle="contacto ? getContactoNombre(contacto) : undefined"
    size="lg"
  >
    <div v-if="!contacto" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
      No se encontró información del contacto.
    </div>

    <div v-else class="space-y-4">
      <div class="flex items-start justify-between gap-3 rounded-xl border border-gray-200  p-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <div class="flex items-center gap-3">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            {{ iniciales }}
          </span>
          <div>
            <p class="text-sm font-semibold text-gray-800 dark:text-white/90">
              {{ getContactoNombre(contacto) || 'Sin nombre' }}
            </p>
            <p v-if="clienteEmbebido" class="text-xs text-gray-500 dark:text-gray-400">
              {{ clienteEmbebido }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-end gap-2">
          <AppBadge :color="contacto.estado === 1 ? 'success' : 'error'">
            {{ contacto.estado === 1 ? 'Activo' : 'Inactivo' }}
          </AppBadge>
          <AppBadge v-if="contacto.es_principal" color="primary" :icon="ICONS.star">
            Principal
          </AppBadge>
        </div>
      </div>

      <section
        v-for="section in sections"
        :key="section.title"
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <header class="mb-3 flex items-center gap-2.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <AppIcon :name="section.icon" :size="16" />
          </span>
          <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">
            {{ section.title }}
          </h5>
        </header>

        <dl class="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <div
            v-for="item in section.items"
            :key="item.label"
            :class="item.fullWidth ? 'sm:col-span-2' : ''"
          >
            <dt class="flex items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
              <AppIcon v-if="item.icon" :name="item.icon" :size="12" class="shrink-0" />
              {{ item.label }}
            </dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ item.value ?? '—' }}
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
import AppIcon from '@/shared/components/AppIcon.vue'
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

const clienteEmbebido = computed(() =>
  contacto.value ? getClienteNombreEmbebido(contacto.value) : null,
)

const getContactoNombre = (contacto: Contacto) =>
  [contacto.nombre, contacto.apellido_paterno, contacto.apellido_materno].filter(Boolean).join(' ').trim()

const iniciales = computed(() => {
  const c = contacto.value
  if (!c) return '—'
  const n = c.nombre?.trim()?.[0] ?? ''
  const a = c.apellido_paterno?.trim()?.[0] ?? ''
  const resultado = `${n}${a}`.toUpperCase()
  return resultado || '—'
})

interface DetailItem {
  label: string
  value: string | null
  fullWidth?: boolean
  icon?: string
}

interface DetailSection {
  title: string
  icon: string
  items: DetailItem[]
}

const sections = computed<DetailSection[]>(() => {
  const c = contacto.value
  if (!c) return []

  return [
    {
      title: 'Datos generales',
      icon: ICONS.userCircle,
      items: [
        { label: 'Nombre completo', value: getContactoNombre(c) },
        { label: 'Cliente / Proveedor', value: getClienteNombreEmbebido(c) ?? null },
        { label: 'Dirección', value: c.direccion ?? null, fullWidth: true },
      ],
    },
    {
      title: 'Contacto',
      icon: ICONS.phone,
      items: [
        { label: 'Correo', value: c.email ?? null, icon: ICONS.mail },
        { label: 'Teléfono 1', value: c.telefono1 ?? null, icon: ICONS.phone },
        { label: 'Teléfono 2', value: c.telefono2 ?? null, icon: ICONS.phone },
        { label: 'Teléfono 3', value: c.telefono3 ?? null, icon: ICONS.phone },
      ],
    },
    {
      title: 'Auditoría',
      icon: ICONS.history,
      items: [
        { label: 'Creado por', value: c.nombre_usuario_creacion ?? null },
        { label: 'Fecha de creación', value: formatDateTime(c.fecha_creacion) },
        { label: 'Modificado por', value: c.nombre_usuario_modificacion ?? null },
        { label: 'Última modificación', value: formatDateTime(c.fecha_modificacion) },
      ],
    },
  ]
})
</script>