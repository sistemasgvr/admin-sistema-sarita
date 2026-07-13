<template>
  <AppModal
    v-model="open"
    title="Detalle del cliente"
    :subtitle="cliente ? getNombreCliente(cliente) : undefined"
    size="xl"
  >
    <div v-if="cliente" class="space-y-4">
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
        <h5 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
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
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <h5 class="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">Observación</h5>
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ cliente.observacion }}</p>
      </section>

      <section
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <h5 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
          Auditoría
        </h5>
        <dl class="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <div>
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Creado por</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ cliente.nombre_usuario_creacion ?? '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Fecha de creación</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ formatDateTime(cliente.fecha_creacion) }}
            </dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Modificado por</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ cliente.nombre_usuario_modificacion ?? '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-500 dark:text-gray-400">Última modificación</dt>
            <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
              {{ formatDateTime(cliente.fecha_modificacion) }}
            </dd>
          </div>
        </dl>
      </section>

      <section
        class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40"
      >
        <h5 class="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
          Información relacionada
        </h5>

        <div class="flex flex-wrap gap-1.5 border-b border-gray-100 pb-3 dark:border-gray-800">
          <button
            v-for="tab in relatedTabs"
            :key="tab.key"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition"
            :class="
              activeTab === tab.key
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10'
            "
            @click="activeTab = tab.key"
          >
            <AppIcon :name="tab.icon" :size="14" />
            {{ tab.label }}
            <span
              v-if="tab.count !== null"
              class="rounded-full px-1.5 text-theme-xs"
              :class="activeTab === tab.key ? 'bg-white/20' : 'bg-gray-200 dark:bg-white/10'"
            >
              {{ tab.count }}
            </span>
          </button>
        </div>

        <div class="mt-3">
          <!-- Contactos -->
          <div v-if="activeTab === 'contactos'">
            <RelatedListState
              :loading="contactosQuery.isLoading.value"
              :error="contactosQuery.isError.value"
              :empty="!contactosItems.length"
              empty-text="Este cliente no tiene contactos registrados."
              @retry="contactosQuery.refetch()"
            >
              <div class="space-y-2">
                <div
                  v-for="contacto in contactosItems"
                  :key="contacto.id"
                  class="rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                >
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                      {{ getNombreCompleto(contacto.nombre, contacto.apellido_paterno, contacto.apellido_materno) }}
                    </p>
                    <div class="flex flex-wrap items-center gap-1.5">
                      <AppBadge v-if="contacto.es_principal" size="sm" color="primary" :icon="ICONS.star">
                        Principal
                      </AppBadge>
                      <AppBadge size="sm" :color="contacto.estado === 1 ? 'success' : 'error'">
                        {{ contacto.estado === 1 ? 'Activo' : 'Inactivo' }}
                      </AppBadge>
                    </div>
                  </div>
                  <div
                    class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-theme-xs text-gray-500 dark:text-gray-400"
                  >
                    <span v-if="contacto.telefono1" class="inline-flex items-center gap-1">
                      <AppIcon :name="ICONS.phone" :size="13" />{{ contacto.telefono1 }}
                    </span>
                    <span v-if="contacto.telefono2" class="inline-flex items-center gap-1">
                      <AppIcon :name="ICONS.phone" :size="13" />{{ contacto.telefono2 }}
                    </span>
                    <span v-if="contacto.email" class="inline-flex items-center gap-1">
                      <AppIcon :name="ICONS.mail" :size="13" />{{ contacto.email }}
                    </span>
                    <span v-if="contacto.direccion" class="inline-flex items-center gap-1">
                      <AppIcon :name="ICONS.mapPin" :size="13" />{{ contacto.direccion }}
                    </span>
                  </div>
                </div>
              </div>
            </RelatedListState>
          </div>

          <!-- Direcciones -->
          <div v-if="activeTab === 'direcciones'">
            <RelatedListState
              :loading="direccionesQuery.isLoading.value"
              :error="direccionesQuery.isError.value"
              :empty="!direccionesItems.length"
              empty-text="Este cliente no tiene direcciones registradas."
              @retry="direccionesQuery.refetch()"
            >
              <div class="space-y-2">
                <div
                  v-for="dir in direccionesItems"
                  :key="dir.id"
                  class="rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                >
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                        {{ dir.descripcion || dir.direccion }}
                      </p>
                      <p v-if="dir.descripcion" class="text-theme-xs text-gray-500 dark:text-gray-400">
                        {{ dir.direccion }}
                      </p>
                    </div>
                    <div class="flex flex-wrap items-center gap-1.5">
                      <AppBadge v-if="dir.es_principal" size="sm" color="primary" :icon="ICONS.star">
                        Principal
                      </AppBadge>
                      <AppBadge size="sm" :color="dir.estado === 1 ? 'success' : 'error'">
                        {{ dir.estado === 1 ? 'Activo' : 'Inactivo' }}
                      </AppBadge>
                    </div>
                  </div>
                  <p class="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
                    {{ getUbigeoTexto(dir) }}
                  </p>
                  <p v-if="dir.referencia" class="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                    Referencia: {{ dir.referencia }}
                  </p>
                </div>
              </div>
            </RelatedListState>
          </div>

          <!-- Choferes -->
          <div v-if="activeTab === 'choferes'">
            <RelatedListState
              :loading="choferesQuery.isLoading.value"
              :error="choferesQuery.isError.value"
              :empty="!choferesItems.length"
              empty-text="Este cliente no tiene choferes registrados."
              @retry="choferesQuery.refetch()"
            >
              <div class="space-y-2">
                <div
                  v-for="chofer in choferesItems"
                  :key="chofer.id"
                  class="rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                >
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                        {{ getNombreCompleto(chofer.nombres, chofer.apellido_paterno, chofer.apellido_materno) }}
                      </p>
                      <p class="text-theme-xs text-gray-500 dark:text-gray-400">
                        {{ chofer.nombre_tipo_documento }} {{ chofer.numero_documento }}
                      </p>
                    </div>
                    <AppBadge size="sm" :color="chofer.estado === 1 ? 'success' : 'error'">
                      {{ chofer.estado === 1 ? 'Activo' : 'Inactivo' }}
                    </AppBadge>
                  </div>
                  <div
                    class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-theme-xs text-gray-500 dark:text-gray-400"
                  >
                    <span v-if="chofer.telefono" class="inline-flex items-center gap-1">
                      <AppIcon :name="ICONS.phone" :size="13" />{{ chofer.telefono }}
                    </span>
                    <span v-if="chofer.codigo_licencia" class="inline-flex items-center gap-1">
                      <AppIcon :name="ICONS.idCard" :size="13" />
                      {{ chofer.codigo_licencia }}
                      <template v-if="chofer.nombre_categoria_licencia">
                        ({{ chofer.nombre_categoria_licencia }})
                      </template>
                    </span>
                    <span v-if="chofer.fecha_vencimiento">
                      Vence: {{ formatDate(chofer.fecha_vencimiento) }}
                    </span>
                  </div>
                </div>
              </div>
            </RelatedListState>
          </div>

          <!-- Vehículos -->
          <div v-if="activeTab === 'vehiculos'">
            <RelatedListState
              :loading="vehiculosQuery.isLoading.value"
              :error="vehiculosQuery.isError.value"
              :empty="!vehiculosItems.length"
              empty-text="Este cliente no tiene vehículos registrados."
              @retry="vehiculosQuery.refetch()"
            >
              <div class="space-y-2">
                <div
                  v-for="vehiculo in vehiculosItems"
                  :key="vehiculo.id"
                  class="rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                >
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                        {{ vehiculo.placa }}
                        <span v-if="vehiculo.placa2" class="font-normal text-gray-500">
                          / {{ vehiculo.placa2 }}
                        </span>
                      </p>
                      <p v-if="vehiculo.nombre_tipo_vehiculo" class="text-theme-xs text-gray-500 dark:text-gray-400">
                        {{ vehiculo.nombre_tipo_vehiculo }}
                      </p>
                    </div>
                    <AppBadge size="sm" :color="vehiculo.estado === 1 ? 'success' : 'error'">
                      {{ vehiculo.estado === 1 ? 'Activo' : 'Inactivo' }}
                    </AppBadge>
                  </div>
                  <p class="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
                    {{ getVehiculoDescripcion(vehiculo) }}
                  </p>
                </div>
              </div>
            </RelatedListState>
          </div>
        </div>
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
import { computed, ref, watch } from 'vue'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import { useClienteDetailQuery } from '@/modules/clientes/composables/useClienteDetailQuery'
import { AppBadge, AppModal } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS, type IconName } from '@/shared/constants/icons'
import { formatDate, formatDateTime } from '@/shared/utils/date'
import RelatedListState from '@/modules/clientes/components/RelatedListState.vue'

import { useContactosQuery } from '@/modules/contactos/composables/useContactosQuery'
import type { Contacto, ContactoListFilters } from '@/modules/contactos/interfaces/contacto.interface'

import { useDireccionesQuery } from '@/modules/direcciones/composables/useDireccionesQuery'
import type { Direccion, DireccionListFilters } from '@/modules/direcciones/interfaces/direccion.interface'

import { useChoferesQuery } from '@/modules/choferes/composables/useChoferesQuery'
import type { Chofer, ChoferListFilters } from '@/modules/choferes/interfaces/chofer.interface'

import { useVehiculosQuery } from '@/modules/vehiculos/composables/useVehiculosQuery'
import type { Vehiculo, VehiculoListFilters } from '@/modules/vehiculos/interfaces/vehiculo.interface'

interface ClienteDetailModalProps {
  cliente?: Cliente | null
}

const props = defineProps<ClienteDetailModalProps>()

const open = defineModel<boolean>({ default: false })

const idReferencia = computed(() => props.cliente?.id)
const clienteDetailQuery = useClienteDetailQuery(idReferencia, open)
const cliente = computed<Cliente | null>(() => clienteDetailQuery.data.value ?? props.cliente ?? null)
//const isLoadingCliente = computed(() => clienteDetailQuery.isLoading.value && !props.cliente)

const getNombreCliente = (cliente: Cliente) => {
  if (cliente.razon_social) return cliente.razon_social
  return (
    [cliente.nombres, cliente.apellido_paterno, cliente.apellido_materno]
      .filter(Boolean)
      .join(' ')
      .trim() || cliente.numero_documento
  )
}

const getNombreCompleto = (
  nombre?: string | null,
  apellidoPaterno?: string | null,
  apellidoMaterno?: string | null,
) => [nombre, apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ').trim() || '—'

const getUbigeoTexto = (dir: Direccion) => {
  const partes = [dir.nombre_distrito, dir.nombre_provincia, dir.nombre_departamento, dir.nombre_pais].filter(
    Boolean,
  )
  return partes.length ? partes.join(', ') : 'Sin ubigeo registrado'
}

const getVehiculoDescripcion = (vehiculo: Vehiculo) => {
  const partes = [vehiculo.marca, vehiculo.modelo, vehiculo.anio ? String(vehiculo.anio) : null, vehiculo.color]
  return partes.filter(Boolean).join(' · ') || 'Sin datos adicionales'
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
  const c = cliente.value
  if (!c) return []

  const nombreCompleto = [c.nombres, c.apellido_paterno, c.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()

  const datosGenerales: DetailItem[] = [
    { label: 'Código interno', value: c.codigo_interno || null },
  ]

  if (c.razon_social) {
    datosGenerales.push({ label: 'Razón social', value: c.razon_social })
  }
  if (c.nombre_comercial) {
    datosGenerales.push({ label: 'Nombre comercial', value: c.nombre_comercial })
  }
  if (nombreCompleto) {
    datosGenerales.push({ label: 'Nombre completo', value: nombreCompleto })
  }

  datosGenerales.push({
    label: 'Documento',
    value: `${c.nombre_tipo_documento ?? 'Doc.'} ${c.numero_documento}`,
  })

  return [
    { title: 'Datos generales', items: datosGenerales },
    {
      title: 'Contacto y ubicación',
      items: [
        { label: 'Teléfono', value: c.telefono ?? null },
        { label: 'Correo', value: c.email ?? null },
        { label: 'Dirección', value: c.direccion ?? null, fullWidth: true },
        { label: 'Referencia', value: c.referencia ?? null, fullWidth: true },
        { label: 'País', value: c.nombre_pais ?? formatId(c.id_pais) },
        {
          label: 'Departamento',
          value: c.nombre_departamento ?? formatId(c.id_departamento),
        },
        { label: 'Provincia', value: c.nombre_provincia ?? formatId(c.id_provincia) },
        { label: 'Distrito', value: c.nombre_distrito ?? formatId(c.id_distrito) },
      ],
    },
  ]
})

type RelatedTabKey = 'contactos' | 'direcciones' | 'choferes' | 'vehiculos'

const activeTab = ref<RelatedTabKey>('contactos')
const idCliente = computed(() => cliente.value?.id)

const shouldFetchRelatedData = computed(() => open.value && Boolean(idCliente.value))

const contactosFilters = computed<ContactoListFilters>(() => ({
  idCliente: idCliente.value,
  limite: 50,
  soloActivos: null,
}))
const contactosQuery = useContactosQuery(contactosFilters, shouldFetchRelatedData)
const contactosItems = computed<Contacto[]>(() => contactosQuery.data.value?.data ?? [])

// Direcciones
const direccionesFilters = computed<DireccionListFilters>(() => ({
  idCliente: idCliente.value,
  limite: 50,
  soloActivos: null,
}))
const direccionesQuery = useDireccionesQuery(direccionesFilters, shouldFetchRelatedData)
const direccionesItems = computed<Direccion[]>(() => direccionesQuery.data.value?.data ?? [])

// Choferes
const choferesFilters = computed<ChoferListFilters>(() => ({
  idCliente: idCliente.value,
  limite: 50,
  isActivos: null,
}))
const choferesQuery = useChoferesQuery(choferesFilters, shouldFetchRelatedData)
const choferesItems = computed<Chofer[]>(() => choferesQuery.data.value?.data ?? [])

// Vehículos
const vehiculosFilters = computed<VehiculoListFilters>(() => ({
  idCliente: idCliente.value,
  limite: 50,
  isActivos: null,
}))
const vehiculosQuery = useVehiculosQuery(vehiculosFilters, shouldFetchRelatedData)
const vehiculosItems = computed<Vehiculo[]>(() => vehiculosQuery.data.value?.data ?? [])

interface RelatedTab {
  key: RelatedTabKey
  label: string
  icon: IconName
  count: number | null
}

const relatedTabs = computed<RelatedTab[]>(() => [
  {
    key: 'contactos',
    label: 'Contactos',
    icon: ICONS.contact,
    count: contactosQuery.data.value?.meta.total ?? (contactosQuery.isSuccess.value ? contactosItems.value.length : null),
  },
  {
    key: 'direcciones',
    label: 'Direcciones',
    icon: ICONS.mapPin,
    count:
      direccionesQuery.data.value?.meta.total ??
      (direccionesQuery.isSuccess.value ? direccionesItems.value.length : null),
  },
  {
    key: 'choferes',
    label: 'Choferes',
    icon: ICONS.idCard,
    count: choferesQuery.data.value?.meta.total ?? (choferesQuery.isSuccess.value ? choferesItems.value.length : null),
  },
  {
    key: 'vehiculos',
    label: 'Vehículos',
    icon: ICONS.car,
    count:
      vehiculosQuery.data.value?.meta.total ?? (vehiculosQuery.isSuccess.value ? vehiculosItems.value.length : null),
  },
])

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      activeTab.value = 'contactos'
    }
  },
)

watch(
  () => props.cliente?.id,
  () => {
    activeTab.value = 'contactos'
  },
)
</script>
