<template>
  <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/40">
    <AppTabs v-model="activeTab" :tabs="tabs" inline full-width />

    <!-- Contactos -->
    <div v-show="activeTab === 'contactos'" class="pt-4">
      <div class="mb-3 flex justify-end">
        <button type="button" class="app-related-add" @click="openCreateContacto">
          <AppIcon :name="ICONS.plus" :size="16" />
          Nuevo contacto
        </button>
      </div>
      <p v-if="contactosQuery.isFetching.value" class="app-related-empty">Cargando...</p>
      <p v-else-if="!contactosRows.length" class="app-related-empty">Sin contactos registrados</p>
      <div v-else class="space-y-2">
        <div v-for="c in contactosRows" :key="c.id" class="app-related-row">
          <div class="min-w-0">
            <p class="truncate font-medium text-gray-800 dark:text-white/90">
              {{ [c.nombre, c.apellido_paterno, c.apellido_materno].filter(Boolean).join(' ') }}
              <AppBadge v-if="c.es_principal" size="sm" color="neutral" class="ml-1">Principal</AppBadge>
            </p>
            <p class="truncate text-xs text-gray-500 dark:text-gray-400">
              {{ c.telefono1 || '—' }} · {{ c.email || '—' }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <AppBadge :color="c.estado === 1 ? 'success' : 'error'" size="sm">
              {{ c.estado === 1 ? 'Activo' : 'Inactivo' }}
            </AppBadge>
            <button type="button" class="app-related-edit" title="Editar contacto" @click="openEditContacto(c)">
              <AppIcon :name="ICONS.pencil" :size="15" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Direcciones -->
    <div v-show="activeTab === 'direcciones'" class="pt-4">
      <div class="mb-3 flex justify-end">
        <button type="button" class="app-related-add" @click="openCreateDireccion">
          <AppIcon :name="ICONS.plus" :size="16" />
          Nueva dirección
        </button>
      </div>
      <p v-if="direccionesQuery.isFetching.value" class="app-related-empty">Cargando...</p>
      <p v-else-if="!direccionesRows.length" class="app-related-empty">Sin direcciones registradas</p>
      <div v-else class="space-y-2">
        <div v-for="d in direccionesRows" :key="d.id" class="app-related-row">
          <div class="min-w-0">
            <p class="truncate font-medium text-gray-800 dark:text-white/90">
              {{ d.direccion }}
              <AppBadge v-if="d.es_principal" size="sm" color="neutral" class="ml-1">Principal</AppBadge>
            </p>
            <p class="truncate text-xs text-gray-500 dark:text-gray-400">
              {{ [d.nombre_distrito, d.nombre_provincia].filter(Boolean).join(' / ') || '—' }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <AppBadge :color="d.estado === 1 ? 'success' : 'error'" size="sm">
              {{ d.estado === 1 ? 'Activo' : 'Inactivo' }}
            </AppBadge>
            <button type="button" class="app-related-edit" title="Editar dirección" @click="openEditDireccion(d)">
              <AppIcon :name="ICONS.pencil" :size="15" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Choferes -->
    <div v-show="activeTab === 'choferes'" class="pt-4">
      <div class="mb-3 flex justify-end">
        <button type="button" class="app-related-add" @click="openCreateChofer">
          <AppIcon :name="ICONS.plus" :size="16" />
          Nuevo chofer
        </button>
      </div>
      <p v-if="choferesQuery.isFetching.value" class="app-related-empty">Cargando...</p>
      <p v-else-if="!choferesRows.length" class="app-related-empty">Sin choferes registrados</p>
      <div v-else class="space-y-2">
        <div v-for="c in choferesRows" :key="c.id" class="app-related-row">
          <div class="min-w-0">
            <p class="truncate font-medium text-gray-800 dark:text-white/90">
              {{ [c.nombres, c.apellido_paterno, c.apellido_materno].filter(Boolean).join(' ') }}
            </p>
            <p class="truncate text-xs text-gray-500 dark:text-gray-400">
              {{ c.nombre_tipo_documento }} {{ c.numero_documento }} · {{ c.telefono || '—' }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <AppBadge :color="c.estado === 1 ? 'success' : 'error'" size="sm">
              {{ c.estado === 1 ? 'Activo' : 'Inactivo' }}
            </AppBadge>
            <button type="button" class="app-related-edit" title="Editar chofer" @click="openEditChofer(c)">
              <AppIcon :name="ICONS.pencil" :size="15" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Vehículos -->
    <div v-show="activeTab === 'vehiculos'" class="pt-4">
      <div class="mb-3 flex justify-end">
        <button type="button" class="app-related-add" @click="openCreateVehiculo">
          <AppIcon :name="ICONS.plus" :size="16" />
          Nuevo vehículo
        </button>
      </div>
      <p v-if="vehiculosQuery.isFetching.value" class="app-related-empty">Cargando...</p>
      <p v-else-if="!vehiculosRows.length" class="app-related-empty">Sin vehículos registrados</p>
      <div v-else class="space-y-2">
        <div v-for="v in vehiculosRows" :key="v.id" class="app-related-row">
          <div class="min-w-0">
            <p class="truncate font-medium text-gray-800 dark:text-white/90">{{ v.placa }}</p>
            <p class="truncate text-xs text-gray-500 dark:text-gray-400">
              {{ [v.marca, v.modelo].filter(Boolean).join(' ') || '—' }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <AppBadge :color="v.estado === 1 ? 'success' : 'error'" size="sm">
              {{ v.estado === 1 ? 'Activo' : 'Inactivo' }}
            </AppBadge>
            <button type="button" class="app-related-edit" title="Editar vehículo" @click="openEditVehiculo(v)">
              <AppIcon :name="ICONS.pencil" :size="15" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cuentas bancarias -->
    <div v-show="activeTab === 'cuentas-bancarias'" class="pt-4">
      <div class="mb-3 flex justify-end">
        <button type="button" class="app-related-add" @click="openCreateCuenta">
          <AppIcon :name="ICONS.plus" :size="16" />
          Nueva cuenta
        </button>
      </div>
      <p v-if="cuentasQuery.isFetching.value" class="app-related-empty">Cargando...</p>
      <p v-else-if="!cuentasRows.length" class="app-related-empty">Sin cuentas bancarias registradas</p>
      <div v-else class="space-y-2">
        <div v-for="cb in cuentasRows" :key="cb.id" class="app-related-row">
          <div class="min-w-0">
            <p class="truncate font-medium text-gray-800 dark:text-white/90">
              {{ cb.titular || '—' }}
              <AppBadge v-if="cb.es_principal" size="sm" color="neutral" class="ml-1">Principal</AppBadge>
            </p>
            <p class="truncate text-xs text-gray-500 dark:text-gray-400">
              {{ cb.nombre_banco }} · {{ cb.numero_cuenta || '—' }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <AppBadge :color="cb.estado === 1 ? 'success' : 'error'" size="sm">
              {{ cb.estado === 1 ? 'Activo' : 'Inactivo' }}
            </AppBadge>
            <button type="button" class="app-related-edit" title="Editar cuenta" @click="openEditCuenta(cb)">
              <AppIcon :name="ICONS.pencil" :size="15" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <ContactoFormModal
      v-model="contactoModalOpen"
      :mode="contactoModalMode"
      :contacto="contactoSeleccionado"
      :default-cliente-id="idCliente"
      :lock-cliente="true"
      @saved="onContactoSaved"
    />
    <DireccionFormModal
      v-model="direccionModalOpen"
      :mode="direccionModalMode"
      :direccion="direccionSeleccionada"
      :default-cliente-id="idCliente"
      :lock-cliente="true"
      @saved="onDireccionSaved"
    />
    <ChoferFormModal
      v-model="choferModalOpen"
      :mode="choferModalMode"
      :chofer="choferSeleccionado"
      :default-cliente-id="idCliente"
      @saved="onChoferSaved"
    />
    <VehiculoFormModal
      v-model="vehiculoModalOpen"
      :mode="vehiculoModalMode"
      :vehiculo="vehiculoSeleccionado"
      :default-cliente-id="idCliente"
      @saved="onVehiculoSaved"
    />
    <CuentaBancariaFormModal
      v-model="cuentaModalOpen"
      :mode="cuentaModalMode"
      :cuenta="cuentaSeleccionada"
      :default-cliente-id="idCliente"
      @saved="onCuentaSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AppBadge, AppTabs } from '@/shared/components'
import { ICONS } from '@/shared/constants/icons'
import type { AppTabItem } from '@/shared/interfaces/tabs.interface'

import ContactoFormModal from '@/modules/contactos/components/ContactoFormModal.vue'
import { useContactosQuery } from '@/modules/contactos/composables/useContactosQuery'
import type { Contacto, ContactoFormMode } from '@/modules/contactos/interfaces/contacto.interface'

import DireccionFormModal from '@/modules/direcciones/components/DireccionFormModal.vue'
import { useDireccionesQuery } from '@/modules/direcciones/composables/useDireccionesQuery'
import type { Direccion, DireccionFormMode } from '@/modules/direcciones/interfaces/direccion.interface'

import ChoferFormModal from '@/modules/choferes/components/ChoferFormModal.vue'
import { useChoferesQuery } from '@/modules/choferes/composables/useChoferesQuery'
import type { Chofer, ChoferFormMode } from '@/modules/choferes/interfaces/chofer.interface'

import VehiculoFormModal from '@/modules/vehiculos/components/VehiculoFormModal.vue'
import { useVehiculosQuery } from '@/modules/vehiculos/composables/useVehiculosQuery'
import type { Vehiculo, VehiculoFormMode } from '@/modules/vehiculos/interfaces/vehiculo.interface'

import CuentaBancariaFormModal from '@/modules/cuentas-bancarias/components/CuentaBancariaFormModal.vue'
import { useCuentasBancariasQuery } from '@/modules/cuentas-bancarias/composables/useCuentasBancariasQuery'
import type {
  CuentaBancaria,
  CuentaBancariaFormMode,
} from '@/modules/cuentas-bancarias/interfaces/cuenta-bancaria.interface'

const props = defineProps<{
  idCliente: number
}>()

// ─── Contactos ───────────────────────────────────────────────────────────────
const contactosFiltros = computed(() => ({ idCliente: props.idCliente, pagina: 1, limite: 100 }))
const contactosQuery = useContactosQuery(contactosFiltros)
const contactosRows = computed(() => contactosQuery.data.value?.data ?? [])
const contactoModalOpen = ref(false)
const contactoModalMode = ref<ContactoFormMode>('create')
const contactoSeleccionado = ref<Contacto | null>(null)
const openCreateContacto = () => {
  contactoModalMode.value = 'create'
  contactoSeleccionado.value = null
  contactoModalOpen.value = true
}
const openEditContacto = (contacto: Contacto) => {
  contactoModalMode.value = 'edit'
  contactoSeleccionado.value = contacto
  contactoModalOpen.value = true
}
const onContactoSaved = () => {
  contactoSeleccionado.value = null
  void contactosQuery.refetch()
}

// ─── Direcciones ─────────────────────────────────────────────────────────────
const direccionesFiltros = computed(() => ({ idCliente: props.idCliente, pagina: 1, limite: 100 }))
const direccionesQuery = useDireccionesQuery(direccionesFiltros)
const direccionesRows = computed(() => direccionesQuery.data.value?.data ?? [])
const direccionModalOpen = ref(false)
const direccionModalMode = ref<DireccionFormMode>('create')
const direccionSeleccionada = ref<Direccion | null>(null)
const openCreateDireccion = () => {
  direccionModalMode.value = 'create'
  direccionSeleccionada.value = null
  direccionModalOpen.value = true
}
const openEditDireccion = (direccion: Direccion) => {
  direccionModalMode.value = 'edit'
  direccionSeleccionada.value = direccion
  direccionModalOpen.value = true
}
const onDireccionSaved = () => {
  direccionSeleccionada.value = null
  void direccionesQuery.refetch()
}

// ─── Choferes ────────────────────────────────────────────────────────────────
const choferesFiltros = computed(() => ({ idCliente: props.idCliente, pagina: 1, limite: 100 }))
const choferesQuery = useChoferesQuery(choferesFiltros)
const choferesRows = computed(() => choferesQuery.data.value?.data ?? [])
const choferModalOpen = ref(false)
const choferModalMode = ref<ChoferFormMode>('create')
const choferSeleccionado = ref<Chofer | null>(null)
const openCreateChofer = () => {
  choferModalMode.value = 'create'
  choferSeleccionado.value = null
  choferModalOpen.value = true
}
const openEditChofer = (chofer: Chofer) => {
  choferModalMode.value = 'edit'
  choferSeleccionado.value = chofer
  choferModalOpen.value = true
}
const onChoferSaved = () => {
  choferSeleccionado.value = null
  void choferesQuery.refetch()
}

// ─── Vehículos ───────────────────────────────────────────────────────────────
const vehiculosFiltros = computed(() => ({ idCliente: props.idCliente, pagina: 1, limite: 100 }))
const vehiculosQuery = useVehiculosQuery(vehiculosFiltros)
const vehiculosRows = computed(() => vehiculosQuery.data.value?.data ?? [])
const vehiculoModalOpen = ref(false)
const vehiculoModalMode = ref<VehiculoFormMode>('create')
const vehiculoSeleccionado = ref<Vehiculo | null>(null)
const openCreateVehiculo = () => {
  vehiculoModalMode.value = 'create'
  vehiculoSeleccionado.value = null
  vehiculoModalOpen.value = true
}
const openEditVehiculo = (vehiculo: Vehiculo) => {
  vehiculoModalMode.value = 'edit'
  vehiculoSeleccionado.value = vehiculo
  vehiculoModalOpen.value = true
}
const onVehiculoSaved = () => {
  vehiculoSeleccionado.value = null
  void vehiculosQuery.refetch()
}

// ─── Cuentas bancarias ───────────────────────────────────────────────────────
const cuentasFiltros = computed(() => ({ idCliente: props.idCliente, pagina: 1, limite: 100 }))
const cuentasQuery = useCuentasBancariasQuery(cuentasFiltros)
const cuentasRows = computed(() => cuentasQuery.data.value?.data ?? [])
const cuentaModalOpen = ref(false)
const cuentaModalMode = ref<CuentaBancariaFormMode>('create')
const cuentaSeleccionada = ref<CuentaBancaria | null>(null)
const openCreateCuenta = () => {
  cuentaModalMode.value = 'create'
  cuentaSeleccionada.value = null
  cuentaModalOpen.value = true
}
const openEditCuenta = (cuenta: CuentaBancaria) => {
  cuentaModalMode.value = 'edit'
  cuentaSeleccionada.value = cuenta
  cuentaModalOpen.value = true
}
const onCuentaSaved = () => {
  cuentaSeleccionada.value = null
  void cuentasQuery.refetch()
}

// ─── Tabs ────────────────────────────────────────────────────────────────────
const activeTab = ref('contactos')

const tabs = computed<AppTabItem[]>(() => [
  { key: 'contactos', label: 'Contactos', icon: ICONS.contact, badge: contactosRows.value.length },
  { key: 'direcciones', label: 'Direcciones', icon: ICONS.mapPin, badge: direccionesRows.value.length },
  { key: 'choferes', label: 'Choferes', icon: ICONS.idCard, badge: choferesRows.value.length },
  { key: 'vehiculos', label: 'Vehículos', icon: ICONS.car, badge: vehiculosRows.value.length },
  { key: 'cuentas-bancarias', label: 'Cuentas bancarias', icon: ICONS.building2, badge: cuentasRows.value.length },
])
</script>

<style scoped>
.app-related-add {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: 0.5rem;
  padding: 0.5rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: white;
  background-color: var(--color-brand-500, #1565c0);
}
.app-related-add:hover {
  background-color: var(--color-brand-600, #0d47a1);
}
.app-related-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-gray-200, #e5e7eb);
  padding: 0.625rem 0.75rem;
}
:global(.dark) .app-related-row {
  border-color: var(--color-gray-800, #374151);
}
.app-related-edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  padding: 0.375rem;
  color: var(--color-gray-500, #6b7280);
}
.app-related-edit:hover {
  background-color: var(--color-gray-100, #f3f4f6);
  color: var(--color-brand-500, #1565c0);
}
:global(.dark) .app-related-edit:hover {
  background-color: rgba(255, 255, 255, 0.05);
}
.app-related-empty {
  border-radius: 0.5rem;
  border: 1px dashed var(--color-gray-300, #d1d5db);
  padding: 1.5rem;
  text-align: center;
  font-size: 0.8125rem;
  color: var(--color-gray-400, #9ca3af);
}
</style>
