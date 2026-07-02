<template>
  <AppModal
    v-model="open"
    title="Detalle del cliente"
    :subtitle="cliente ? getNombreCliente(cliente) : undefined"
    size="lg"
  >
    <div v-if="cliente" class="space-y-6">
      <div class="flex flex-wrap items-center gap-2">
        <AppBadge :color="cliente.estado === 1 ? 'success' : 'error'">
          {{ cliente.estado === 1 ? 'Activo' : 'Inactivo' }}
        </AppBadge>
        <AppBadge v-if="cliente.nombre_tipo_persona" color="primary">
          {{ cliente.nombre_tipo_persona }}
        </AppBadge>
        <AppBadge v-if="cliente.nombre_tipo_cliente" color="neutral">
          {{ cliente.nombre_tipo_cliente }}
        </AppBadge>
      </div>

      <section v-for="section in sections" :key="section.title" class="space-y-3">
        <div class="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0 dark:border-gray-800">
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
        </div>
      </section>

      <section class="space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <h5 class="mb-1 text-sm font-semibold text-gray-800 dark:text-white/90">
          Configuración SUNAT
        </h5>
        <div class="flex flex-wrap gap-1.5">
          <AppBadge :color="cliente.es_agente_percepcion ? 'success' : 'neutral'">
            Agente de percepción: {{ cliente.es_agente_percepcion ? 'Sí' : 'No' }}
          </AppBadge>
          <AppBadge :color="cliente.es_buen_contribuyente ? 'success' : 'neutral'">
            Buen contribuyente: {{ cliente.es_buen_contribuyente ? 'Sí' : 'No' }}
          </AppBadge>
          <AppBadge :color="cliente.es_agente_retenedor ? 'success' : 'neutral'">
            Agente retenedor: {{ cliente.es_agente_retenedor ? 'Sí' : 'No' }}
          </AppBadge>
          <AppBadge :color="cliente.afecto_rus ? 'success' : 'neutral'">
            Afecto a RUS: {{ cliente.afecto_rus ? 'Sí' : 'No' }}
          </AppBadge>
        </div>
      </section>

      <section
        v-if="cliente.observacion"
        class="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800"
      >
        <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">Observación</h5>
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ cliente.observacion }}</p>
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
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import { AppBadge, AppModal } from '@/shared/components'
import { formatDateTime } from '@/shared/utils/date'

interface ClienteDetailModalProps {
  cliente?: Cliente | null
}

const props = defineProps<ClienteDetailModalProps>()

const open = defineModel<boolean>({ default: false })

const getNombreCliente = (cliente: Cliente) => {
  if (cliente.razon_social) return cliente.razon_social
  return (
    [cliente.nombres, cliente.apellido_paterno, cliente.apellido_materno]
      .filter(Boolean)
      .join(' ')
      .trim() || cliente.numero_documento
  )
}

const formatId = (id?: number | null) => (id ? `#${id}` : null)

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
  const cliente = props.cliente
  if (!cliente) return []

  const nombreCompleto = [cliente.nombres, cliente.apellido_paterno, cliente.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()

  const datosGenerales: DetailItem[] = [
    { label: 'Código interno', value: cliente.codigo_interno || null },
  ]

  if (cliente.razon_social) {
    datosGenerales.push({ label: 'Razón social', value: cliente.razon_social })
  }
  if (nombreCompleto) {
    datosGenerales.push({ label: 'Nombre completo', value: nombreCompleto })
  }

  datosGenerales.push({
    label: 'Documento',
    value: `${cliente.nombre_tipo_documento ?? 'Doc.'} ${cliente.numero_documento}`,
  })

  return [
    { title: 'Datos generales', items: datosGenerales },
    {
      title: 'Contacto y ubicación',
      items: [
        { label: 'Teléfono', value: cliente.telefono ?? null },
        { label: 'Correo', value: cliente.email ?? null },
        { label: 'Dirección', value: cliente.direccion ?? null, fullWidth: true },
        { label: 'Referencia', value: cliente.referencia ?? null, fullWidth: true },
        { label: 'País', value: cliente.nombre_pais ?? formatId(cliente.id_pais) },
        {
          label: 'Departamento',
          value: cliente.nombre_departamento ?? formatId(cliente.id_departamento),
        },
        { label: 'Provincia', value: cliente.nombre_provincia ?? formatId(cliente.id_provincia) },
        { label: 'Distrito', value: cliente.nombre_distrito ?? formatId(cliente.id_distrito) },
      ],
    },
    {
      title: 'Auditoría',
      items: [
        { label: 'Creado por', value: cliente.nombre_usuario_creacion ?? null },
        { label: 'Fecha de creación', value: formatDateTime(cliente.fecha_creacion) },
        { label: 'Modificado por', value: cliente.nombre_usuario_modificacion ?? null },
        { label: 'Última modificación', value: formatDateTime(cliente.fecha_modificacion) },
      ],
    },
  ]
})
</script>
