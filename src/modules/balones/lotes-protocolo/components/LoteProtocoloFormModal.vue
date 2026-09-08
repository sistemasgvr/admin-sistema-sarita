<template>
  <AppModal
    v-model="open"
    :title="mode === 'create' ? 'Nueva ficha de lote y protocolo' : 'Editar ficha'"
    subtitle="Los campos se transcriben del PDF que emite la planta; el PDF se adjunta como respaldo."
    size="xl"
  >
    <FormCardsLayout :loading="isLoadingLote" loading-text="Cargando ficha...">
      <DetailSectionCard title="Cabecera" :icon="ICONS.fileText">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AppInput
            v-model="numeroLote"
            label="N° de lote"
            placeholder="GOXM1260827-01"
            required
            v-bind="numeroLoteAttrs"
            :error="errors.numeroLote"
            :disabled="isSubmitting"
          />

          <AppInput
            v-model="numeroProtocolo"
            label="N° protocolo"
            placeholder="060"
            v-bind="numeroProtocoloAttrs"
            :error="errors.numeroProtocolo"
            :disabled="isSubmitting"
          />

          <ClienteSelectField
            v-model="idProveedor"
            label="Proveedor / planta"
            placeholder="Selecciona proveedor..."
            search-placeholder="Razón social, documento o código..."
            solo-proveedores
            :disabled="isSubmitting"
            :error="errors.idProveedor"
          />

          <ProductoSelectField
            v-model="idProductoGas"
            label="Gas"
            placeholder="Selecciona el gas..."
            es-gas
            :disabled="isSubmitting"
            :error="errors.idProductoGas"
          />

          <AppInput
            v-model="presentacion"
            label="Presentación"
            placeholder="Cilindro de Acero al Carbono x 10 m³"
            v-bind="presentacionAttrs"
            :error="errors.presentacion"
            :disabled="isSubmitting"
          />

          <AppInput
            v-model="normaTecnica"
            label="Norma técnica"
            v-bind="normaTecnicaAttrs"
            :error="errors.normaTecnica"
            :disabled="isSubmitting"
          />

          <AppInput
            v-model="descripcionProducto"
            label="Producto"
            class="sm:col-span-2 lg:col-span-3"
            v-bind="descripcionProductoAttrs"
            :error="errors.descripcionProducto"
            :disabled="isSubmitting"
          />

          <AppInput
            v-model="formaFarmaceutica"
            label="Forma farmacéutica"
            v-bind="formaFarmaceuticaAttrs"
            :error="errors.formaFarmaceutica"
            :disabled="isSubmitting"
          />

          <AppInput
            v-model="metodoFabricacion"
            label="Método de fabricación"
            v-bind="metodoFabricacionAttrs"
            :error="errors.metodoFabricacion"
            :disabled="isSubmitting"
          />

          <AppInput
            v-model="tamanoLoteM3"
            label="Tamaño del lote (m³)"
            type="number"
            :min="NUMBER_MIN.measure"
            :step="NUMBER_STEP.measure"
            v-bind="tamanoLoteM3Attrs"
            :error="errors.tamanoLoteM3"
            :disabled="isSubmitting"
          />

          <AppInput
            v-model="cantidadEnvases"
            label="Cantidad de envases"
            type="number"
            :min="0"
            v-bind="cantidadEnvasesAttrs"
            :error="errors.cantidadEnvases"
            :disabled="isSubmitting"
          />

          <AppInput
            v-model="fechaAnalisis"
            label="Fecha de análisis"
            type="date"
            v-bind="fechaAnalisisAttrs"
            :error="errors.fechaAnalisis"
            :disabled="isSubmitting"
          />

          <AppInput
            v-model="fechaEmision"
            label="Fecha de emisión"
            type="date"
            v-bind="fechaEmisionAttrs"
            :error="errors.fechaEmision"
            :disabled="isSubmitting"
          />

          <AppInput
            v-model="fechaFabricacion"
            label="Fecha de fabricación"
            type="date"
            v-bind="fechaFabricacionAttrs"
            :error="errors.fechaFabricacion"
            :disabled="isSubmitting"
          />

          <AppInput
            v-model="vencimientoMesAnio"
            label="Vencimiento (MM/AAAA)"
            placeholder="08/2027"
            v-bind="vencimientoMesAnioAttrs"
            :error="errors.vencimientoMesAnio"
            :disabled="isSubmitting"
            help="La ficha da mes y año; se guarda como el día 1 de ese mes."
          />
        </div>
      </DetailSectionCard>

      <DetailSectionCard
        title="Envases aprobados"
        :icon="ICONS.boxes"
        :help="
          balonesPreset.length
            ? 'Son los cilindros de la orden de salida. Marca cuál se muestreó para el análisis.'
            : 'Pega la lista de series del PDF. Cada serie se empareja sola con el cilindro que la tenga registrada.'
        "
      >
        <div v-if="balonesPreset.length" class="space-y-3">
          <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table class="min-w-full text-sm">
              <thead
                class="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-white/[0.03] dark:text-gray-400"
              >
                <tr>
                  <th class="px-3 py-2 font-medium">Código</th>
                  <th class="px-3 py-2 font-medium">Tipo</th>
                  <th class="px-3 py-2 font-medium">N° de serie</th>
                  <th class="w-24 px-3 py-2 text-center font-medium">Muestra</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="balon in balonesPreset" :key="balon.idBalon">
                  <td class="px-3 py-2 font-medium text-gray-800 dark:text-white/90">
                    {{ balon.codigoBalon }}
                  </td>
                  <td class="px-3 py-2">
                    <AppBadge
                      v-if="balon.nombreTipoBalon"
                      size="sm"
                      variant="light"
                      :color="tipoBalonBadgeColor(balon.nombreTipoBalon)"
                    >
                      {{ balon.nombreTipoBalon }}
                    </AppBadge>
                    <span v-else class="text-gray-400">—</span>
                  </td>
                  <td class="px-3 py-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                    {{ balon.numeroSerie || '—' }}
                  </td>
                  <td class="px-3 py-2 text-center">
                    <input
                      type="radio"
                      name="lote-balon-muestra"
                      class="h-4 w-4 cursor-pointer accent-brand-500 disabled:cursor-not-allowed"
                      :checked="idBalonMuestra === balon.idBalon"
                      :disabled="isSubmitting || !balon.numeroSerie"
                      :title="
                        balon.numeroSerie
                          ? 'Marcar como cilindro muestreado'
                          : 'Este cilindro no tiene número de serie registrado'
                      "
                      @change="idBalonMuestra = balon.idBalon"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ balonesPreset.length }} cilindro(s) de la orden. Al guardar, la ficha queda
            como vigente en todos ellos.
          </p>
        </div>

        <div v-else class="space-y-3">
          <AppTextarea
            v-model="envasesTexto"
            label="Series de envases"
            :rows="5"
            placeholder="J25642171 J25642043 21X635193 ..."
            :disabled="isSubmitting"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ seriesEnvases.length }} serie(s) detectada(s). Se aceptan separadas por
            espacios, comas, punto y coma o saltos de línea; los duplicados se descartan.
          </p>
        </div>
      </DetailSectionCard>

      <DetailSectionCard title="Cilindro muestreado" :icon="ICONS.cylinder">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AppInput
            v-model="cilindroMuestreadoSerie"
            label="Serie"
            :placeholder="
              balonesPreset.length ? 'Marca el cilindro en la tabla de abajo' : 'J25642171'
            "
            v-bind="cilindroMuestreadoSerieAttrs"
            :error="errors.cilindroMuestreadoSerie"
            :disabled="isSubmitting || balonesPreset.length > 0"
            :help="
              balonesPreset.length
                ? 'Se llena solo con el cilindro que marques como muestra.'
                : undefined
            "
          />

          <AppInput
            v-model="temperaturaMuestreoC"
            label="Temperatura (°C)"
            type="number"
            :step="NUMBER_STEP.measure"
            v-bind="temperaturaMuestreoCAttrs"
            :error="errors.temperaturaMuestreoC"
            :disabled="isSubmitting"
          />

          <AppInput
            v-model="presionMuestreoPsi"
            label="Presión (PSI)"
            type="number"
            :step="NUMBER_STEP.measure"
            v-bind="presionMuestreoPsiAttrs"
            :error="errors.presionMuestreoPsi"
            :disabled="isSubmitting"
          />

          <AppInput
            v-model="valoracionO2Pct"
            label="Valoración O₂ (%)"
            type="number"
            :step="NUMBER_STEP.measure"
            v-bind="valoracionO2PctAttrs"
            :error="errors.valoracionO2Pct"
            :disabled="isSubmitting"
          />
        </div>
      </DetailSectionCard>

      <DetailSectionCard
        title="Datos de análisis"
        :icon="ICONS.clipboardCheck"
        help="Vienen precargados con el formato ICP-INS-011; ajusta el resultado de cada prueba."
      >
        <div class="space-y-3">
          <div
            v-for="(prueba, index) in pruebas"
            :key="index"
            class="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-3 sm:grid-cols-12 dark:border-gray-700"
          >
            <AppInput
              v-model="prueba.prueba"
              label="Prueba"
              class="sm:col-span-3"
              :disabled="isSubmitting"
            />
            <AppInput
              v-model="prueba.especificacion"
              label="Especificación"
              class="sm:col-span-6"
              :disabled="isSubmitting"
            />
            <AppInput
              v-model="prueba.resultado"
              label="Resultado"
              class="sm:col-span-2"
              :disabled="isSubmitting"
            />
            <div class="flex items-end sm:col-span-1">
              <button
                type="button"
                title="Quitar fila"
                class="inline-flex h-10 w-full items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
                :disabled="isSubmitting"
                @click="quitarPrueba(index)"
              >
                <AppIcon :name="ICONS.trash" :size="15" />
              </button>
            </div>
          </div>

          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            :disabled="isSubmitting"
            @click="agregarPrueba"
          >
            <AppIcon :name="ICONS.plus" :size="15" />
            Agregar prueba
          </button>
        </div>
      </DetailSectionCard>

      <DetailSectionCard title="Firmas y respaldo" :icon="ICONS.fileKey">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppInput
            v-model="analista"
            label="Analista"
            v-bind="analistaAttrs"
            :error="errors.analista"
            :disabled="isSubmitting"
          />

          <div class="grid grid-cols-2 gap-4">
            <AppInput
              v-model="codigoDocumento"
              label="Código documento"
              v-bind="codigoDocumentoAttrs"
              :error="errors.codigoDocumento"
              :disabled="isSubmitting"
            />
            <AppInput
              v-model="versionDocumento"
              label="Versión"
              v-bind="versionDocumentoAttrs"
              :error="errors.versionDocumento"
              :disabled="isSubmitting"
            />
          </div>

          <AppTextarea
            v-model="conclusion"
            label="Conclusión"
            :rows="2"
            class="sm:col-span-2"
            v-bind="conclusionAttrs"
            :error="errors.conclusion"
            :disabled="isSubmitting"
          />

          <div class="sm:col-span-2">
            <AppFileInput
              v-model="archivoPdf"
              label="PDF de la ficha"
              accept="application/pdf"
              :disabled="isSubmitting || subiendoPdf"
            />
            <p v-if="nombrePdf" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ subiendoPdf ? 'Subiendo...' : `Adjunto: ${nombrePdf}` }}
            </p>
          </div>

          <AppTextarea
            v-model="observacion"
            label="Observación"
            :rows="2"
            class="sm:col-span-2"
            v-bind="observacionAttrs"
            :error="errors.observacion"
            :disabled="isSubmitting"
          />
        </div>
      </DetailSectionCard>
    </FormCardsLayout>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="isSubmitting"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isSubmitting || subiendoPdf"
        @click="onSubmit"
      >
        {{ isSubmitting ? 'Guardando...' : 'Guardar ficha' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import ClienteSelectField from '@/modules/clientes/components/ClienteSelectField.vue'
import ProductoSelectField from '@/modules/productos/articulos/components/ProductoSelectField.vue'
import {
  fechaAMesAnio,
  ICP_CABECERA_DEFECTO,
  ICP_CODIGO_DOCUMENTO,
  ICP_PRUEBAS_DEFECTO,
  ICP_VERSION_DOCUMENTO,
  mesAnioAFecha,
  parsearSeriesEnvases,
} from '@/modules/balones/lotes-protocolo/constants/icpFicha'
import {
  useAplicarLoteProtocoloMutation,
  useCreateLoteProtocoloMutation,
  useUpdateLoteProtocoloMutation,
} from '@/modules/balones/lotes-protocolo/composables/useLoteProtocoloMutations'
import { tipoBalonBadgeColor } from '@/modules/balones/utils/tipoBalonBadge'
import { useLoteProtocoloQuery } from '@/modules/balones/lotes-protocolo/composables/useLotesProtocoloQuery'
import type {
  LoteProtocoloFormMode,
  LoteProtocoloPayload,
  LoteProtocoloPrueba,
} from '@/modules/balones/lotes-protocolo/interfaces/lote-protocolo.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppBadge, AppFileInput, AppInput, AppModal, AppTextarea } from '@/shared/components'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { NUMBER_MIN, NUMBER_STEP } from '@/shared/constants/number-input'
import { toastApiError, toastError } from '@/shared/composables/useToast'
import { storageService } from '@/shared/services/storage.service'
import { optionalNumber, optionalString, requiredString } from '@/shared/validation'

/** Cilindro de la orden de salida que origina la ficha. */
export interface LoteProtocoloBalonPreset {
  idBalon: number
  codigoBalon: string
  nombreTipoBalon?: string | null
  numeroSerie?: string | null
}

const props = withDefaults(
  defineProps<{
    mode: LoteProtocoloFormMode
    loteId?: number | null
    /**
     * Cilindros que originan la ficha (vienen de una orden de salida). Cuando
     * llegan, los envases no se transcriben: son estos, y al guardar la ficha
     * queda aplicada a todos ellos.
     */
    balonesPreset?: LoteProtocoloBalonPreset[]
    idProductoGasPreset?: number | null
  }>(),
  { loteId: null, balonesPreset: () => [], idProductoGasPreset: null },
)

const open = defineModel<boolean>({ default: false })

const authStore = useAuthStore()
const createMutation = useCreateLoteProtocoloMutation()
const updateMutation = useUpdateLoteProtocoloMutation()
const aplicarMutation = useAplicarLoteProtocoloMutation()

const loteIdRef = computed(() => (props.mode === 'edit' ? props.loteId : null))
const loteQuery = useLoteProtocoloQuery(loteIdRef)
const isLoadingLote = computed(
  () => props.mode === 'edit' && open.value && loteQuery.isFetching.value,
)

const pruebas = ref<LoteProtocoloPrueba[]>([])
const envasesTexto = ref('')
const idArchivoPdf = ref<number | undefined>(undefined)
const archivoPdf = ref<File | File[] | null>(null)
const idBalonMuestra = ref<number | null>(null)
const nombrePdf = ref('')
const subiendoPdf = ref(false)

const seriesEnvases = computed(() => parsearSeriesEnvases(envasesTexto.value))

// Solo aplica en alta: editar una ficha existente no re-aplica cilindros.
const balonesDeLaOrden = computed(() =>
  props.mode === 'create' ? props.balonesPreset : [],
)

const emit = defineEmits<{ guardada: [] }>()

const optionalSelectNumber = () =>
  yup
    .mixed<string | number>()
    .transform((value) => (value === '' ? undefined : value))
    .optional()

const { defineField, handleSubmit, resetForm, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      numeroLote: requiredString('El número de lote'),
      numeroProtocolo: optionalString().max(30, 'Máximo 30 caracteres'),
      idProveedor: optionalSelectNumber(),
      idProductoGas: optionalSelectNumber(),
      descripcionProducto: optionalString().max(250, 'Máximo 250 caracteres'),
      formaFarmaceutica: optionalString().max(80, 'Máximo 80 caracteres'),
      presentacion: optionalString().max(150, 'Máximo 150 caracteres'),
      normaTecnica: optionalString().max(80, 'Máximo 80 caracteres'),
      metodoFabricacion: optionalString().max(150, 'Máximo 150 caracteres'),
      fechaAnalisis: optionalString(),
      fechaEmision: optionalString(),
      fechaFabricacion: optionalString(),
      vencimientoMesAnio: optionalString().matches(/^$|^\d{1,2}[/-]\d{4}$/, {
        message: 'Usa el formato MM/AAAA',
      }),
      tamanoLoteM3: optionalNumber().min(0, 'Debe ser mayor o igual a cero'),
      cantidadEnvases: optionalNumber().min(0, 'Debe ser mayor o igual a cero'),
      valoracionO2Pct: optionalNumber()
        .min(0, 'Debe estar entre 0 y 100')
        .max(100, 'Debe estar entre 0 y 100'),
      cilindroMuestreadoSerie: optionalString().max(60, 'Máximo 60 caracteres'),
      temperaturaMuestreoC: optionalNumber(),
      presionMuestreoPsi: optionalNumber().min(0, 'Debe ser mayor o igual a cero'),
      analista: optionalString().max(150, 'Máximo 150 caracteres'),
      conclusion: optionalString().max(500, 'Máximo 500 caracteres'),
      codigoDocumento: optionalString().max(40, 'Máximo 40 caracteres'),
      versionDocumento: optionalString().max(10, 'Máximo 10 caracteres'),
      observacion: optionalString().max(500, 'Máximo 500 caracteres'),
    }),
  ),
  initialValues: valoresIniciales(),
})

function valoresIniciales() {
  return {
    numeroLote: '',
    numeroProtocolo: '',
    idProveedor: '' as string | number,
    idProductoGas: '' as string | number,
    descripcionProducto: ICP_CABECERA_DEFECTO.descripcionProducto,
    formaFarmaceutica: ICP_CABECERA_DEFECTO.formaFarmaceutica,
    presentacion: '',
    normaTecnica: ICP_CABECERA_DEFECTO.normaTecnica,
    metodoFabricacion: ICP_CABECERA_DEFECTO.metodoFabricacion,
    fechaAnalisis: '',
    fechaEmision: '',
    fechaFabricacion: '',
    vencimientoMesAnio: '',
    tamanoLoteM3: undefined as number | undefined,
    cantidadEnvases: undefined as number | undefined,
    valoracionO2Pct: undefined as number | undefined,
    cilindroMuestreadoSerie: '',
    temperaturaMuestreoC: undefined as number | undefined,
    presionMuestreoPsi: undefined as number | undefined,
    analista: '',
    conclusion: ICP_CABECERA_DEFECTO.conclusion,
    codigoDocumento: ICP_CODIGO_DOCUMENTO,
    versionDocumento: ICP_VERSION_DOCUMENTO,
    observacion: '',
  }
}

const [numeroLote, numeroLoteAttrs] = defineField('numeroLote')
const [numeroProtocolo, numeroProtocoloAttrs] = defineField('numeroProtocolo')
const [idProveedor] = defineField('idProveedor')
const [idProductoGas] = defineField('idProductoGas')
const [descripcionProducto, descripcionProductoAttrs] = defineField('descripcionProducto')
const [formaFarmaceutica, formaFarmaceuticaAttrs] = defineField('formaFarmaceutica')
const [presentacion, presentacionAttrs] = defineField('presentacion')
const [normaTecnica, normaTecnicaAttrs] = defineField('normaTecnica')
const [metodoFabricacion, metodoFabricacionAttrs] = defineField('metodoFabricacion')
const [fechaAnalisis, fechaAnalisisAttrs] = defineField('fechaAnalisis')
const [fechaEmision, fechaEmisionAttrs] = defineField('fechaEmision')
const [fechaFabricacion, fechaFabricacionAttrs] = defineField('fechaFabricacion')
const [vencimientoMesAnio, vencimientoMesAnioAttrs] = defineField('vencimientoMesAnio')
const [tamanoLoteM3, tamanoLoteM3Attrs] = defineField('tamanoLoteM3')
const [cantidadEnvases, cantidadEnvasesAttrs] = defineField('cantidadEnvases')
const [valoracionO2Pct, valoracionO2PctAttrs] = defineField('valoracionO2Pct')
const [cilindroMuestreadoSerie, cilindroMuestreadoSerieAttrs] =
  defineField('cilindroMuestreadoSerie')
const [temperaturaMuestreoC, temperaturaMuestreoCAttrs] = defineField('temperaturaMuestreoC')
const [presionMuestreoPsi, presionMuestreoPsiAttrs] = defineField('presionMuestreoPsi')
const [analista, analistaAttrs] = defineField('analista')
const [conclusion, conclusionAttrs] = defineField('conclusion')
const [codigoDocumento, codigoDocumentoAttrs] = defineField('codigoDocumento')
const [versionDocumento, versionDocumentoAttrs] = defineField('versionDocumento')
const [observacion, observacionAttrs] = defineField('observacion')

const clonarPruebasDefecto = () =>
  ICP_PRUEBAS_DEFECTO.map((prueba) => ({ ...prueba }))

function agregarPrueba() {
  pruebas.value.push({
    orden: pruebas.value.length + 1,
    prueba: '',
    especificacion: '',
    resultado: '',
  })
}

function quitarPrueba(index: number) {
  pruebas.value.splice(index, 1)
}

const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '')
const toNumber = (value: unknown) => (value == null || value === '' ? undefined : Number(value))

// Al abrir: crear parte del formato en blanco; editar carga la ficha guardada.
watch(
  [open, () => loteQuery.data.value, () => props.mode],
  ([abierto]) => {
    if (!abierto) return

    if (props.mode === 'create') {
      resetForm({
        values: {
          ...valoresIniciales(),
          idProductoGas: props.idProductoGasPreset ?? '',
        },
      })
      pruebas.value = clonarPruebasDefecto()
      envasesTexto.value = ''
      idArchivoPdf.value = undefined
      nombrePdf.value = ''
      archivoPdf.value = null
      idBalonMuestra.value = null
      cilindroMuestreadoSerie.value = ''
      return
    }

    const lote = loteQuery.data.value
    if (!lote) return

    resetForm({
      values: {
        numeroLote: lote.numero_lote ?? '',
        numeroProtocolo: lote.numero_protocolo ?? '',
        idProveedor: lote.id_proveedor ?? '',
        idProductoGas: lote.id_producto_gas ?? '',
        descripcionProducto: lote.descripcion_producto ?? '',
        formaFarmaceutica: lote.forma_farmaceutica ?? '',
        presentacion: lote.presentacion ?? '',
        normaTecnica: lote.norma_tecnica ?? '',
        metodoFabricacion: lote.metodo_fabricacion ?? '',
        fechaAnalisis: toDateInput(lote.fecha_analisis),
        fechaEmision: toDateInput(lote.fecha_emision),
        fechaFabricacion: toDateInput(lote.fecha_fabricacion),
        vencimientoMesAnio: fechaAMesAnio(lote.fecha_vencimiento),
        tamanoLoteM3: toNumber(lote.tamano_lote_m3),
        cantidadEnvases: toNumber(lote.cantidad_envases),
        valoracionO2Pct: toNumber(lote.valoracion_o2_pct),
        cilindroMuestreadoSerie: lote.cilindro_muestreado_serie ?? '',
        temperaturaMuestreoC: toNumber(lote.temperatura_muestreo_c),
        presionMuestreoPsi: toNumber(lote.presion_muestreo_psi),
        analista: lote.analista ?? '',
        conclusion: lote.conclusion ?? '',
        codigoDocumento: lote.codigo_documento ?? '',
        versionDocumento: lote.version_documento ?? '',
        observacion: lote.observacion ?? '',
      },
    })

    pruebas.value = (lote.pruebas ?? []).map((prueba) => ({ ...prueba }))
    envasesTexto.value = (lote.envases ?? []).map((envase) => envase.serie_envase).join('\n')
    idArchivoPdf.value = lote.id_archivo_pdf ?? undefined
    nombrePdf.value = lote.nombre_archivo_pdf ?? ''
  },
  { immediate: true },
)

// El PDF se sube en cuanto se elige: así el formulario solo guarda el id del
// archivo y no hay que reintentar la subida si falla la validación del resto.
watch(archivoPdf, async (file) => {
  if (!file || Array.isArray(file)) return

  if (file.type !== 'application/pdf') {
    toastError('El respaldo de la ficha debe ser un PDF')
    archivoPdf.value = null
    return
  }

  subiendoPdf.value = true
  nombrePdf.value = file.name
  try {
    const ruta = `lotes-protocolo/${Date.now()}-${file.name}`
    const respuesta = await storageService.subirArchivo(file, ruta)
    idArchivoPdf.value = respuesta.archivo?.id ?? respuesta.id
  } catch (error) {
    nombrePdf.value = ''
    archivoPdf.value = null
    toastApiError(error, 'No se pudo subir el PDF de la ficha')
  } finally {
    subiendoPdf.value = false
  }
})

/**
 * El campo "Serie" del cilindro muestreado se llena desde la tabla: marcar el
 * radio y no ver el código reflejado hacía dudar de si había quedado guardado.
 */
watch(idBalonMuestra, (idBalon) => {
  const balon = balonesDeLaOrden.value.find((b) => b.idBalon === idBalon)
  cilindroMuestreadoSerie.value = balon?.numeroSerie?.trim() || ''
})

const onSubmit = handleSubmit(async (values) => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return

  const payload: LoteProtocoloPayload = {
    idUsuarioAuditoria: currentUserId,
    numeroLote: values.numeroLote,
    numeroProtocolo: values.numeroProtocolo || undefined,
    idProveedor: toNumber(values.idProveedor),
    idProductoGas: toNumber(values.idProductoGas),
    descripcionProducto: values.descripcionProducto || undefined,
    formaFarmaceutica: values.formaFarmaceutica || undefined,
    presentacion: values.presentacion || undefined,
    normaTecnica: values.normaTecnica || undefined,
    metodoFabricacion: values.metodoFabricacion || undefined,
    fechaAnalisis: values.fechaAnalisis || undefined,
    fechaEmision: values.fechaEmision || undefined,
    fechaFabricacion: values.fechaFabricacion || undefined,
    fechaVencimiento: values.vencimientoMesAnio
      ? mesAnioAFecha(values.vencimientoMesAnio)
      : undefined,
    tamanoLoteM3: values.tamanoLoteM3,
    cantidadEnvases: values.cantidadEnvases,
    valoracionO2Pct: values.valoracionO2Pct,
    cilindroMuestreadoSerie: values.cilindroMuestreadoSerie || undefined,
    temperaturaMuestreoC: values.temperaturaMuestreoC,
    presionMuestreoPsi: values.presionMuestreoPsi,
    analista: values.analista || undefined,
    conclusion: values.conclusion || undefined,
    codigoDocumento: values.codigoDocumento || undefined,
    versionDocumento: values.versionDocumento || undefined,
    idArchivoPdf: idArchivoPdf.value,
    observacion: values.observacion || undefined,
    pruebas: pruebas.value
      .filter((prueba) => prueba.prueba.trim() !== '')
      .map((prueba, index) => ({
        orden: prueba.orden ?? index + 1,
        prueba: prueba.prueba.trim(),
        especificacion: prueba.especificacion?.trim() || undefined,
        resultado: prueba.resultado?.trim() || undefined,
      })),
    envases: balonesDeLaOrden.value.length
      ? balonesDeLaOrden.value
          .map((balon) => balon.numeroSerie?.trim() || balon.codigoBalon)
          .map((serieEnvase) => ({ serieEnvase }))
      : seriesEnvases.value.map((serieEnvase) => ({ serieEnvase })),
  }

  // El cilindro marcado en la tabla manda sobre lo escrito a mano.
  const muestra = balonesDeLaOrden.value.find((balon) => balon.idBalon === idBalonMuestra.value)
  if (muestra?.numeroSerie) {
    payload.cilindroMuestreadoSerie = muestra.numeroSerie
  }

  try {
    if (props.mode === 'create') {
      const creada = await createMutation.mutateAsync({
        ...payload,
        numeroLote: values.numeroLote,
      })

      // Nace desde una orden de salida: la ficha no sirve de nada si no queda
      // aplicada a los cilindros que la originaron.
      if (creada?.id && balonesDeLaOrden.value.length) {
        await aplicarMutation.mutateAsync({
          id: creada.id,
          payload: {
            idUsuarioAuditoria: currentUserId,
            idBalones: balonesDeLaOrden.value.map((balon) => balon.idBalon),
          },
        })
      }
    } else if (props.loteId) {
      await updateMutation.mutateAsync({ id: props.loteId, payload })
    }
    open.value = false
    emit('guardada')
  } catch {
    // toast en mutation
  }
})
</script>
