<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5 flex flex-wrap items-center gap-2">
      <RouterLink
        :to="{ name: 'admin-ventas-guias-remision' }"
        class="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
      >
        <AppIcon :name="ICONS.chevronLeft" :size="16" />
        Volver a guías
      </RouterLink>
      <AppHelpTip :text="pageHelpText" />
    </div>

    <div
      v-if="isEdit && loadingGuia"
      class="rounded-2xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"
    >
      Cargando guía...
    </div>

    <form
      v-else
      id="guia-remision-form"
      class="space-y-5 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6"
      autocomplete="off"
      @submit.prevent="onSubmit"
    >
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AppSelect
          v-model="idTipoGuiaRemision"
          label="Tipo"
          placeholder="09 Remitente"
          required
          :options="tipoGuiaOptions"
          :disabled="saving || isEdit || catalogosQuery.isLoading.value"
          :error="errors.idTipoGuiaRemision"
        />
        <AppInput
          v-model="serie"
          label="Serie"
          placeholder="T001"
          required
          :disabled="saving || isEdit"
          :error="errors.serie"
        />
        <AppInput v-model="numero" label="Número" placeholder="Automático" disabled />
        <AppInput v-model="fecha" label="Fecha" type="date" required :disabled="saving" :error="errors.fecha" />
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AppInput
          v-model="fechaTraslado"
          label="Fecha traslado"
          type="date"
          required
          :disabled="saving"
          :error="errors.fechaTraslado"
        />
        <AppSelect
          v-model="idMotivoTraslado"
          label="Motivo"
          placeholder="Venta, traslado..."
          required
          :options="motivoOptions"
          :disabled="saving"
          :error="errors.idMotivoTraslado"
        />
        <AppSelect
          v-model="idModalidadTraslado"
          label="Modalidad"
          placeholder="Público / Privado"
          required
          :options="modalidadOptions"
          :disabled="saving"
          :error="errors.idModalidadTraslado"
        />
        <AppSelect
          v-model="idUnidadMedida"
          label="Und. peso"
          placeholder="KGM"
          :options="unidadPesoOptions"
          :disabled="saving"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AppSelect
          v-model="idSucursal"
          label="Sucursal"
          placeholder="Selecciona"
          required
          :options="sucursalOptions"
          :disabled="saving || sucursalesQuery.isLoading.value"
          :error="errors.idSucursal"
        />
        <AppSelect
          v-model="idAlmacen"
          label="Almacén"
          placeholder="Selecciona"
          required
          :options="almacenOptions"
          :disabled="saving || almacenesQuery.isLoading.value"
          :error="errors.idAlmacen"
        />
        <AppInput
          v-model="pesoBruto"
          label="Peso bruto"
          type="number"
          step="0.01"
          min="0.01"
          required
          :disabled="saving"
          :error="errors.pesoBruto"
        />
        <AppInput
          v-model="numeroBultos"
          label="N° bultos"
          type="number"
          min="1"
          :disabled="saving"
        />
      </div>

      <SearchableSelect
        v-if="esTipo31"
        v-model="idRemitente"
        label="Remitente"
        placeholder="Cliente que remite la mercancía..."
        required
        :model-label="remitenteLabel"
        :disabled="saving"
        :error="remitenteError"
        :search-fn="searchClientes"
      />

      <div class="flex items-end gap-2">
        <div class="min-w-0 flex-1">
          <SearchableSelect
            v-model="idDestinatario"
            label="Destinatario"
            placeholder="Busca cliente..."
            required
            :model-label="destinatarioLabel"
            :disabled="saving"
            :error="errors.idDestinatario"
            :search-fn="searchClientes"
          />
        </div>
        <button
          v-if="canCreateCliente"
          type="button"
          title="Nuevo destinatario"
          class="mb-0 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
          :disabled="saving"
          @click="clienteModalOpen = true"
        >
          <AppIcon :name="ICONS.plus" :size="18" />
        </button>
      </div>

      <ClienteFormModal
        v-model="clienteModalOpen"
        mode="create"
        @saved="onDestinatarioCreado"
      />

      <div class="grid gap-4 lg:grid-cols-2">
        <div class="space-y-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
          <div class="flex items-center gap-1.5">
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">Punto de partida</p>
            <AppHelpTip text="Se completa con la dirección de la sucursal seleccionada." />
          </div>
          <AppInput
            v-model="direccionOrigen"
            label="Dirección origen"
            placeholder="Av. ..."
            required
            :disabled="saving"
            :error="errors.direccionOrigen"
          />
          <div class="grid gap-3 sm:grid-cols-3">
            <AppSelect
              v-model="idDepartamentoOrigen"
              label="Departamento"
              :options="departamentosOptions"
              :disabled="saving"
            />
            <AppSelect
              v-model="idProvinciaOrigen"
              label="Provincia"
              :options="provinciasOrigenOptions"
              :disabled="saving || !idDepartamentoOrigen"
            />
            <AppSelect
              v-model="idDistritoOrigen"
              label="Distrito"
              required
              :options="distritosOrigenOptions"
              :disabled="saving || !idProvinciaOrigen"
              :error="distritoOrigenError"
            />
          </div>
        </div>

        <div class="space-y-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
          <div class="flex items-center gap-1.5">
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">Punto de llegada</p>
            <AppHelpTip
              text="Si el destinatario no tiene direcciones, puedes completarlas manualmente o usar la ubicación del cliente."
            />
          </div>
          <div class="flex items-end gap-2">
            <div class="min-w-0 flex-1">
              <AppSelect
                v-model="idDireccionLlegada"
                label="Dirección del destinatario"
                :placeholder="
                  idDestinatario
                    ? direccionesDestinatario.length
                      ? 'Selecciona una dirección'
                      : 'Sin direcciones — ingreso manual'
                    : 'Selecciona destinatario primero'
                "
                :options="direccionLlegadaOptions"
                :disabled="saving || !idDestinatario || cargandoDirecciones"
              />
            </div>
            <button
              v-if="canCreateDireccion && idDestinatario"
              type="button"
              title="Registrar dirección del destinatario"
              class="mb-0 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
              :disabled="saving || cargandoDirecciones"
              @click="direccionModalOpen = true"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
            </button>
          </div>
          <p v-if="llegadaHint" class="text-xs text-gray-500 dark:text-gray-400">
            {{ llegadaHint }}
          </p>
          <button
            v-if="puedeUsarUbicacionCliente"
            type="button"
            class="inline-flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-brand-400"
            :disabled="saving || aplicandoUbicacionCliente || cargandoDirecciones"
            @click="usarUbicacionCliente"
          >
            <AppIcon
              v-if="aplicandoUbicacionCliente"
              :name="ICONS.loader"
              :size="14"
              class="animate-spin"
            />
            {{ aplicandoUbicacionCliente ? 'Cargando ubicación...' : 'Usar ubicación del cliente' }}
          </button>
          <div class="relative space-y-3">
            <div
              v-if="aplicandoUbicacionCliente || cargandoDirecciones"
              class="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 dark:bg-gray-900/70"
            >
              <div class="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-gray-600 shadow-theme-md dark:bg-gray-800 dark:text-gray-300">
                <AppIcon :name="ICONS.loader" :size="16" class="animate-spin text-brand-500" />
                {{ aplicandoUbicacionCliente ? 'Aplicando ubicación del cliente...' : 'Cargando direcciones...' }}
              </div>
            </div>
            <AppInput
              v-model="direccionLlegada"
              label="Dirección llegada"
              placeholder="Escribe o se completa al elegir dirección / ubicación"
              required
              :disabled="saving || aplicandoUbicacionCliente || cargandoDirecciones"
              :error="errors.direccionLlegada"
            />
            <div class="grid gap-3 sm:grid-cols-3">
              <AppSelect
                v-model="idDepartamentoLlegada"
                label="Departamento"
                :options="departamentosOptions"
                :disabled="saving || aplicandoUbicacionCliente || cargandoDirecciones"
              />
              <AppSelect
                v-model="idProvinciaLlegada"
                label="Provincia"
                :options="provinciasLlegadaOptions"
                :disabled="saving || !idDepartamentoLlegada || aplicandoUbicacionCliente || cargandoDirecciones"
              />
              <AppSelect
                v-model="idDistritoLlegada"
                label="Distrito"
                required
                :options="distritosLlegadaOptions"
                :disabled="saving || !idProvinciaLlegada || aplicandoUbicacionCliente || cargandoDirecciones"
                :error="distritoLlegadaError"
              />
            </div>
          </div>
        </div>
      </div>

      <DireccionFormModal
        v-model="direccionModalOpen"
        mode="create"
        :default-cliente-id="idDestinatario ? Number(idDestinatario) : null"
        :default-cliente-label="destinatarioLabel"
        :lock-cliente="true"
        @saved="onDireccionDestinatarioCreada"
      />

      <div v-if="esPrivado" class="grid gap-3 sm:grid-cols-2">
        <div class="flex items-end gap-2">
          <div class="min-w-0 flex-1">
            <SearchableSelect
              v-model="idChofer"
              label="Chofer"
              placeholder="Flota propia o del destinatario..."
              required
              :model-label="choferLabel"
              :disabled="saving"
              :error="errors.idChofer"
              :search-fn="searchChoferes"
            />
          </div>
          <button
            v-if="canCreateChofer"
            type="button"
            title="Nuevo chofer"
            class="mb-0 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
            :disabled="saving"
            @click="choferModalOpen = true"
          >
            <AppIcon :name="ICONS.plus" :size="18" />
          </button>
        </div>
        <div class="flex items-end gap-2">
          <div class="min-w-0 flex-1">
            <SearchableSelect
              v-model="idVehiculo"
              label="Vehículo"
              placeholder="Flota propia o del destinatario..."
              required
              :model-label="vehiculoLabel"
              :disabled="saving"
              :error="errors.idVehiculo"
              :search-fn="searchVehiculos"
            />
          </div>
          <button
            v-if="canCreateVehiculo"
            type="button"
            title="Nuevo vehículo"
            class="mb-0 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
            :disabled="saving"
            @click="vehiculoModalOpen = true"
          >
            <AppIcon :name="ICONS.plus" :size="18" />
          </button>
        </div>
      </div>

      <div v-else class="flex items-end gap-2">
        <div class="min-w-0 flex-1">
          <SearchableSelect
            v-model="idTransportista"
            label="Transportista (RUC)"
            placeholder="Busca transportista..."
            required
            :model-label="transportistaLabel"
            :disabled="saving"
            :error="errors.idTransportista"
            :search-fn="searchClientes"
          />
        </div>
        <button
          v-if="canCreateCliente"
          type="button"
          title="Nuevo transportista"
          class="mb-0 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
          :disabled="saving"
          @click="transportistaModalOpen = true"
        >
          <AppIcon :name="ICONS.plus" :size="18" />
        </button>
      </div>

      <ChoferFormModal
        v-model="choferModalOpen"
        mode="create"
        :default-cliente-id="idDestinatario ? Number(idDestinatario) : null"
        :default-cliente-label="destinatarioLabel"
        @saved="onChoferCreado"
      />
      <VehiculoFormModal
        v-model="vehiculoModalOpen"
        mode="create"
        :default-cliente-id="idDestinatario ? Number(idDestinatario) : null"
        :default-cliente-label="destinatarioLabel"
        @saved="onVehiculoCreado"
      />
      <ClienteFormModal
        v-model="transportistaModalOpen"
        mode="create"
        @saved="onTransportistaCreado"
      />

      <AppInput
        v-model="observaciones"
        label="Observaciones"
        placeholder="Opcional"
        :disabled="saving"
      />

      <div class="space-y-3">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">Ítems / envases</p>
            <AppHelpTip
              text="Un cilindro por línea (como en la GRE). Busca por código o serie del envase."
            />
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
            :disabled="saving"
            @click="agregarLinea"
          >
            <AppIcon :name="ICONS.plus" :size="14" />
            Agregar
          </button>
        </div>

        <p v-if="detallesError" class="text-xs text-error-500">{{ detallesError }}</p>

        <div
          v-for="(linea, index) in lineas"
          :key="linea.key"
          class="space-y-2 rounded-xl border border-gray-100 p-3 dark:border-gray-800"
        >
          <div class="grid gap-2 sm:grid-cols-[1fr_100px_40px] sm:items-end">
            <SearchableSelect
              v-model="linea.idBalon"
              label="Cilindro / serie"
              placeholder="Código o serie del envase..."
              :model-label="linea.balonLabel"
              :disabled="saving"
              :search-fn="searchBalones"
              @update:model-value="(v) => onBalonSelected(index, v)"
            />
            <AppInput
              v-model="linea.cantidad"
              label="Cantidad"
              type="number"
              min="0.01"
              step="0.01"
              :disabled="saving"
            />
            <button
              type="button"
              class="inline-flex h-11 w-11 shrink-0 items-center justify-center justify-self-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-700"
              :disabled="saving || lineas.length <= 1"
              title="Quitar"
              @click="quitarLinea(index)"
            >
              <AppIcon :name="ICONS.trash" :size="14" />
            </button>
          </div>
          <div class="grid gap-2 sm:grid-cols-2">
            <SearchableSelect
              v-model="linea.idProducto"
              label="Producto / gas"
              placeholder="Se completa al elegir cilindro..."
              :model-label="linea.productoLabel"
              :disabled="saving"
              :search-fn="searchProductos"
              @update:model-value="(v) => onProductoSelected(index, v)"
            />
            <AppInput
              v-model="linea.glosa"
              label="Descripción / glosa"
              placeholder="Ej. Acetileno Estándar GAS ENVASE 434012"
              :disabled="saving"
            />
          </div>
        </div>
      </div>

      <div
        class="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 dark:border-gray-800 sm:flex-row sm:justify-end"
      >
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
          :disabled="saving"
          @click="handleClose"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-70 sm:w-auto"
          :disabled="saving || (isEdit && loadingGuia)"
        >
          {{ saving ? 'Guardando...' : isEdit ? 'Actualizar guía' : 'Guardar guía' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import {
  useDepartamentosQuery,
  useDistritosQuery,
  usePaisesQuery,
  useProvinciasQuery,
} from '@/modules/catalogos/composables/useUbigeoQueries'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import ClienteFormModal from '@/modules/clientes/components/ClienteFormModal.vue'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import { getClienteOptionLabel } from '@/modules/clientes/utils/clienteNombre'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import ChoferFormModal from '@/modules/choferes/components/ChoferFormModal.vue'
import { choferesService } from '@/modules/choferes/services/choferes.service'
import type { Chofer } from '@/modules/choferes/interfaces/chofer.interface'
import DireccionFormModal from '@/modules/direcciones/components/DireccionFormModal.vue'
import VehiculoFormModal from '@/modules/vehiculos/components/VehiculoFormModal.vue'
import type { Vehiculo } from '@/modules/vehiculos/interfaces/vehiculo.interface'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useSucursalesQuery } from '@/modules/configuracion/sucursales/composables/useSucursalesQuery'
import { balonesService } from '@/modules/balones/cilindros/services/balones.service'
import type { Balon } from '@/modules/balones/cilindros/interfaces/balon.interface'
import { direccionesService } from '@/modules/direcciones/services/direcciones.service'
import type { Direccion } from '@/modules/direcciones/interfaces/direccion.interface'
import { productosService } from '@/modules/productos/articulos/services/productos.service'
import {
  buildGuiaDetalleGlosa,
  labelBalonGuia,
} from '@/modules/ventas/guias-remision/utils/buildGuiaDetalleGlosa'
import {
  useCreateGuiaRemisionMutation,
  useUpdateGuiaRemisionMutation,
} from '@/modules/ventas/guias-remision/composables/useGuiaRemisionMutations'
import {
  useGuiaRemisionCatalogosQuery,
  useGuiaRemisionQuery,
} from '@/modules/ventas/guias-remision/composables/useGuiasRemisionQuery'
import { guiasRemisionService } from '@/modules/ventas/guias-remision/services/guias-remision.service'
import { vehiculosService } from '@/modules/vehiculos/services/vehiculos.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppHelpTip, AppInput, AppSelect } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import SearchableSelect from '@/shared/components/form/SearchableSelect.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { toastSuccess, toastWarning } from '@/shared/composables/useToast'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const createMutation = useCreateGuiaRemisionMutation()
const updateMutation = useUpdateGuiaRemisionMutation()
const catalogosQuery = useGuiaRemisionCatalogosQuery()

const guiaId = computed(() => {
  const raw = route.params.id
  if (raw == null || raw === '') return null
  const id = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(id) && id > 0 ? id : null
})

const isEdit = computed(() => Boolean(guiaId.value))
const pageTitle = computed(() =>
  isEdit.value ? 'Editar guía de remisión' : 'Nueva guía de remisión',
)
const pageHelpText = computed(() =>
  isEdit.value
    ? 'Solo se pueden editar guías no aceptadas por SUNAT. Serie y número no se modifican.'
    : 'Remitente (09 / T…) o Transportista (31 / V…). Privado usa flota propia. Un cilindro por línea.',
)
const breadcrumbItems = computed(() => [
  { label: 'Ventas', to: '/admin/ventas' },
  { label: 'Guías de remisión', to: '/admin/ventas/guias-remision' },
  { label: isEdit.value ? 'Editar' : 'Nueva' },
])

const guiaQuery = useGuiaRemisionQuery(guiaId)
const loadingGuia = computed(() => isEdit.value && guiaQuery.isFetching.value)

const sucursalesFilters = ref({ pagina: 1, limite: 100 })
const almacenesFilters = ref<{ pagina: number; limite: number; idSucursal?: number }>({
  pagina: 1,
  limite: 100,
})
const sucursalesQuery = useSucursalesQuery(sucursalesFilters)
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

const destinatarioLabel = ref<string | null>(null)
const remitenteLabel = ref<string | null>(null)
const clienteModalOpen = ref(false)
const transportistaModalOpen = ref(false)
const choferModalOpen = ref(false)
const vehiculoModalOpen = ref(false)
const direccionModalOpen = ref(false)
const canCreateCliente = computed(() =>
  authStore.hasPermission(PermisoBanderas.CLIENTES_CREAR),
)
const canCreateChofer = computed(() =>
  authStore.hasPermission(PermisoBanderas.CHOFERES_CREAR),
)
const canCreateVehiculo = computed(() =>
  authStore.hasPermission(PermisoBanderas.VEHICULOS_CREAR),
)
const canCreateDireccion = computed(() =>
  authStore.hasPermission(PermisoBanderas.DIRECCIONES_CREAR),
)
const llegadaHint = ref('')
const clienteUbicacionCache = ref<Cliente | null>(null)
const aplicandoUbicacionCliente = ref(false)
const puedeUsarUbicacionCliente = computed(() => {
  const c = clienteUbicacionCache.value
  if (!c || !idDestinatario.value) return false
  return Boolean(c.direccion?.trim() || c.id_distrito || c.id_departamento)
})
const idRemitente = ref<number | ''>('')
const remitenteError = ref('')
const choferLabel = ref<string | null>(null)
const vehiculoLabel = ref<string | null>(null)
const transportistaLabel = ref<string | null>(null)
const detallesError = ref('')
const distritoOrigenError = ref('')
const distritoLlegadaError = ref('')
const direccionLlegadaSelectError = ref('')
const cargandoDirecciones = ref(false)
const idDireccionLlegada = ref<number | ''>('')
const direccionesDestinatario = ref<Direccion[]>([])
const productosCache = new Map<number, { idUnidadMedida?: number; nombre: string; codigo: string }>()
const balonesCache = new Map<number, Balon>()
/** Contador: evita que llamadas anidadas liberen el suppress y borren el distrito. */
const ubigeoSuppressDepth = ref(0)
const suppressDestinatarioReset = ref(false)
const applyingDireccionLlegada = ref(false)
/** Labels temporales para que AppSelect muestre provincia/distrito antes de que llegue el query. */
const llegadaProvinciaFallback = ref<SelectOption | null>(null)
const llegadaDistritoFallback = ref<SelectOption | null>(null)
const origenProvinciaFallback = ref<SelectOption | null>(null)
const origenDistritoFallback = ref<SelectOption | null>(null)

function beginUbigeoSuppress() {
  ubigeoSuppressDepth.value += 1
}

function endUbigeoSuppress() {
  ubigeoSuppressDepth.value = Math.max(0, ubigeoSuppressDepth.value - 1)
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/** Espera a que el id esté en las opciones (query cargado), no solo en el fallback UI. */
async function waitForSelectOption(
  getOptions: () => SelectOption[],
  targetId: number | null | undefined,
  timeoutMs = 6000,
) {
  if (targetId == null) return
  const target = Number(targetId)
  if (!Number.isFinite(target)) return

  await nextTick()
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (getOptions().some((o) => Number(o.value) === target)) return
    await sleep(40)
  }
}

function withFallbackOption(
  options: SelectOption[],
  fallback: SelectOption | null,
): SelectOption[] {
  if (!fallback) return options
  if (options.some((o) => Number(o.value) === Number(fallback.value))) return options
  return [fallback, ...options]
}

type LineaForm = {
  key: string
  idBalon: number | ''
  balonLabel: string | null
  idProducto: number | ''
  productoLabel: string | null
  cantidad: number
  idUnidadMedida?: number
  descripcion?: string
  glosa?: string
}

const lineas = reactive<LineaForm[]>([
  {
    key: crypto.randomUUID(),
    idBalon: '',
    balonLabel: null,
    idProducto: '',
    productoLabel: null,
    cantidad: 1,
  },
])

const idPais = ref<number | ''>('')
const idDepartamentoOrigen = ref<number | ''>('')
const idProvinciaOrigen = ref<number | ''>('')
const idDistritoOrigen = ref<number | ''>('')
const idDepartamentoLlegada = ref<number | ''>('')
const idProvinciaLlegada = ref<number | ''>('')
const idDistritoLlegada = ref<number | ''>('')

const paisesQuery = usePaisesQuery()
const departamentosQuery = useDepartamentosQuery(idPais)
const provinciasOrigenQuery = useProvinciasQuery(idDepartamentoOrigen)
const distritosOrigenQuery = useDistritosQuery(idProvinciaOrigen)
const provinciasLlegadaQuery = useProvinciasQuery(idDepartamentoLlegada)
const distritosLlegadaQuery = useDistritosQuery(idProvinciaLlegada)

const departamentosOptions = computed(() => toSelectOptions(departamentosQuery.data.value))
const provinciasOrigenOptions = computed(() =>
  withFallbackOption(toSelectOptions(provinciasOrigenQuery.data.value), origenProvinciaFallback.value),
)
const distritosOrigenOptions = computed(() =>
  withFallbackOption(toSelectOptions(distritosOrigenQuery.data.value), origenDistritoFallback.value),
)
const provinciasLlegadaOptions = computed(() =>
  withFallbackOption(toSelectOptions(provinciasLlegadaQuery.data.value), llegadaProvinciaFallback.value),
)
const distritosLlegadaOptions = computed(() =>
  withFallbackOption(toSelectOptions(distritosLlegadaQuery.data.value), llegadaDistritoFallback.value),
)
const direccionLlegadaOptions = computed(() =>
  direccionesDestinatario.value.map((d) => ({
    value: d.id,
    label: `${d.direccion}${d.nombre_distrito ? ` · ${d.nombre_distrito}` : ''}${
      d.es_principal ? ' (principal)' : ''
    }`,
  })),
)

const tipoGuiaOptions = computed(() =>
  (catalogosQuery.data.value?.tiposGuia ?? []).map((t) => ({
    value: t.id,
    label: `${(t.nombre ?? '').replace(/_/g, ' ')} (${t.descripcion ?? ''})`,
    codigo: t.descripcion ?? '',
  })),
)
const motivoOptions = computed(() =>
  (catalogosQuery.data.value?.motivosTraslado ?? []).map((t) => ({
    value: t.id,
    label: `${(t.nombre ?? '').replace(/_/g, ' ')} (${t.descripcion ?? ''})`,
  })),
)
const modalidadOptions = computed(() =>
  (catalogosQuery.data.value?.modalidadesTraslado ?? []).map((t) => ({
    value: t.id,
    label: `${(t.nombre ?? '').replace(/_/g, ' ')} (${t.descripcion ?? ''})`,
    codigo: t.descripcion ?? '',
  })),
)
const unidadPesoOptions = computed(() =>
  toSelectOptions(
    (catalogosQuery.data.value?.unidadesMedida ?? []).filter(
      (u) =>
        (u.nombre ?? '').toUpperCase().includes('KG') ||
        (u.descripcion ?? '').toUpperCase().includes('KG'),
    ),
  ),
)
const sucursalOptions = computed(() =>
  (sucursalesQuery.data.value?.data ?? []).map((s) => ({ value: s.id, label: s.nombre })),
)
const almacenOptions = computed(() =>
  (almacenesQuery.data.value?.data ?? []).map((a) => ({ value: a.id, label: a.nombre })),
)

const { defineField, handleSubmit, resetForm, errors, setValues, values } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idTipoGuiaRemision: yup.number().required('Tipo obligatorio'),
      serie: yup.string().required('Serie obligatoria').max(10),
      fecha: yup.string().required('Fecha obligatoria'),
      fechaTraslado: yup.string().required('Fecha de traslado obligatoria'),
      idMotivoTraslado: yup.number().required('Motivo obligatorio'),
      idModalidadTraslado: yup.number().required('Modalidad obligatoria'),
      idUnidadMedida: yup.number().optional().nullable(),
      idSucursal: yup.number().required('Sucursal obligatoria'),
      idAlmacen: yup.number().required('Almacén obligatorio'),
      pesoBruto: yup.number().typeError('Peso inválido').min(0.01, 'Peso > 0').required(),
      numeroBultos: yup.number().optional().nullable(),
      idDestinatario: yup.number().required('Destinatario obligatorio'),
      direccionOrigen: yup.string().required('Dirección origen obligatoria'),
      direccionLlegada: yup.string().required('Dirección llegada obligatoria'),
      idChofer: yup.number().optional().nullable(),
      idVehiculo: yup.number().optional().nullable(),
      idTransportista: yup.number().optional().nullable(),
      observaciones: yup.string().optional().nullable(),
    }),
  ),
  initialValues: {
    idTipoGuiaRemision: undefined as number | undefined,
    serie: 'T001',
    fecha: new Date().toISOString().slice(0, 10),
    fechaTraslado: new Date().toISOString().slice(0, 10),
    idMotivoTraslado: undefined as number | undefined,
    idModalidadTraslado: undefined as number | undefined,
    idUnidadMedida: undefined as number | undefined,
    idSucursal: undefined as number | undefined,
    idAlmacen: undefined as number | undefined,
    pesoBruto: 1,
    numeroBultos: 1,
    idDestinatario: undefined as number | undefined,
    direccionOrigen: '',
    direccionLlegada: '',
    idChofer: undefined as number | undefined,
    idVehiculo: undefined as number | undefined,
    idTransportista: undefined as number | undefined,
    observaciones: '',
  },
})

const [idTipoGuiaRemision] = defineField('idTipoGuiaRemision')
const [serie] = defineField('serie')
const [fecha] = defineField('fecha')
const [fechaTraslado] = defineField('fechaTraslado')
const [idMotivoTraslado] = defineField('idMotivoTraslado')
const [idModalidadTraslado] = defineField('idModalidadTraslado')
const [idUnidadMedida] = defineField('idUnidadMedida')
const [idSucursal] = defineField('idSucursal')
const [idAlmacen] = defineField('idAlmacen')
const [pesoBruto] = defineField('pesoBruto')
const [numeroBultos] = defineField('numeroBultos')
const [idDestinatario] = defineField('idDestinatario')
const [direccionOrigen] = defineField('direccionOrigen')
const [direccionLlegada] = defineField('direccionLlegada')
const [idChofer] = defineField('idChofer')
const [idVehiculo] = defineField('idVehiculo')
const [idTransportista] = defineField('idTransportista')
const [observaciones] = defineField('observaciones')

const numero = ref('')
const saving = computed(
  () => createMutation.isPending.value || updateMutation.isPending.value,
)

const codigoModalidad = computed(() => {
  const opt = modalidadOptions.value.find((o) => o.value === values.idModalidadTraslado)
  return opt?.codigo ?? ''
})
const esPrivado = computed(() => codigoModalidad.value === '02' || !codigoModalidad.value)
const codigoTipoGuia = computed(() => {
  const opt = tipoGuiaOptions.value.find((t) => t.value === values.idTipoGuiaRemision)
  return opt?.codigo ?? ''
})
const esTipo31 = computed(() => codigoTipoGuia.value === '31')

watch(
  paisesQuery.data,
  (paises) => {
    if (!idPais.value && paises?.length) {
      idPais.value = paises[0].id
    }
  },
  { immediate: true },
)

watch(idDepartamentoOrigen, () => {
  if (ubigeoSuppressDepth.value > 0) return
  origenProvinciaFallback.value = null
  origenDistritoFallback.value = null
  idProvinciaOrigen.value = ''
  idDistritoOrigen.value = ''
})
watch(idProvinciaOrigen, () => {
  if (ubigeoSuppressDepth.value > 0) return
  origenDistritoFallback.value = null
  idDistritoOrigen.value = ''
})
watch(idDepartamentoLlegada, () => {
  if (ubigeoSuppressDepth.value > 0) return
  llegadaProvinciaFallback.value = null
  llegadaDistritoFallback.value = null
  idProvinciaLlegada.value = ''
  idDistritoLlegada.value = ''
})
watch(idProvinciaLlegada, () => {
  if (ubigeoSuppressDepth.value > 0) return
  llegadaDistritoFallback.value = null
  idDistritoLlegada.value = ''
})

watch(idTipoGuiaRemision, (id) => {
  if (isEdit.value) return
  const tipo = tipoGuiaOptions.value.find((t) => t.value === id)
  if (!tipo) return
  if (tipo.codigo === '09' && !String(serie.value ?? '').toUpperCase().startsWith('T')) {
    serie.value = 'T001'
  }
  if (tipo.codigo === '31' && !String(serie.value ?? '').toUpperCase().startsWith('V')) {
    serie.value = 'V001'
  }
  if (tipo.codigo !== '31') {
    idRemitente.value = ''
    remitenteLabel.value = null
    remitenteError.value = ''
  }
})

watch(
  () => [serie.value, isEdit.value] as const,
  async ([s, edit]) => {
    if (edit || !s?.trim()) {
      if (!edit) numero.value = ''
      return
    }
    try {
      const result = await guiasRemisionService.obtenerSiguienteNumero(String(s).trim())
      numero.value = result.numero
    } catch {
      numero.value = ''
    }
  },
)

function applyCatalogDefaults() {
  const cats = catalogosQuery.data.value
  if (!cats || isEdit.value) return

  if (!values.idTipoGuiaRemision) {
    const rem = cats.tiposGuia.find((t) => t.descripcion === '09')
    if (rem) idTipoGuiaRemision.value = rem.id
  }
  if (!values.idModalidadTraslado) {
    const priv = cats.modalidadesTraslado.find((t) => t.descripcion === '02')
    if (priv) idModalidadTraslado.value = priv.id
  }
  if (!values.idMotivoTraslado) {
    const venta = cats.motivosTraslado.find((t) => t.descripcion === '01')
    if (venta) idMotivoTraslado.value = venta.id
  }
  if (!values.idUnidadMedida) {
    const kgm = cats.unidadesMedida.find(
      (u) =>
        (u.nombre ?? '').toUpperCase() === 'KGM' ||
        (u.nombre ?? '').toUpperCase() === 'KG' ||
        (u.descripcion ?? '').toUpperCase().includes('KILO'),
    )
    if (kgm) idUnidadMedida.value = kgm.id
  }
}

function applySucursalAlmacenDefaults() {
  if (isEdit.value) return

  const sucursales = sucursalesQuery.data.value?.data ?? []
  if (!values.idSucursal && sucursales.length) {
    idSucursal.value = sucursales[0].id
  }

  const almacenes = almacenesQuery.data.value?.data ?? []
  if (!values.idAlmacen && almacenes.length) {
    const principal = almacenes.find((a) =>
      (a.nombre ?? '').toLowerCase().includes('principal'),
    )
    idAlmacen.value = principal?.id ?? almacenes[0].id
  }
}

watch(
  () => catalogosQuery.data.value,
  () => applyCatalogDefaults(),
  { immediate: true },
)

watch(
  () => [sucursalesQuery.data.value?.data, almacenesQuery.data.value?.data, isEdit.value] as const,
  () => {
    if (!isEdit.value) applySucursalAlmacenDefaults()
  },
  { immediate: true },
)

watch(idSucursal, async (id, prev) => {
  almacenesFilters.value = {
    pagina: 1,
    limite: 100,
    idSucursal: id ? Number(id) : undefined,
  }

  if (ubigeoSuppressDepth.value > 0 || isEdit.value) return
  if (!id) return

  if (prev != null && id !== prev) {
    idAlmacen.value = undefined
  }

  const sucursal = (sucursalesQuery.data.value?.data ?? []).find((s) => s.id === Number(id))
  if (sucursal) {
    await applyOrigenDesdeSucursal(sucursal)
  }

  await nextTick()
  applySucursalAlmacenDefaults()
})

watch(idDestinatario, async (id, prev) => {
  if (suppressDestinatarioReset.value) return
  if (id === prev) return

  if (!isEdit.value || prev != null) {
    idChofer.value = undefined
    idVehiculo.value = undefined
    choferLabel.value = null
    vehiculoLabel.value = null
    idDireccionLlegada.value = ''
    direccionLlegada.value = ''
    llegadaProvinciaFallback.value = null
    llegadaDistritoFallback.value = null
    beginUbigeoSuppress()
    idDepartamentoLlegada.value = ''
    idProvinciaLlegada.value = ''
    idDistritoLlegada.value = ''
    endUbigeoSuppress()
  }

  direccionesDestinatario.value = []
  direccionLlegadaSelectError.value = ''
  llegadaHint.value = ''
  clienteUbicacionCache.value = null

  if (!id) {
    destinatarioLabel.value = null
    return
  }

  await loadDireccionesDestinatario(Number(id))
})

watch(idDireccionLlegada, async (id) => {
  if (!id || applyingDireccionLlegada.value) return
  const dir = direccionesDestinatario.value.find((d) => d.id === Number(id))
  if (!dir) return
  await applyDireccionLlegada(dir)
})

watch(idRemitente, (id) => {
  if (id) remitenteError.value = ''
})

watch(idDistritoOrigen, () => {
  distritoOrigenError.value = ''
})
watch(idDistritoLlegada, () => {
  distritoLlegadaError.value = ''
})

async function applyOrigenDesdeSucursal(sucursal: {
  direccion?: string | null
  id_departamento?: number | null
  id_provincia?: number | null
  id_distrito?: number | null
  nombre_provincia?: string | null
  nombre_distrito?: string | null
}) {
  beginUbigeoSuppress()
  try {
    if (sucursal.direccion?.trim()) {
      direccionOrigen.value = sucursal.direccion.trim()
    }
    origenProvinciaFallback.value =
      sucursal.id_provincia && sucursal.nombre_provincia
        ? { value: sucursal.id_provincia, label: sucursal.nombre_provincia }
        : null
    origenDistritoFallback.value =
      sucursal.id_distrito && sucursal.nombre_distrito
        ? { value: sucursal.id_distrito, label: sucursal.nombre_distrito }
        : null

    idDepartamentoOrigen.value = sucursal.id_departamento ?? ''
    await nextTick()
    await waitForSelectOption(
      () => toSelectOptions(provinciasOrigenQuery.data.value),
      sucursal.id_provincia,
    )
    idProvinciaOrigen.value = sucursal.id_provincia ?? ''
    await nextTick()
    await waitForSelectOption(
      () => toSelectOptions(distritosOrigenQuery.data.value),
      sucursal.id_distrito,
    )
    idDistritoOrigen.value = sucursal.id_distrito ?? ''
    await nextTick()
  } finally {
    endUbigeoSuppress()
  }
}

async function loadDireccionesDestinatario(idCliente: number) {
  cargandoDirecciones.value = true
  llegadaHint.value = ''
  direccionLlegadaSelectError.value = ''
  try {
    const [response, cliente] = await Promise.all([
      direccionesService.listar({
        idCliente,
        pagina: 1,
        limite: 100,
        soloActivos: 1,
      }),
      clientesService.obtenerPorId(idCliente).catch(() => null),
    ])
    direccionesDestinatario.value = response.data
    clienteUbicacionCache.value = cliente

    const principal = response.data.find((d) => d.es_principal) ?? response.data[0]
    if (principal) {
      // Una sola aplicación: el watch de idDireccionLlegada aplica el ubigeo.
      if (Number(idDireccionLlegada.value) === principal.id) {
        await applyDireccionLlegada(principal)
      } else {
        idDireccionLlegada.value = principal.id
      }
      llegadaHint.value = ''
      return
    }

    // Sin direcciones en ficha: intentar ubicación del cliente; si no, ingreso manual.
    idDireccionLlegada.value = ''
    if (cliente && (cliente.direccion?.trim() || cliente.id_distrito || cliente.id_departamento)) {
      await applyUbicacionDesdeCliente(cliente)
      llegadaHint.value =
        'Sin direcciones registradas: se usó la ubicación del cliente. Puedes editarla o registrar una nueva con +.'
    } else {
      llegadaHint.value =
        'Sin direcciones registradas. Completa dirección y ubigeo manualmente, o regístrala con +.'
    }
  } catch {
    direccionesDestinatario.value = []
    llegadaHint.value =
      'No se pudieron cargar las direcciones. Completa dirección y ubigeo manualmente.'
  } finally {
    cargandoDirecciones.value = false
  }
}

function clienteToDireccionLike(cliente: Cliente): Direccion {
  return {
    id: 0,
    id_cliente: cliente.id,
    direccion: (cliente.direccion ?? '').trim() || (cliente.referencia ?? '').trim() || '',
    referencia: cliente.referencia ?? null,
    id_pais: cliente.id_pais ?? null,
    nombre_pais: cliente.nombre_pais ?? null,
    id_departamento: cliente.id_departamento ?? null,
    nombre_departamento: cliente.nombre_departamento ?? null,
    id_provincia: cliente.id_provincia ?? null,
    nombre_provincia: cliente.nombre_provincia ?? null,
    id_distrito: cliente.id_distrito ?? null,
    nombre_distrito: cliente.nombre_distrito ?? null,
    latitud: cliente.latitud ?? null,
    longitud: cliente.longitud ?? null,
    es_principal: false,
    estado: 1,
    fecha_creacion: cliente.fecha_creacion,
    fecha_modificacion: cliente.fecha_modificacion,
  }
}

function resolverTextoDireccionCliente(cliente: Cliente): string {
  const delCliente = (cliente.direccion ?? '').trim() || (cliente.referencia ?? '').trim()
  if (delCliente) return delCliente

  const actual = (direccionLlegada.value ?? '').trim()
  if (actual) return actual

  const seleccionada = idDireccionLlegada.value
    ? direccionesDestinatario.value.find((d) => d.id === Number(idDireccionLlegada.value))
    : null
  const deSeleccion = (seleccionada?.direccion ?? '').trim()
  if (deSeleccion) return deSeleccion

  return [cliente.nombre_distrito, cliente.nombre_provincia, cliente.nombre_departamento]
    .filter(Boolean)
    .join(', ')
}

async function applyUbicacionDesdeCliente(cliente: Cliente) {
  const dir = clienteToDireccionLike(cliente)
  dir.direccion = resolverTextoDireccionCliente(cliente)
  if (!dir.direccion && !dir.id_distrito && !dir.id_departamento) return
  await applyDireccionLlegada(dir)
}

async function usarUbicacionCliente() {
  let cliente = clienteUbicacionCache.value
  const idCliente = idDestinatario.value ? Number(idDestinatario.value) : null
  if (!cliente && !idCliente) return

  aplicandoUbicacionCliente.value = true
  try {
    if (!cliente && idCliente) {
      cliente = await clientesService.obtenerPorId(idCliente)
      clienteUbicacionCache.value = cliente
    }
    if (!cliente) return

    // Conservar la dirección seleccionada en el combo; solo refresca texto/ubigeo.
    await applyUbicacionDesdeCliente(cliente)
    toastSuccess('Ubicación del cliente aplicada. Puedes ajustarla si es necesario.')
  } finally {
    aplicandoUbicacionCliente.value = false
  }
}

async function onDireccionDestinatarioCreada() {
  const id = idDestinatario.value
  if (!id) return
  await loadDireccionesDestinatario(Number(id))
}

async function applyDireccionLlegada(dir: Direccion) {
  if (applyingDireccionLlegada.value) return
  applyingDireccionLlegada.value = true
  beginUbigeoSuppress()
  try {
    direccionLlegada.value = dir.direccion
    if (dir.id_pais) idPais.value = dir.id_pais

    llegadaProvinciaFallback.value =
      dir.id_provincia && dir.nombre_provincia
        ? { value: dir.id_provincia, label: dir.nombre_provincia }
        : null
    llegadaDistritoFallback.value =
      dir.id_distrito && dir.nombre_distrito
        ? { value: dir.id_distrito, label: dir.nombre_distrito }
        : null

    idDepartamentoLlegada.value = dir.id_departamento ?? ''
    await nextTick()
    await waitForSelectOption(
      () => toSelectOptions(provinciasLlegadaQuery.data.value),
      dir.id_provincia,
    )
    idProvinciaLlegada.value = dir.id_provincia ?? ''
    await nextTick()
    await waitForSelectOption(
      () => toSelectOptions(distritosLlegadaQuery.data.value),
      dir.id_distrito,
    )
    idDistritoLlegada.value = dir.id_distrito ?? ''
    await nextTick()
    direccionLlegadaSelectError.value = ''
  } finally {
    endUbigeoSuppress()
    applyingDireccionLlegada.value = false
  }
}

async function searchClientes(query: string): Promise<SelectOption[]> {
  const response = await clientesService.listar({
    buscar: query || undefined,
    pagina: 1,
    limite: 20,
    soloActivos: 1,
  })
  return response.data.map((c) => ({
    value: c.id,
    label: getClienteOptionLabel(c),
  }))
}

function onDestinatarioCreado(cliente: Cliente) {
  idDestinatario.value = cliente.id
  destinatarioLabel.value = getClienteOptionLabel(cliente)
  clienteModalOpen.value = false
}

function onTransportistaCreado(cliente: Cliente) {
  idTransportista.value = cliente.id
  transportistaLabel.value = getClienteOptionLabel(cliente)
  transportistaModalOpen.value = false
}

function onChoferCreado(chofer?: Chofer) {
  if (!chofer) return
  idChofer.value = chofer.id
  choferLabel.value = mapChoferOption(chofer).label
  choferModalOpen.value = false
}

function onVehiculoCreado(vehiculo?: Vehiculo) {
  if (!vehiculo) return
  idVehiculo.value = vehiculo.id
  const scope = vehiculo.id_cliente == null ? 'Flota propia' : 'Cliente'
  vehiculoLabel.value = `${vehiculo.placa || `Vehículo ${vehiculo.id}`} (${scope})`
  vehiculoModalOpen.value = false
}

function mapChoferOption(c: {
  id: number
  nombres: string
  apellido_paterno?: string | null
  apellido_materno?: string | null
  numero_documento?: string | null
  id_cliente?: number | null
}): SelectOption {
  const nombre =
    [c.nombres, c.apellido_paterno, c.apellido_materno].filter(Boolean).join(' ') ||
    c.numero_documento ||
    `Chofer ${c.id}`
  const scope = c.id_cliente == null ? 'Flota propia' : 'Cliente'
  return {
    value: c.id,
    label: `${nombre}${c.numero_documento ? ` · ${c.numero_documento}` : ''} (${scope})`,
  }
}

async function searchChoferes(query: string): Promise<SelectOption[]> {
  const idDest = values.idDestinatario
  const generales = await choferesService.listar({
    buscar: query || undefined,
    pagina: 1,
    limite: 50,
    isActivos: 1,
  })

  let delCliente: typeof generales.data = []
  if (idDest) {
    const response = await choferesService.listar({
      buscar: query || undefined,
      pagina: 1,
      limite: 20,
      isActivos: 1,
      idCliente: Number(idDest),
    })
    delCliente = response.data
  }

  const flotaPropia = generales.data.filter((c) => c.id_cliente == null)
  const map = new Map<number, SelectOption>()
  for (const c of [...delCliente, ...flotaPropia]) {
    map.set(c.id, mapChoferOption(c))
  }
  return [...map.values()]
}

async function searchVehiculos(query: string): Promise<SelectOption[]> {
  const idDest = values.idDestinatario
  const generales = await vehiculosService.listar({
    buscar: query || undefined,
    pagina: 1,
    limite: 50,
  })

  let delCliente: typeof generales.data = []
  if (idDest) {
    const response = await vehiculosService.listar({
      buscar: query || undefined,
      pagina: 1,
      limite: 20,
      idCliente: Number(idDest),
    })
    delCliente = response.data
  }

  const flotaPropia = generales.data.filter((v) => v.id_cliente == null)
  const map = new Map<number, SelectOption>()
  for (const v of [...delCliente, ...flotaPropia]) {
    const scope = v.id_cliente == null ? 'Flota propia' : 'Cliente'
    map.set(v.id, {
      value: v.id,
      label: `${v.placa || `Vehículo ${v.id}`} (${scope})`,
    })
  }
  return [...map.values()]
}

function resolveUnidadBotellasId(): number | undefined {
  const units = catalogosQuery.data.value?.unidadesMedida ?? []
  const botellas = units.find(
    (u) =>
      (u.nombre ?? '').toUpperCase() === 'BOTELLAS' ||
      (u.descripcion ?? '').toUpperCase().includes('BOTELL'),
  )
  if (botellas) return botellas.id
  const unid = units.find((u) =>
    ['UNID', 'NIU', 'UND', 'UNI'].includes((u.nombre ?? '').toUpperCase()),
  )
  return unid?.id
}

async function searchBalones(query: string): Promise<SelectOption[]> {
  const response = await balonesService.listar({
    buscar: query || undefined,
    pagina: 1,
    limite: 20,
  })
  return response.data.map((b) => {
    balonesCache.set(b.id, b)
    return {
      value: b.id,
      label: labelBalonGuia(b),
    }
  })
}

async function searchProductos(query: string): Promise<SelectOption[]> {
  const response = await productosService.listar({
    buscar: query || undefined,
    pagina: 1,
    limite: 20,
  })
  return response.data.map((p) => {
    productosCache.set(p.id, {
      idUnidadMedida: p.id_unidad_medida,
      nombre: p.nombre,
      codigo: p.codigo,
    })
    return {
      value: p.id,
      label: `${p.codigo} — ${p.nombre}`,
    }
  })
}

function onBalonSelected(index: number, value: number | string | null | undefined) {
  const linea = lineas[index]
  if (!linea) return

  if (value == null || value === '') {
    linea.idBalon = ''
    linea.balonLabel = null
    linea.glosa = undefined
    return
  }

  const id = Number(value)
  const balon = balonesCache.get(id)
  if (!balon) {
    linea.idBalon = id
    return
  }

  const duplicado = lineas.some((l, i) => i !== index && Number(l.idBalon) === id)
  if (duplicado) {
    toastWarning(`El cilindro ${balon.codigo_balon} ya está en otra línea`)
  }

  linea.idBalon = id
  linea.balonLabel = labelBalonGuia(balon)
  linea.cantidad = 1
  linea.glosa = buildGuiaDetalleGlosa(balon)
  linea.descripcion = linea.glosa
  linea.idUnidadMedida = resolveUnidadBotellasId()

  if (balon.id_producto_gas) {
    linea.idProducto = balon.id_producto_gas
    linea.productoLabel = balon.nombre_producto_gas
      ? `${balon.nombre_producto_gas}`
      : `Producto #${balon.id_producto_gas}`
    if (!productosCache.has(balon.id_producto_gas) && balon.nombre_producto_gas) {
      productosCache.set(balon.id_producto_gas, {
        nombre: balon.nombre_producto_gas,
        codigo: balon.codigo_balon,
        idUnidadMedida: linea.idUnidadMedida,
      })
    }
  } else {
    toastWarning(
      `El cilindro ${balon.codigo_balon} no tiene gas/producto asociado; selecciónalo manualmente`,
    )
  }
}

function onProductoSelected(index: number, value: number | string | null | undefined) {
  const linea = lineas[index]
  if (!linea) return
  if (value == null || value === '') {
    linea.idProducto = ''
    linea.productoLabel = null
    if (!linea.idBalon) {
      linea.idUnidadMedida = undefined
      linea.descripcion = undefined
      linea.glosa = undefined
    }
    return
  }
  const id = Number(value)
  const cached = productosCache.get(id)
  linea.idProducto = id
  linea.productoLabel = cached ? `${cached.codigo} — ${cached.nombre}` : null
  if (!linea.idBalon) {
    linea.idUnidadMedida = cached?.idUnidadMedida
    linea.descripcion = cached?.nombre
    linea.glosa = cached?.nombre
  } else if (!linea.glosa && cached?.nombre) {
    linea.descripcion = linea.glosa
  }
}

function agregarLinea() {
  lineas.push({
    key: crypto.randomUUID(),
    idBalon: '',
    balonLabel: null,
    idProducto: '',
    productoLabel: null,
    cantidad: 1,
  })
}

function quitarLinea(index: number) {
  if (lineas.length <= 1) return
  lineas.splice(index, 1)
}

function resetLocal() {
  resetForm()
  destinatarioLabel.value = null
  remitenteLabel.value = null
  idRemitente.value = ''
  remitenteError.value = ''
  choferLabel.value = null
  vehiculoLabel.value = null
  transportistaLabel.value = null
  numero.value = ''
  origenProvinciaFallback.value = null
  origenDistritoFallback.value = null
  llegadaProvinciaFallback.value = null
  llegadaDistritoFallback.value = null
  beginUbigeoSuppress()
  idDepartamentoOrigen.value = ''
  idProvinciaOrigen.value = ''
  idDistritoOrigen.value = ''
  idDepartamentoLlegada.value = ''
  idProvinciaLlegada.value = ''
  idDistritoLlegada.value = ''
  endUbigeoSuppress()
  idDireccionLlegada.value = ''
  direccionesDestinatario.value = []
  almacenesFilters.value = { pagina: 1, limite: 100 }
  lineas.splice(0, lineas.length, {
    key: crypto.randomUUID(),
    idBalon: '',
    balonLabel: null,
    idProducto: '',
    productoLabel: null,
    cantidad: 1,
  })
  detallesError.value = ''
  distritoOrigenError.value = ''
  distritoLlegadaError.value = ''
  direccionLlegadaSelectError.value = ''
  llegadaHint.value = ''
  clienteUbicacionCache.value = null
}

function handleClose() {
  router.push({ name: 'admin-ventas-guias-remision' })
}

async function initCreateForm() {
  resetLocal()
  await nextTick()
  applyCatalogDefaults()
  applySucursalAlmacenDefaults()
  const sucursalId = values.idSucursal
  if (sucursalId) {
    const sucursal = (sucursalesQuery.data.value?.data ?? []).find(
      (s) => s.id === Number(sucursalId),
    )
    if (sucursal) await applyOrigenDesdeSucursal(sucursal)
  }
}

onMounted(() => {
  if (!isEdit.value) {
    void initCreateForm()
  }
})

watch(
  () => [guiaQuery.data.value, guiaId.value] as const,
  async ([guia, id]) => {
    if (!id || !guia) return

    suppressDestinatarioReset.value = true
    beginUbigeoSuppress()

    try {
      setValues({
        idTipoGuiaRemision: guia.id_tipo_guia_remision,
        serie: guia.serie,
        fecha: String(guia.fecha).slice(0, 10),
        fechaTraslado: String(guia.fecha_traslado ?? guia.fecha).slice(0, 10),
        idMotivoTraslado: guia.id_motivo_traslado ?? undefined,
        idModalidadTraslado: guia.id_modalidad_traslado ?? undefined,
        idUnidadMedida: guia.id_unidad_medida ?? undefined,
        idSucursal: guia.id_sucursal,
        idAlmacen: guia.id_almacen,
        pesoBruto: Number(guia.peso_bruto ?? 1),
        numeroBultos: Number(guia.numero_bultos ?? 1),
        idDestinatario: guia.id_destinatario ?? undefined,
        direccionOrigen: guia.direccion_origen ?? '',
        direccionLlegada: guia.direccion_llegada ?? '',
        idChofer: guia.id_chofer ?? undefined,
        idVehiculo: guia.id_vehiculo ?? undefined,
        idTransportista: guia.id_transportista ?? undefined,
        observaciones: guia.observaciones ?? '',
      })

      numero.value = guia.numero
      destinatarioLabel.value = guia.nombre_destinatario ?? null
      choferLabel.value = guia.nombre_chofer ?? null
      vehiculoLabel.value = guia.placa_vehiculo ?? null
      transportistaLabel.value = guia.nombre_transportista ?? null

      if (guia.codigo_tipo_guia === '31' && guia.id_cliente) {
        idRemitente.value = guia.id_cliente
        remitenteLabel.value = guia.nombre_cliente ?? null
      } else {
        idRemitente.value = ''
        remitenteLabel.value = null
      }

      almacenesFilters.value = {
        pagina: 1,
        limite: 100,
        idSucursal: guia.id_sucursal,
      }

      if (guia.id_pais_origen) idPais.value = guia.id_pais_origen
      else if (guia.id_pais_llegada) idPais.value = guia.id_pais_llegada

      origenDistritoFallback.value =
        guia.id_distrito_origen && guia.nombre_distrito_origen
          ? { value: guia.id_distrito_origen, label: guia.nombre_distrito_origen }
          : null
      llegadaDistritoFallback.value =
        guia.id_distrito_llegada && guia.nombre_distrito_llegada
          ? { value: guia.id_distrito_llegada, label: guia.nombre_distrito_llegada }
          : null

      idDepartamentoOrigen.value = guia.id_departamento_origen ?? ''
      await nextTick()
      await waitForSelectOption(
        () => toSelectOptions(provinciasOrigenQuery.data.value),
        guia.id_provincia_origen,
      )
      idProvinciaOrigen.value = guia.id_provincia_origen ?? ''
      await nextTick()
      await waitForSelectOption(
        () => toSelectOptions(distritosOrigenQuery.data.value),
        guia.id_distrito_origen,
      )
      idDistritoOrigen.value = guia.id_distrito_origen ?? ''

      idDepartamentoLlegada.value = guia.id_departamento_llegada ?? ''
      await nextTick()
      await waitForSelectOption(
        () => toSelectOptions(provinciasLlegadaQuery.data.value),
        guia.id_provincia_llegada,
      )
      idProvinciaLlegada.value = guia.id_provincia_llegada ?? ''
      await nextTick()
      await waitForSelectOption(
        () => toSelectOptions(distritosLlegadaQuery.data.value),
        guia.id_distrito_llegada,
      )
      idDistritoLlegada.value = guia.id_distrito_llegada ?? ''

      lineas.splice(
        0,
        lineas.length,
        ...(guia.detalles?.length
          ? guia.detalles.map((d) => ({
              key: crypto.randomUUID(),
              idBalon: (d.id_balon ?? '') as number | '',
              balonLabel: d.codigo_balon
                ? `${d.codigo_balon}${d.nombre_producto ? ` · ${d.nombre_producto}` : ''}`
                : null,
              idProducto: d.id_producto,
              productoLabel: d.codigo_producto
                ? `${d.codigo_producto} — ${d.nombre_producto ?? d.descripcion ?? ''}`
                : (d.nombre_producto ?? d.descripcion ?? null),
              cantidad: Number(d.cantidad),
              idUnidadMedida: d.id_unidad_medida ?? undefined,
              descripcion: d.glosa ?? d.descripcion ?? d.nombre_producto ?? undefined,
              glosa: d.glosa ?? d.descripcion ?? d.nombre_producto ?? undefined,
            }))
          : [
              {
                key: crypto.randomUUID(),
                idBalon: '' as const,
                balonLabel: null,
                idProducto: '' as const,
                productoLabel: null,
                cantidad: 1,
              },
            ]),
      )

      if (guia.id_destinatario) {
        await loadDireccionesDestinatario(guia.id_destinatario)
      }

      await nextTick()
    } finally {
      endUbigeoSuppress()
      suppressDestinatarioReset.value = false
    }
  },
)

const onSubmit = handleSubmit(async (formValues) => {
  const userId = authStore.user?.id
  if (!userId) return

  const tipoOpt = tipoGuiaOptions.value.find((t) => t.value === formValues.idTipoGuiaRemision)
  const es31 = tipoOpt?.codigo === '31'

  if (es31 && !idRemitente.value) {
    remitenteError.value = 'Remitente obligatorio para GRE transportista (31)'
    toastWarning('Selecciona el remitente de la mercancía')
    return
  }

  if (!idDistritoOrigen.value || !idDistritoLlegada.value) {
    if (!idDistritoOrigen.value) distritoOrigenError.value = 'Selecciona distrito de origen'
    if (!idDistritoLlegada.value) distritoLlegadaError.value = 'Selecciona distrito de llegada'
    toastWarning('Completa el ubigeo de origen y destino')
    return
  }

  const modalidadCodigo = codigoModalidad.value
  if (modalidadCodigo === '02' && (!formValues.idChofer || !formValues.idVehiculo)) {
    toastWarning('Transporte privado requiere chofer y vehículo')
    return
  }
  if (modalidadCodigo === '01' && !formValues.idTransportista) {
    toastWarning('Transporte público requiere transportista')
    return
  }

  const detalles = lineas
    .filter((l) => l.idProducto && Number(l.cantidad) > 0)
    .map((l, i) => {
      const glosa = (l.glosa || l.descripcion || '').trim() || undefined
      return {
        item: i + 1,
        idProducto: Number(l.idProducto),
        cantidad: Number(l.cantidad),
        idUnidadMedida: l.idUnidadMedida ?? resolveUnidadBotellasId(),
        descripcion: glosa,
        glosa,
        idBalon: l.idBalon ? Number(l.idBalon) : undefined,
      }
    })

  if (detalles.length === 0) {
    detallesError.value = 'Agrega al menos un envase o producto'
    toastWarning('Agrega al menos un cilindro/producto')
    return
  }
  detallesError.value = ''

  const idClientePayload = es31
    ? Number(idRemitente.value)
    : Number(formValues.idDestinatario)

  const payloadBase = {
    fecha: formValues.fecha,
    fechaTraslado: formValues.fechaTraslado,
    idSucursal: Number(formValues.idSucursal),
    idAlmacen: Number(formValues.idAlmacen),
    idCliente: idClientePayload,
    idMotivoTraslado: Number(formValues.idMotivoTraslado),
    idUnidadMedida: formValues.idUnidadMedida ? Number(formValues.idUnidadMedida) : undefined,
    pesoBruto: Number(formValues.pesoBruto),
    numeroBultos: formValues.numeroBultos ? Number(formValues.numeroBultos) : 1,
    direccionOrigen: formValues.direccionOrigen,
    idDistritoOrigen: Number(idDistritoOrigen.value),
    idDestinatario: Number(formValues.idDestinatario),
    direccionLlegada: formValues.direccionLlegada,
    idDistritoLlegada: Number(idDistritoLlegada.value),
    idModalidadTraslado: Number(formValues.idModalidadTraslado),
    idTransportista: formValues.idTransportista
      ? Number(formValues.idTransportista)
      : undefined,
    idChofer: formValues.idChofer ? Number(formValues.idChofer) : undefined,
    idVehiculo: formValues.idVehiculo ? Number(formValues.idVehiculo) : undefined,
    observaciones: formValues.observaciones || undefined,
    detalles,
    idUsuarioAuditoria: userId,
  }

  if (isEdit.value && guiaId.value) {
    await updateMutation.mutateAsync({
      id: guiaId.value,
      payload: payloadBase,
    })
    await router.push({ name: 'admin-ventas-guias-remision' })
    return
  }

  await createMutation.mutateAsync({
    idTipoGuiaRemision: Number(formValues.idTipoGuiaRemision),
    serie: String(formValues.serie).trim().toUpperCase(),
    ...payloadBase,
  })
  await router.push({ name: 'admin-ventas-guias-remision' })
})
</script>
