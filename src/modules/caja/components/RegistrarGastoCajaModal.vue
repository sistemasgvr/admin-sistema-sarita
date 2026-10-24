<template>
  <AppModal v-model="open" :title="isEdit ? 'Editar gasto de caja' : 'Registrar gasto de caja'" size="md">
    <!-- data-tutorial: anclas de la ruta guiada de Soporte (Gastos de caja). -->
    <!-- Jerarquía: de qué caja sale → qué se pagó y cuánto → cómo se pagó → nota. -->
    <div class="space-y-4">
      <p class="text-theme-sm text-gray-500 dark:text-gray-400">
        Salida de la caja sin comprobante. Si el proveedor te dio factura, boleta o recibo, regístralo en
        Compras como compra al contado: también sale de la caja y no debe registrarse dos veces.
      </p>

      <section
        v-if="requiereSeleccionCaja"
        class="rounded-xl border border-gray-100 p-4 dark:border-gray-800"
      >
        <h4 class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <AppIcon :name="ICONS.wallet" :size="14" />
          Caja
        </h4>
        <AppFormField label="Caja / sucursal" required>
          <AppSelect v-model="sesionGasto.idSesion.value" :options="sesionGasto.options.value"
            :disabled="guardando || sesionGasto.query.isFetching.value" placeholder="Seleccionar caja abierta" />
          <p v-if="sesionGasto.query.isError.value" class="mt-1 text-sm text-error-500">
            No se pudieron consultar las cajas abiertas. Cierra y vuelve a abrir el formulario.
          </p>
          <p v-else-if="!sesionGasto.query.isFetching.value && !sesionGasto.options.value.length" class="mt-1 text-sm text-gray-500">
            No hay caja abierta para esta fecha. Solicita su apertura en Ventas → Caja.
          </p>
        </AppFormField>
      </section>

      <section class="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
        <h4 class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <AppIcon :name="ICONS.receipt" :size="14" />
          Gasto
        </h4>
        <div class="space-y-4">
          <AppFormField data-tutorial="gasto-concepto" label="Concepto" required :error="errores.concepto">
            <AppInput v-model="form.concepto" placeholder="Combustible, flete, vigilancia..." />
          </AppFormField>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AppFormField data-tutorial="gasto-monto" label="Monto" required :error="errorMonto">
              <MoneyInput
                v-model="form.monto"
                placeholder="0.00"
                :state="errorMonto ? 'error' : 'default'"
                @blur="onBlurMonto"
              />
            </AppFormField>
            <AppFormField data-tutorial="gasto-categoria" label="Categoría de gasto" optional>
              <AppSelectWithCreate
                :can-create="canCrearCategoriaGasto"
                :has-label="false"
                create-title="Nueva categoría de gasto"
                :disabled="guardando"
                @create="categoriaGastoModalOpen = true"
              >
                <AppSelect
                  v-model="form.idCategoriaGasto"
                  :options="categoriaGastoOptions"
                  placeholder="Seleccionar"
                />
              </AppSelectWithCreate>
            </AppFormField>
          </div>
        </div>
      </section>

      <section class="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
        <h4 class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <AppIcon :name="ICONS.wallet" :size="14" />
          Pago
        </h4>
        <MedioPagoCuentaField
          data-tutorial="gasto-medio-pago"
          v-model:id-medio-pago="form.idMedioPago"
          v-model:id-cuenta-bancaria="form.idCuentaBancaria"
          v-model:numero-operacion="form.numeroOperacion"
          v-model:valido="pagoValido"
          :disabled="guardando"
          :mostrar-errores="intentoEnvio"
          mostrar-siempre-numero-operacion
          excluir-credito
        />
      </section>

      <AppFormField label="Observación" optional>
        <AppTextarea v-model="form.observacion" :rows="2" />
      </AppFormField>
    </div>
    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        :disabled="guardando"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        data-tutorial="gasto-guardar"
        :disabled="guardando || !formularioValido"
        @click="submit"
      >
        {{ guardando ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar gasto' }}
      </button>
    </template>
  </AppModal>

  <ListaOpcionFormModal
    v-model="categoriaGastoModalOpen"
    :id-lista="ListaIds.CATEGORIA_GASTO"
    title="Nueva categoría de gasto"
    subtitle="Quedará disponible para clasificar gastos de caja y compras."
    nombre-placeholder="Ej. ALQUILER_LOCAL"
    @saved="onCategoriaGastoCreada"
  />
</template>

<script setup lang="ts">
import { computed, reactive, ref, toRef, watch } from 'vue'
import { AppInput, AppModal, AppSelect, AppSelectWithCreate, AppTextarea, MoneyInput } from '@/shared/components'
import MedioPagoCuentaField from '@/modules/finanzas/components/MedioPagoCuentaField.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import { useActualizarCajaGastoMutation, useCrearCajaGastoMutation } from '@/modules/caja/composables/useCajaQuery'
import type { CajaMovimientoGasto } from '@/modules/caja/interfaces/caja.interface'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import ListaOpcionFormModal from '@/modules/catalogos/components/ListaOpcionFormModal.vue'
import type { ListaOpcion } from '@/modules/catalogos/interfaces/lista-opcion.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { useMoneyField } from '@/shared/composables/useMoneyField'
import { mensajeErrorMontoMoneda, parseMoneyInput, roundMoney } from '@/shared/utils/currency'
import { useSesionGasto } from '@/modules/caja/composables/useSesionGasto'

const open = defineModel<boolean>({ default: false })
const props = defineProps<{
  /** Requerida solo al crear (backend resuelve la sesión abierta de esa fecha/sucursal). */
  fecha?: string
  idSesion?: number | null
  idSucursal?: number | null
  /** Presente => modo edición del gasto indicado. */
  gasto?: CajaMovimientoGasto | null
}>()
const emit = defineEmits<{ saved: [] }>()

const isEdit = computed(() => Boolean(props.gasto))
const requiereSeleccionCaja = computed(() => !isEdit.value && props.idSesion == null && props.idSucursal == null)
const sesionGasto = useSesionGasto(toRef(props, 'fecha'), requiereSeleccionCaja, open)
const authStore = useAuthStore()
const form = reactive({
  concepto: '',
  monto: '',
  idMedioPago: null as number | null,
  idCuentaBancaria: null as number | null,
  idCategoriaGasto: null as number | null,
  numeroOperacion: '',
  observacion: '',
})
const errores = reactive({ concepto: '' })
const pagoValido = ref(true)
const intentoEnvio = ref(false)
const crearMutation = useCrearCajaGastoMutation()
const actualizarMutation = useActualizarCajaGastoMutation()
const guardando = computed(() => crearMutation.isPending.value || actualizarMutation.isPending.value)

const categoriaGastoQuery = useListaOpcionesQuery(computed(() => ListaIds.CATEGORIA_GASTO))
const categoriaGastoOptions = computed(() => toSelectOptions(categoriaGastoQuery.data.value))
const canCrearCategoriaGasto = computed(() =>
  authStore.hasPermission(PermisoBanderas.CATALOGOS_EDITAR),
)
const categoriaGastoModalOpen = ref(false)
function onCategoriaGastoCreada(opcion: ListaOpcion) {
  form.idCategoriaGasto = opcion.id
}

const { error: errorMonto, valido: montoValido, onBlur: onBlurMonto } = useMoneyField(
  toRef(form, 'monto'),
  { min: 0.01 },
)

const formularioValido = computed(
  () => form.concepto.trim().length > 0 && montoValido.value && pagoValido.value && sesionGasto.valida.value,
)

watch(open, (v) => {
  if (!v) return

  const g = props.gasto
  form.concepto = g?.concepto ?? ''
  form.monto = g?.monto != null ? String(g.monto) : ''
  form.idMedioPago = g?.idMedioPago ?? null
  form.idCuentaBancaria = g?.idCuentaBancaria ?? null
  form.idCategoriaGasto = g?.idCategoriaGasto ?? null
  form.numeroOperacion = g?.numeroOperacion ?? ''
  form.observacion = g?.observacion ?? ''
  errores.concepto = ''
  intentoEnvio.value = false
})

async function submit() {
  intentoEnvio.value = true
  errores.concepto = form.concepto.trim() ? '' : 'Obligatorio'
  if (mensajeErrorMontoMoneda(form.monto, { min: 0.01 })) return
  if (errores.concepto || !pagoValido.value || !sesionGasto.valida.value) return

  const monto = roundMoney(parseMoneyInput(form.monto))

  if (isEdit.value && props.gasto) {
    await actualizarMutation.mutateAsync({
      id: props.gasto.id,
      payload: {
        concepto: form.concepto.trim(),
        monto,
        idMedioPago: form.idMedioPago,
        idCuentaBancaria: form.idCuentaBancaria,
        idCategoriaGasto: form.idCategoriaGasto,
        numeroOperacion: form.numeroOperacion || undefined,
        observacion: form.observacion || undefined,
      },
    })
  } else {
    if (!props.fecha) return
    await crearMutation.mutateAsync({
      fecha: props.fecha,
      concepto: form.concepto.trim(),
      monto,
      idMedioPago: form.idMedioPago,
      idCuentaBancaria: form.idCuentaBancaria,
      idCategoriaGasto: form.idCategoriaGasto,
      numeroOperacion: form.numeroOperacion || undefined,
      observacion: form.observacion || undefined,
      idSesion: props.idSesion ?? sesionGasto.seleccion.value?.id ?? undefined,
      idSucursal: props.idSucursal ?? sesionGasto.seleccion.value?.idSucursal ?? undefined,
    })
  }
  open.value = false
  emit('saved')
}
</script>
