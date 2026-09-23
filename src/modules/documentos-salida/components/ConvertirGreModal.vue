<template>
  <AppModal v-model="open" :title="tituloModal" size="xl" @close="handleClose">
    <div class="space-y-5">
      <!--
        El emisor no se elige acá: la guía sale con la empresa que está
        registrada ante SUNAT (empresa activa o ya guardada en la orden).
        Solo se muestra, a modo informativo, quién la emitirá.
      -->
      <div class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-white/5">
        <span class="block text-[11px] font-semibold uppercase tracking-wider text-gray-500">Empresa que emitirá esta guía</span>
        <span class="text-sm font-semibold text-gray-800 dark:text-white/90">
          {{ empresaSeleccionadaInfo ? (empresaSeleccionadaInfo.razon_social || empresaSeleccionadaInfo.nombre_comercial) : 'Cargando empresa emisora…' }}
        </span>
        <span v-if="empresaSeleccionadaInfo" class="ml-2 rounded bg-gray-200 px-1.5 py-0.5 font-mono text-[11px] font-bold text-gray-700 dark:bg-white/10 dark:text-gray-300">RUC: {{ empresaSeleccionadaInfo.ruc }}</span>
      </div>
      <p class="text-sm text-gray-500">No se puede cambiar el emisor en esta guía: la empresa emisora la define SUNAT. Si necesitas emitir con otra empresa, el cambio se realiza desde SUNAT; mientras tanto, esta guía se emitirá con la empresa mostrada arriba.</p>
      <div
        v-if="idEmpresaEmisora && empresaSeleccionadaInfo"
        class="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs dark:border-gray-700 dark:bg-white/5"
      >
        <span class="font-semibold text-gray-800 dark:text-white/90">{{ empresaSeleccionadaInfo.razon_social || empresaSeleccionadaInfo.nombre_comercial }}</span>
        <span class="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-[11px] font-bold text-gray-700 dark:bg-white/10 dark:text-gray-300">RUC: {{ empresaSeleccionadaInfo.ruc }}</span>
        <span
          class="rounded-full px-2 py-0.5 text-[11px] font-bold"
          :class="entornoBadgeClass"
        >
          {{ documento?.gre_entorno === 'produccion' ? 'PRODUCCIÓN' : 'PRUEBAS (BETA)' }}
        </span>
      </div>
      <!-- 1. Tipo de guía: define quién emite y, con eso, qué datos pide SUNAT -->
      <section class="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
        <h4 class="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <AppIcon :name="ICONS.fileText" :size="14" />
          1. ¿Qué guía vas a emitir?
        </h4>
        <p class="mb-3 text-xs text-gray-500 dark:text-gray-400">
          El tipo depende de <strong>quién es dueño de la carga</strong>, no de cómo se transporta.
        </p>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            v-for="opcion in tipoGuiaCards"
            :key="opcion.codigo"
            type="button"
            class="flex items-start gap-3 rounded-xl border p-3 text-left transition"
            :class="cardClass(codigoTipoGuia === opcion.codigo, opcion.disponible)"
            :disabled="!opcion.disponible || catalogosCargando"
            @click="seleccionarTipoGuia(opcion.codigo)"
          >
            <span
              class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              :class="
                codigoTipoGuia === opcion.codigo
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'
              "
            >
              <AppIcon :name="opcion.icono" :size="16" />
            </span>
            <span class="min-w-0">
              <span class="block text-sm font-semibold text-gray-800 dark:text-white/90">
                {{ opcion.titulo }}
                <span class="ml-1 text-[11px] font-medium text-gray-400">({{ opcion.codigo }} · serie {{ opcion.prefijo }}###)</span>
              </span>
              <span class="mt-0.5 block text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                {{ opcion.descripcion }}
              </span>
            </span>
          </button>
        </div>
        <div
          v-if="esGreTransportista"
          class="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
        >
          <AppIcon :name="ICONS.alertTriangle" :size="14" class="mt-0.5 shrink-0" />
          <span>
            Solo aplica si la empresa está inscrita en el MTC como transportista y traslada carga
            <strong>de un tercero</strong>. Si la carga es nuestra (venta, recarga, traslado entre
            almacenes) corresponde la guía <strong>Remitente</strong>.
          </span>
        </div>
      </section>

      <!-- 2. Modalidad: solo la 09 elige; la 31 es pública por definición -->
      <section class="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
        <h4 class="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <AppIcon :name="ICONS.truck" :size="14" />
          2. ¿Quién transporta la carga?
        </h4>
        <template v-if="!esGreTransportista">
          <p class="mb-3 text-xs text-gray-500 dark:text-gray-400">
            Define qué bloque de transporte pide SUNAT: flota propia o un transportista contratado.
          </p>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              v-for="opcion in modalidadCards"
              :key="opcion.codigo"
              type="button"
              class="flex items-start gap-3 rounded-xl border p-3 text-left transition"
              :class="cardClass(codigoModalidad === opcion.codigo, opcion.disponible)"
              :disabled="!opcion.disponible || catalogosCargando"
              @click="seleccionarModalidad(opcion.codigo)"
            >
              <span
                class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                :class="
                  codigoModalidad === opcion.codigo
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'
                "
              >
                <AppIcon :name="opcion.icono" :size="16" />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold text-gray-800 dark:text-white/90">
                  {{ opcion.titulo }}
                  <span class="ml-1 text-[11px] font-medium text-gray-400">({{ opcion.codigo }})</span>
                </span>
                <span class="mt-0.5 block text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  {{ opcion.descripcion }}
                </span>
              </span>
            </button>
          </div>
        </template>
        <p
          v-else
          class="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
        >
          <AppIcon :name="ICONS.info" :size="14" class="mt-0.5 shrink-0" />
          <span>
            En la guía de transportista la modalidad es siempre <strong>transporte público (01)</strong>:
            nuestra empresa es el transportista y la carga va en <strong>vehículo y chofer propios</strong>.
          </span>
        </p>
      </section>

      <!-- 3. Datos generales -->
      <section class="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
        <h4 class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <AppIcon :name="ICONS.package" :size="14" />
          3. Datos de la guía
        </h4>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <!--
            Serie y correlativo como en boletas: la serie se elige entre las ya
            usadas para el tipo de guía y el número lo reserva la API al guardar.
          -->
          <AppSelect
            v-model="serieSeleccionada"
            label="Serie"
            required
            :placeholder="seriesGreQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
            :options="serieOptions"
            :disabled="seriesGreQuery.isLoading.value"
            :hint="serieHint"
          />
          <AppInput
            v-if="serieSeleccionada === NUEVA_SERIE"
            v-model="form.serie"
            label="Nueva serie (4 caracteres)"
            required
            maxlength="4"
            :placeholder="`${prefijoSerie}002`"
            :error="errorSerie ?? undefined"
          />
          <AppInput :model-value="numeroPreview" label="Número" placeholder="Automático" disabled />
          <AppSelect
            v-model="form.idMotivoTraslado"
            label="Motivo de traslado"
            required
            :placeholder="catalogosCargando ? 'Cargando...' : 'Selecciona...'"
            :options="motivoTrasladoOptions"
            :disabled="catalogosCargando"
            hint="Catálogo 20 SUNAT"
          />
          <AppDatePicker v-model="form.fechaEmisionGre" label="Fecha de emisión de la GRE" required />
          <AppDatePicker v-model="form.fechaTraslado" label="Fecha de inicio del traslado" required />
          <AppInput
            v-model.number="form.pesoBruto"
            type="number"
            min="0"
            step="0.01"
            label="Peso bruto total (kg)"
            required
            hint="SUNAT lo exige mayor a 0"
          />
          <AppInput v-model.number="form.numeroBultos" type="number" min="1" step="1" label="N° de bultos" />
        </div>
      </section>

      <!-- 4. Origen / llegada -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section class="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
          <h4 class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <AppIcon :name="ICONS.warehouse" :size="14" />
            4. Punto de partida
          </h4>
          <div class="space-y-3">
            <AppInput v-model="form.direccionOrigen" label="Dirección" required placeholder="Almacén / punto de partida" />
            <UbigeoCascadeSelect
              v-model:id-pais="origenPaisId"
              v-model:id-departamento="origenDeptoId"
              v-model:id-provincia="origenProvId"
              v-model:id-distrito="form.idDistritoOrigen"
              v-model:presetting="origenPresetting"
            />
          </div>
        </section>

        <section class="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h4 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <AppIcon :name="ICONS.mapPin" :size="14" />
              5. Punto de llegada
            </h4>
            <div class="flex items-center gap-3">
              <button
                v-if="direccionProveedor"
                type="button"
                class="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                @click="usarDireccionProveedor"
              >
                <AppIcon :name="ICONS.warehouse" :size="12" />
                Usar dirección de la planta
              </button>
              <button
                v-if="documento?.direccion_entrega"
                type="button"
                class="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                @click="usarDireccionEntrega"
              >
                <AppIcon :name="ICONS.mapPin" :size="12" />
                Usar dirección de entrega
              </button>
            </div>
          </div>
          <div class="space-y-3">
            <AppInput v-model="form.direccionLlegada" label="Dirección" required placeholder="Dirección del destinatario" />
            <UbigeoCascadeSelect
              v-model:id-pais="llegadaPaisId"
              v-model:id-departamento="llegadaDeptoId"
              v-model:id-provincia="llegadaProvId"
              v-model:id-distrito="form.idDistritoLlegada"
              v-model:presetting="llegadaPresetting"
            />
          </div>
        </section>
      </div>

      <!-- 6. Transporte: solo el bloque que SUNAT pide para el caso elegido -->
      <section class="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
        <h4 class="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <AppIcon :name="ICONS.idCard" :size="14" />
          6. {{ requiereFlotaPropia ? 'Vehículo y chofer' : 'Transportista contratado' }}
        </h4>
        <p class="mb-3 text-xs text-gray-500 dark:text-gray-400">
          <template v-if="requiereFlotaPropia">
            SUNAT pide la placa del vehículo y el chofer con su documento y número de licencia.
          </template>
          <template v-else>
            SUNAT pide el RUC del transportista. Él emite su propia guía de transportista con
            vehículo y chofer, así que aquí no se registran.
          </template>
        </p>

        <div v-if="requiereFlotaPropia" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div class="flex items-end gap-2">
              <SearchableSelect
                v-model="form.idChofer"
                label="Chofer"
                placeholder="Busca chofer..."
                :model-label="choferLabel"
                :search-fn="searchChoferes"
                class="min-w-0 flex-1"
              />
              <button
                type="button"
                title="Nuevo chofer"
                class="mb-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10"
                @click="choferModalOpen = true"
              >
                <AppIcon :name="ICONS.plus" :size="18" />
              </button>
            </div>
            <p
              v-if="choferSinLicencia"
              class="mt-1.5 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"
            >
              <AppIcon :name="ICONS.alertTriangle" :size="12" />
              Este chofer no tiene licencia registrada: SUNAT la exige. Edítalo antes de emitir.
            </p>
          </div>
          <div class="flex items-end gap-2">
            <SearchableSelect
              v-model="form.idVehiculo"
              label="Vehículo (placa)"
              placeholder="Busca vehículo..."
              :model-label="vehiculoLabel"
              :search-fn="searchVehiculos"
              class="min-w-0 flex-1"
            />
            <button
              type="button"
              title="Nuevo vehículo"
              class="mb-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10"
              @click="vehiculoModalOpen = true"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
            </button>
          </div>
        </div>

        <div v-else>
          <div class="flex items-end gap-2">
            <SearchableSelect
              v-model="form.idTransportista"
              label="Transportista (empresa con RUC)"
              placeholder="Busca por razón social o RUC..."
              :model-label="transportistaLabel"
              :search-fn="searchTransportistas"
              class="min-w-0 flex-1"
            />
            <button
              type="button"
              title="Nuevo transportista"
              class="mb-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10"
              @click="transportistaModalOpen = true"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
            </button>
          </div>
          <p
            v-if="transportistaSinRuc"
            class="mt-1.5 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"
          >
            <AppIcon :name="ICONS.alertTriangle" :size="12" />
            El transportista debe tener RUC (11 dígitos); el seleccionado tiene otro documento.
          </p>
        </div>

        <!-- En la 31 el dueño de la carga es el cliente de la orden -->
        <div
          v-if="esGreTransportista"
          class="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs dark:border-gray-700 dark:bg-white/5"
        >
          <span class="block text-[11px] uppercase tracking-wider text-gray-400">Remitente (dueño de la carga)</span>
          <span v-if="remitente.doc" class="font-semibold text-gray-800 dark:text-white/90">
            {{ remitente.nombre }} · {{ remitente.doc }}
          </span>
          <span v-else class="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <AppIcon :name="ICONS.alertTriangle" :size="12" />
            La orden no tiene cliente con documento: se toma como remitente y SUNAT lo exige.
          </span>
        </div>
      </section>

      <!-- Resumen de lo que falta: se puede guardar a medias, emitir no -->
      <div
        v-if="pendientes.length"
        class="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10"
      >
        <p class="mb-1.5 flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
          <AppIcon :name="ICONS.alertCircle" :size="14" />
          Falta para poder emitir a SUNAT
        </p>
        <ul class="ml-5 list-disc space-y-0.5 text-xs text-amber-800 dark:text-amber-300">
          <li v-for="item in pendientes" :key="item">{{ item }}</li>
        </ul>
        <p class="mt-2 text-[11px] text-amber-700 dark:text-amber-400">
          Puedes guardar ahora y completar después; «Emitir a SUNAT» validará todo de nuevo.
        </p>
      </div>
      <div
        v-else
        class="flex items-center gap-2 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-xs font-medium text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400"
      >
        <AppIcon :name="ICONS.check" :size="14" />
        Todo listo: al guardar se reserva {{ form.serie || prefijoSerie + '###' }}-{{ numeroPreview || '########' }} y podrás emitir a SUNAT.
      </div>
    </div>
    <ChoferFormModal v-model="choferModalOpen" mode="create" @saved="onChoferCreado" />
    <VehiculoFormModal v-model="vehiculoModalOpen" mode="create" @saved="onVehiculoCreado" />
    <ClienteFormModal v-model="transportistaModalOpen" mode="create" @saved="onTransportistaCreado" />
    <template #footer>
      <button
        type="button"
        class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
        @click="handleClose"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-70"
        :disabled="!idEmpresaEmisora || !form.serie || Boolean(errorSerie) || !form.idTipoGuiaRemision || mutation.isPending.value"
        @click="onGuardar"
      >
        {{ mutation.isPending.value ? 'Guardando...' : 'Guardar' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { toastWarning } from '@/shared/composables/useToast'
import { computed, reactive, ref, watch } from 'vue'
import { useEmpresasQuery } from '@/modules/configuracion/empresas/composables/useEmpresasQuery'
import { useEmpresaSeleccionada } from '@/modules/configuracion/empresas/composables/useEmpresaSeleccionada'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import ClienteFormModal from '@/modules/clientes/components/ClienteFormModal.vue'
import { useClienteDetailQuery } from '@/modules/clientes/composables/useClienteDetailQuery'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import { getClienteOptionLabel } from '@/modules/clientes/utils/clienteNombre'
import ChoferFormModal from '@/modules/choferes/components/ChoferFormModal.vue'
import { choferesService } from '@/modules/choferes/services/choferes.service'
import type { Chofer } from '@/modules/choferes/interfaces/chofer.interface'
import VehiculoFormModal from '@/modules/vehiculos/components/VehiculoFormModal.vue'
import { vehiculosService } from '@/modules/vehiculos/services/vehiculos.service'
import type { Vehiculo } from '@/modules/vehiculos/interfaces/vehiculo.interface'
import {
  useSeriesGreQuery,
} from '../composables/useDocumentosSalidaQuery'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { useConvertirAGreMutation } from '../composables/useDocumentoSalidaMutations'
import type { DocumentoSalida } from '../interfaces/documento-salida.interface'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'
import { ListaIds } from '@/shared/constants/lista-ids'
import { AppDatePicker, AppInput, AppModal, AppSelect, UbigeoCascadeSelect } from '@/shared/components'
import SearchableSelect from '@/shared/components/form/SearchableSelect.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { toastApiError } from '@/shared/composables/useToast'

const props = defineProps<{
  documento: DocumentoSalida | null | undefined
}>()

const open = defineModel<boolean>({ default: false })

const authStore = useAuthStore()

const tituloModal = computed(() =>
  props.documento?.serie ? 'Editar datos de la guía de remisión' : 'Convertir a guía de remisión',
)

// ---- Catálogos ----
const tiposGuiaQuery = useListaOpcionesQuery(ref(ListaIds.TIPO_GUIA_REMISION))
const modalidadesQuery = useListaOpcionesQuery(ref(ListaIds.MODALIDAD_TRASLADO))
const motivosQuery = useListaOpcionesQuery(ref(ListaIds.MOTIVO_TRASLADO))

const catalogosCargando = computed(() =>
  tiposGuiaQuery.isLoading.value || modalidadesQuery.isLoading.value || motivosQuery.isLoading.value,
)

const motivoTrasladoOptions = computed<SelectOption[]>(
  () =>
    motivosQuery.data.value?.map((o) => ({
      value: o.id,
      label: formatListaOpcionLabel(o.nombre, o.descripcion),
    })) ?? [],
)

/** Código SUNAT (descripcion del catálogo) → id de la opción. */
function idPorCodigo(lista: { id: number; descripcion?: string | null }[] | undefined, codigo: string) {
  return lista?.find((o) => (o.descripcion ?? '').trim() === codigo)?.id ?? null
}
function codigoPorId(lista: { id: number; descripcion?: string | null }[] | undefined, id: number | '' | undefined) {
  if (!id) return null
  return lista?.find((o) => o.id === Number(id))?.descripcion?.trim() ?? null
}

const CODIGO_GRE_REMITENTE = '09'
const CODIGO_GRE_TRANSPORTISTA = '31'
const CODIGO_MODALIDAD_PUBLICO = '01'
const CODIGO_MODALIDAD_PRIVADO = '02'

const empresaActiva = useEmpresaSeleccionada()
const idEmpresaEmisora = ref<number | undefined>()
const empresasQuery = useEmpresasQuery(ref({ pagina: 1, limite: 100 }))

const empresaSeleccionadaInfo = computed(() => {
  if (!idEmpresaEmisora.value) return null
  return (empresasQuery.data.value?.data ?? []).find(e => e.id === idEmpresaEmisora.value) ?? null
})

const entornoBadgeClass = computed(() => {
  const entorno = props.documento?.gre_entorno
  if (entorno === 'produccion') return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
  return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
})

const form = reactive({
  serie: '',
  idTipoGuiaRemision: '' as number | '',
  idMotivoTraslado: '' as number | '',
  idModalidadTraslado: '' as number | '',
  fechaEmisionGre: '',
  fechaTraslado: '',
  direccionOrigen: '',
  idDistritoOrigen: undefined as number | undefined,
  direccionLlegada: '',
  idDistritoLlegada: undefined as number | undefined,
  idTransportista: undefined as number | undefined,
  idChofer: undefined as number | undefined,
  idVehiculo: undefined as number | undefined,
  pesoBruto: undefined as number | undefined,
  numeroBultos: undefined as number | undefined,
})

// ---- Tipo de guía y modalidad (tarjetas) ----
const codigoTipoGuia = computed(() => codigoPorId(tiposGuiaQuery.data.value, form.idTipoGuiaRemision))
const esGreTransportista = computed(() => codigoTipoGuia.value === CODIGO_GRE_TRANSPORTISTA)

/** En la 31 la modalidad la fija SUNAT; en la 09 la elige el usuario. */
const codigoModalidad = computed(() =>
  esGreTransportista.value
    ? CODIGO_MODALIDAD_PUBLICO
    : codigoPorId(modalidadesQuery.data.value, form.idModalidadTraslado),
)

/** Vehículo + chofer propios: transporte privado (09/02) o guía de transportista (31). */
const requiereFlotaPropia = computed(
  () => esGreTransportista.value || codigoModalidad.value === CODIGO_MODALIDAD_PRIVADO,
)

const tipoGuiaCards = computed(() => {
  const tipos = tiposGuiaQuery.data.value
  return [
    {
      codigo: CODIGO_GRE_REMITENTE,
      prefijo: 'T',
      titulo: 'Remitente',
      icono: ICONS.package,
      descripcion:
        'La carga es nuestra: venta, envío a recarga, traslado entre almacenes o devolución. Es el caso habitual.',
      disponible: idPorCodigo(tipos, CODIGO_GRE_REMITENTE) != null,
    },
    {
      codigo: CODIGO_GRE_TRANSPORTISTA,
      prefijo: 'V',
      titulo: 'Transportista',
      icono: ICONS.truck,
      descripcion:
        'Nuestra empresa transporta carga de un tercero como empresa de transporte registrada en el MTC.',
      disponible: idPorCodigo(tipos, CODIGO_GRE_TRANSPORTISTA) != null,
    },
  ]
})

const modalidadCards = computed(() => {
  const modalidades = modalidadesQuery.data.value
  return [
    {
      codigo: CODIGO_MODALIDAD_PRIVADO,
      titulo: 'Transporte privado',
      icono: ICONS.idCard,
      descripcion: 'Flota propia: se registra el vehículo (placa) y el chofer con licencia.',
      disponible: idPorCodigo(modalidades, CODIGO_MODALIDAD_PRIVADO) != null,
    },
    {
      codigo: CODIGO_MODALIDAD_PUBLICO,
      titulo: 'Transporte público',
      icono: ICONS.building2,
      descripcion: 'Contratamos una empresa de transporte: solo se registra su RUC; ella pone vehículo y chofer.',
      disponible: idPorCodigo(modalidades, CODIGO_MODALIDAD_PUBLICO) != null,
    },
  ]
})

function seleccionarTipoGuia(codigo: string) {
  const id = idPorCodigo(tiposGuiaQuery.data.value, codigo)
  if (id != null) form.idTipoGuiaRemision = id
}

function seleccionarModalidad(codigo: string) {
  const id = idPorCodigo(modalidadesQuery.data.value, codigo)
  if (id != null) form.idModalidadTraslado = id
}

function cardClass(activa: boolean, disponible: boolean) {
  if (!disponible) return 'cursor-not-allowed border-gray-100 opacity-50 dark:border-gray-800'
  return activa
    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500 dark:border-brand-400 dark:bg-brand-500/10 dark:ring-brand-400'
    : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-brand-500/50 dark:hover:bg-white/5'
}

// Al cambiar de tipo de guía la serie anterior (T### vs V###) ya no sirve.
watch(codigoTipoGuia, (nuevo, anterior) => {
  if (!anterior || nuevo === anterior) return
  const prefijo = nuevo === CODIGO_GRE_TRANSPORTISTA ? 'V' : 'T'
  if (form.serie && !form.serie.startsWith(prefijo)) {
    form.serie = ''
    serieSeleccionada.value = ''
  }
})

// ---- Serie y   correlativo ----
/** Valor del select para escribir una serie que todavía no se ha usado. */
const NUEVA_SERIE = '__nueva__'
const serieSeleccionada = ref<string>('')

const idTipoGuiaSeleccionado = computed(() =>
  form.idTipoGuiaRemision ? Number(form.idTipoGuiaRemision) : null,
)
/** SUNAT: 09 GRE Remitente → T###, 31 GRE Transportista → V###. */
const prefijoSerie = computed(() => (esGreTransportista.value ? 'V' : 'T'))

const seriesGreQuery = useSeriesGreQuery(idTipoGuiaSeleccionado, open)
const seriesGre = computed(() => seriesGreQuery.data.value?.series ?? [])

const serieOptions = computed<SelectOption[]>(() => [
  ...seriesGre.value.map((s) => ({
    value: s.serie,
    label: `${s.serie} · siguiente ${s.siguiente_numero}`,
  })),
  { value: NUEVA_SERIE, label: 'Otra serie...' },
])

const errorSerie = computed<string | null>(() => {
  if (serieSeleccionada.value !== NUEVA_SERIE) return null
  const serie = form.serie.trim().toUpperCase()
  if (!serie) return 'Ingresa la nueva serie'
  if (!/^[A-Z][A-Z0-9]{3}$/.test(serie)) return 'La serie debe tener 4 caracteres (ej. T001)'
  if (!serie.startsWith(prefijoSerie.value)) {
    return `Para este tipo de guía la serie debe empezar con ${prefijoSerie.value} (ej. ${prefijoSerie.value}001)`
  }
  return null
})

/** Número que reservará la API: el ya asignado si se conserva la serie, o el siguiente de la serie. */
const numeroPreview = computed(() => {
  const d = props.documento
  const serie = form.serie.trim().toUpperCase()
  if (!serie) return ''
  if (d?.numero_sunat && d.serie === serie) return d.numero_sunat
  return seriesGre.value.find((s) => s.serie === serie)?.siguiente_numero ?? '00000001'
})

const serieHint = computed(() => {
  const d = props.documento
  if (d?.numero_sunat && d.serie === form.serie.trim().toUpperCase()) {
    return `Este documento ya tiene reservado ${d.serie}-${d.numero_sunat}`
  }
  return 'El número se asigna automáticamente al guardar'
})

watch(serieSeleccionada, (value) => {
  if (value === NUEVA_SERIE) {
    // Se vacía solo si el texto era una serie existente; una serie nueva a medio escribir se conserva.
    if (seriesGre.value.some((s) => s.serie === form.serie)) form.serie = ''
    return
  }
  form.serie = value
})

watch(
  () => form.serie,
  (value) => {
    const upper = value.toUpperCase()
    if (upper !== value) form.serie = upper
  },
)

/**
 * Al cargar (o cambiar de tipo de guía) alinear el select con la serie del
 * formulario: si ya está en la lista se selecciona; si el documento trae una
 * serie que no se ha usado aún se mantiene como "otra"; si no hay ninguna se
 * toma la primera disponible.
 */
const sincronizarSerieSeleccionada = () => {
  // Hasta que llegue la lista del tipo actual no hay con qué alinear.
  if (!open.value || !seriesGreQuery.data.value) return
  const lista = seriesGre.value
  const actual = form.serie.trim().toUpperCase()
  if (actual && lista.some((s) => s.serie === actual)) {
    serieSeleccionada.value = actual
    return
  }
  if (actual && actual.startsWith(prefijoSerie.value)) {
    serieSeleccionada.value = NUEVA_SERIE
    return
  }
  serieSeleccionada.value = lista[0]?.serie ?? NUEVA_SERIE
}

watch(seriesGre, sincronizarSerieSeleccionada)

// ---- Ubigeo en cascada ----
const origenPaisId = ref<number | undefined>(undefined)
const origenDeptoId = ref<number | undefined>(undefined)
const origenProvId = ref<number | undefined>(undefined)
const origenPresetting = ref(false)
const llegadaPaisId = ref<number | undefined>(undefined)
const llegadaDeptoId = ref<number | undefined>(undefined)
const llegadaProvId = ref<number | undefined>(undefined)
const llegadaPresetting = ref(false)

function usarDireccionEntrega() {
  const d = props.documento
  if (!d?.direccion_entrega) return
  form.direccionLlegada = d.direccion_entrega
  llegadaPresetting.value = true
  llegadaPaisId.value = d.id_pais_entrega ?? undefined
  llegadaDeptoId.value = d.id_departamento_entrega ?? undefined
  llegadaProvId.value = d.id_provincia_entrega ?? undefined
  form.idDistritoLlegada = d.id_distrito_entrega ?? undefined
  requestAnimationFrame(() => {
    llegadaPresetting.value = false
  })
}

/**
 * En recarga de planta externa la carga va al proveedor: su dirección es el
 * punto de llegada de la guía. No viene en el documento, así que se pide al
 * abrir el modal; si el proveedor no la tiene registrada, el bloque queda como
 * estaba y se llena a mano.
 */
const esPlantaExterna = computed(
  () => props.documento?.nombre_tipo_orden === 'RECARGA_PLANTA_EXTERNA',
)
const proveedorQuery = useClienteDetailQuery(
  computed(() => props.documento?.id_proveedor ?? undefined),
  computed(() => open.value && esPlantaExterna.value),
)
const proveedor = computed(() => (esPlantaExterna.value ? proveedorQuery.data.value : null))
const direccionProveedor = computed(() => proveedor.value?.direccion?.trim() || '')

function usarDireccionProveedor() {
  const p = proveedor.value
  if (!direccionProveedor.value || !p) return
  form.direccionLlegada = direccionProveedor.value
  llegadaPresetting.value = true
  llegadaPaisId.value = p.id_pais ?? undefined
  llegadaDeptoId.value = p.id_departamento ?? undefined
  llegadaProvId.value = p.id_provincia ?? undefined
  form.idDistritoLlegada = p.id_distrito ?? undefined
  requestAnimationFrame(() => {
    llegadaPresetting.value = false
  })
}

// La dirección llega después de abrir el modal: se precarga solo si el punto
// de llegada sigue vacío, para no pisar lo que el usuario ya escribió.
watch(direccionProveedor, (direccion) => {
  if (!open.value || !direccion) return
  if (form.direccionLlegada.trim() || form.idDistritoLlegada) return
  usarDireccionProveedor()
})

// ---- Transporte ----
const choferModalOpen = ref(false)
const vehiculoModalOpen = ref(false)
const transportistaModalOpen = ref(false)
const choferLabel = ref<string | null>(null)
const vehiculoLabel = ref<string | null>(null)
const transportistaLabel = ref<string | null>(null)

/**
 * Lo que SUNAT valida de cada elección (licencia del chofer, RUC del
 * transportista) no viaja en el select: se recuerda de los resultados de
 * búsqueda para avisar aquí y no recién al emitir.
 */
const licenciaPorChofer = ref<Record<number, string | null>>({})
const documentoPorCliente = ref<Record<number, string>>({})

async function searchChoferes(query: string): Promise<SelectOption[]> {
  const response = await choferesService.listar({ buscar: query || undefined, pagina: 1, limite: 30, isActivos: 1 })
  return response.data.map((c: Chofer) => {
    if (c.codigo_licencia !== undefined) {
      licenciaPorChofer.value[c.id] = c.codigo_licencia?.trim() || null
    }
    return {
      value: c.id,
      label:
        `${c.nombres} ${c.apellido_paterno ?? ''}`.trim() +
        (c.numero_documento ? ` · ${c.numero_documento}` : '') +
        (c.codigo_licencia?.trim() ? ` · Lic. ${c.codigo_licencia.trim()}` : c.codigo_licencia === undefined ? ' · licencia por verificar' : ' · sin licencia'),
    }
  })
}

async function searchVehiculos(query: string): Promise<SelectOption[]> {
  const response = await vehiculosService.listar({ buscar: query || undefined, pagina: 1, limite: 30 })
  return response.data.map((v: Vehiculo) => ({
    value: v.id,
    label: v.marca ? `${v.placa} · ${v.marca}` : v.placa,
  }))
}

async function searchTransportistas(query: string): Promise<SelectOption[]> {
  const response = await clientesService.listar({ buscar: query || undefined, pagina: 1, limite: 30, soloActivos: 1 })
  return response.data.map((c) => {
    documentoPorCliente.value[c.id] = c.numero_documento ?? ''
    return { value: c.id, label: getClienteOptionLabel(c) }
  })
}

const choferSinLicencia = computed(() => {
  const id = form.idChofer
  if (!id || !(id in licenciaPorChofer.value)) return false
  return !licenciaPorChofer.value[id]
})

const transportistaSinRuc = computed(() => {
  const id = form.idTransportista
  if (!id || !(id in documentoPorCliente.value)) return false
  return !/^\d{11}$/.test(documentoPorCliente.value[id] ?? '')
})

function onChoferCreado(chofer?: Chofer) {
  if (!chofer) return
  form.idChofer = chofer.id
  choferLabel.value = `${chofer.nombres} ${chofer.apellido_paterno ?? ''}`.trim()
  licenciaPorChofer.value[chofer.id] = chofer.codigo_licencia?.trim() || null
}

function onVehiculoCreado(vehiculo?: Vehiculo) {
  if (!vehiculo) return
  form.idVehiculo = vehiculo.id
  vehiculoLabel.value = vehiculo.placa
}

function onTransportistaCreado(cliente?: Cliente) {
  if (!cliente) return
  form.idTransportista = cliente.id
  transportistaLabel.value = getClienteOptionLabel(cliente)
  documentoPorCliente.value[cliente.id] = cliente.numero_documento ?? ''
}

/** En la 31 el remitente es el cliente de la orden (mismo criterio que la API). */
const remitente = computed(() => ({
  nombre: props.documento?.nombre_cliente?.trim() || '',
  doc: props.documento?.documento_cliente?.trim() || '',
}))

// ---- Checklist: lo mismo que valida la API antes de llamar a SUNAT ----
const pendientes = computed<string[]>(() => {
  const faltan: string[] = []
  const d = props.documento
  if (!form.idTipoGuiaRemision) faltan.push('Elige el tipo de guía')
  if (!form.serie || errorSerie.value) faltan.push('Serie de la guía')
  if (!esGreTransportista.value && !codigoModalidad.value) faltan.push('Elige quién transporta la carga')
  if (!form.idMotivoTraslado) faltan.push('Motivo de traslado')
  if (!form.fechaEmisionGre) faltan.push('Fecha de emisión de la GRE')
  if (!form.fechaTraslado) faltan.push('Fecha de inicio del traslado')
  if (!(Number(form.pesoBruto) > 0)) faltan.push('Peso bruto total mayor a 0')
  if (!form.direccionOrigen.trim()) faltan.push('Dirección de partida')
  if (!form.idDistritoOrigen) faltan.push('Distrito (ubigeo) de partida')
  if (!form.direccionLlegada.trim()) faltan.push('Dirección de llegada')
  if (!form.idDistritoLlegada) faltan.push('Distrito (ubigeo) de llegada')

  if (requiereFlotaPropia.value) {
    if (!form.idChofer) faltan.push('Chofer')
    else if (choferSinLicencia.value) faltan.push('Licencia del chofer seleccionado')
    if (!form.idVehiculo) faltan.push('Vehículo (placa)')
  } else if (!form.idTransportista) {
    faltan.push('Transportista con RUC')
  } else if (transportistaSinRuc.value) {
    faltan.push('El transportista debe tener RUC de 11 dígitos')
  }

  if (esGreTransportista.value) {
    if (!remitente.value.doc) faltan.push('Cliente (remitente) con número de documento en la orden')
  }

  // Destinatario: la API elige entre destinatario, cliente y proveedor (el
  // proveedor primero en planta externa; en la 31 el cliente no cuenta).
  if (d) {
    const candidatos = esGreTransportista.value
      ? [d.documento_destinatario, d.documento_proveedor]
      : [d.documento_destinatario, d.documento_cliente, d.documento_proveedor]
    if (!candidatos.some((doc) => Boolean(doc?.trim()))) {
      faltan.push(
        esPlantaExterna.value
          ? 'RUC de la planta (proveedor) como destinatario'
          : 'Destinatario con número de documento en la orden',
      )
    }
  }
  return faltan
})

// ---- Carga inicial ----
/** Motivo SUNAT que se deduce del tipo de orden cuando la guía aún no tiene uno. */
function motivoPorDefecto(): number | '' {
  const motivos = motivosQuery.data.value
  switch (props.documento?.nombre_tipo_orden) {
    case 'ORDEN_SALIDA_VENTA':
      return idPorCodigo(motivos, '01') ?? ''
    case 'TRASLADO':
      return idPorCodigo(motivos, '04') ?? ''
    default:
      return ''
  }
}

watch(open, (isOpen) => {
  if (!isOpen || !props.documento) return
  const d = props.documento
  idEmpresaEmisora.value = d.id_empresa ?? empresaActiva.value
  const tipos = tiposGuiaQuery.data.value
  const modalidades = modalidadesQuery.data.value

  form.serie = d.serie ?? ''
  serieSeleccionada.value = ''
  // Sin tipo elegido se propone remitente + privado: es el caso habitual
  // (carga propia en flota propia) y evita que el usuario tenga que adivinar.
  form.idTipoGuiaRemision = d.id_tipo_guia_remision ?? idPorCodigo(tipos, CODIGO_GRE_REMITENTE) ?? ''
  form.idModalidadTraslado =
    d.id_modalidad_traslado ?? idPorCodigo(modalidades, CODIGO_MODALIDAD_PRIVADO) ?? ''
  sincronizarSerieSeleccionada()
  form.idMotivoTraslado = d.id_motivo_traslado ?? motivoPorDefecto()
  form.fechaEmisionGre = (d.fecha_emision_gre ?? new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Lima' }).format(new Date())).slice(0, 10)
  form.fechaTraslado = (d.fecha_traslado ?? d.fecha ?? '').slice(0, 10)
  form.direccionOrigen = d.direccion_origen ?? d.direccion_almacen ?? ''
  // En un traslado no hay dirección de entrega de cliente: la carga va a otro
  // almacén propio, así que ese es el punto de llegada por defecto.
  form.direccionLlegada =
    d.direccion_llegada ?? d.direccion_entrega ?? d.direccion_almacen_destino ?? ''
  form.pesoBruto = d.peso_bruto ?? undefined
  form.numeroBultos = d.numero_bultos ?? undefined
  form.idTransportista = d.id_transportista ?? undefined
  form.idChofer = d.id_chofer ?? undefined
  form.idVehiculo = d.id_vehiculo ?? undefined
  choferLabel.value = d.nombre_chofer?.trim() || null
  vehiculoLabel.value = d.placa_vehiculo ?? null
  transportistaLabel.value = d.nombre_transportista ?? null
  licenciaPorChofer.value = {}
  documentoPorCliente.value = {}

  origenPresetting.value = true
  if (d.id_distrito_origen) {
    origenPaisId.value = d.id_pais_origen ?? undefined
    origenDeptoId.value = d.id_departamento_origen ?? undefined
    origenProvId.value = d.id_provincia_origen ?? undefined
    form.idDistritoOrigen = d.id_distrito_origen
  } else {
    origenPaisId.value = d.id_pais_almacen ?? undefined
    origenDeptoId.value = d.id_departamento_almacen ?? undefined
    origenProvId.value = d.id_provincia_almacen ?? undefined
    form.idDistritoOrigen = d.id_distrito_almacen ?? undefined
  }

  llegadaPresetting.value = true
  if (d.id_distrito_llegada) {
    llegadaPaisId.value = d.id_pais_llegada ?? undefined
    llegadaDeptoId.value = d.id_departamento_llegada ?? undefined
    llegadaProvId.value = d.id_provincia_llegada ?? undefined
    form.idDistritoLlegada = d.id_distrito_llegada
  } else if (d.id_distrito_entrega) {
    llegadaPaisId.value = d.id_pais_entrega ?? undefined
    llegadaDeptoId.value = d.id_departamento_entrega ?? undefined
    llegadaProvId.value = d.id_provincia_entrega ?? undefined
    form.idDistritoLlegada = d.id_distrito_entrega
  } else if (d.id_distrito_almacen_destino) {
    llegadaPaisId.value = d.id_pais_almacen_destino ?? undefined
    llegadaDeptoId.value = d.id_departamento_almacen_destino ?? undefined
    llegadaProvId.value = d.id_provincia_almacen_destino ?? undefined
    form.idDistritoLlegada = d.id_distrito_almacen_destino
  } else {
    llegadaPaisId.value = undefined
    llegadaDeptoId.value = undefined
    llegadaProvId.value = undefined
    form.idDistritoLlegada = undefined
  }

  // Con la dirección del proveedor ya en caché el watch de arriba no dispara.
  if (!form.direccionLlegada.trim() && !form.idDistritoLlegada) {
    usarDireccionProveedor()
  }

  requestAnimationFrame(() => {
    origenPresetting.value = false
    llegadaPresetting.value = false
  })
})

// Los catálogos pueden llegar después de abrir: completar los valores por
// defecto que dependían de ellos sin pisar lo que el usuario ya eligió.
watch(
  tiposGuiaQuery.data,
  () => {
    if (!open.value || !tiposGuiaQuery.data.value) return
    if (!form.idTipoGuiaRemision) {
      form.idTipoGuiaRemision = idPorCodigo(tiposGuiaQuery.data.value, CODIGO_GRE_REMITENTE) ?? ''
    }
    if (!form.idModalidadTraslado) {
      form.idModalidadTraslado = idPorCodigo(modalidadesQuery.data.value, CODIGO_MODALIDAD_PRIVADO) ?? ''
    }
    if (!form.idMotivoTraslado) form.idMotivoTraslado = motivoPorDefecto()
  },
)

// ---- Guardar ----
const mutation = useConvertirAGreMutation()

async function onGuardar() {
  if (!props.documento || !form.serie || errorSerie.value) return
  if (!idEmpresaEmisora.value) { toastWarning('La guía necesita una empresa emisora'); return }
  const modalidadId = esGreTransportista.value
    ? (idPorCodigo(modalidadesQuery.data.value, CODIGO_MODALIDAD_PUBLICO) ?? undefined)
    : form.idModalidadTraslado
      ? Number(form.idModalidadTraslado)
      : undefined
  try {
    await mutation.mutateAsync({
      id: props.documento.id,
      payload: {
        // El emisor no se envía como dato editable: la API usa la empresa
        // emisora ya guardada en la orden (idEmpresa solo sirve si aún no hay).
        idEmpresa: idEmpresaEmisora.value,
        serie: form.serie.toUpperCase(),
        idTipoGuiaRemision: form.idTipoGuiaRemision ? Number(form.idTipoGuiaRemision) : undefined,
        idMotivoTraslado: form.idMotivoTraslado ? Number(form.idMotivoTraslado) : undefined,
        idModalidadTraslado: modalidadId,
        fechaEmisionGre: form.fechaEmisionGre,
        fechaTraslado: form.fechaTraslado || undefined,
        direccionOrigen: form.direccionOrigen || undefined,
        idDistritoOrigen: form.idDistritoOrigen,
        direccionLlegada: form.direccionLlegada || undefined,
        idDistritoLlegada: form.idDistritoLlegada,
        // Solo viaja el bloque que aplica al caso elegido.
        idTransportista: requiereFlotaPropia.value ? undefined : form.idTransportista,
        idChofer: requiereFlotaPropia.value ? form.idChofer : undefined,
        idVehiculo: requiereFlotaPropia.value ? form.idVehiculo : undefined,
        pesoBruto: form.pesoBruto,
        numeroBultos: form.numeroBultos,
        idUsuarioAuditoria: authStore.user?.id,
      },
    })
    open.value = false
  } catch (error) {
    toastApiError(error, 'No se pudo completar la guía')
  }
}

function handleClose() {
  open.value = false
}
</script>
