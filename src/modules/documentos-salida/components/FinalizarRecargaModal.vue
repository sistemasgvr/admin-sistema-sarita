<template>
  <AppModal v-model="open" title="Registrar retorno de recarga" size="md">
    <div class="grid grid-cols-1 gap-4">
      <AppDatePicker
        v-model="form.fechaLlegadaAlmacen"
        label="Fecha de llegada al almacén"
        required
      />
      <AppSelect
        v-model="form.idAlmacen"
        label="Almacén de retorno"
        required
        :options="almacenOptions"
      />
      <!--
        El lote y su vencimiento no se piden acá: son datos de la ficha ICP, que
        se registra con "Registrar lote y protocolo" y trae además los análisis y
        los envases aprobados. Duplicarlos en dos sitios los dejaba desalineados.
      -->
      <AppDatePicker
        v-model="form.fechaPruebaHidrostatica"
        label="Prueba hidrostática"
        hint="Se registra en el libro de P.H. de cada cilindro que vuelve."
      />
      <!--
        El retorno es siempre físico: ya no hay opción de "solo anotar la
        fecha". Esa variante dejaba la orden marcada como retornada con los
        cilindros todavía en planta, sin gas ingresado, y bloqueaba el retorno
        de verdad desde Compras.
      -->
      <p
        class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
      >
        Al guardar, los cilindros quedan disponibles en el almacén de retorno y entra su gas. El gas
        entra con las cantidades de la compra vinculada; si aún no hay compra, con las cantidades que
        salieron en la orden.
      </p>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
        :disabled="mutation.isPending.value"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-70"
        :disabled="!puedeGuardar || mutation.isPending.value"
        @click="onGuardar"
      >
        {{ mutation.isPending.value ? 'Guardando...' : 'Guardar' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useFinalizarRecargaMutation } from '@/modules/documentos-salida/composables/useDocumentoSalidaMutations'
import type { DocumentoSalida } from '@/modules/documentos-salida/interfaces/documento-salida.interface'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppDatePicker, AppModal, AppSelect } from '@/shared/components'
import { ref } from 'vue'

const props = defineProps<{ documento: DocumentoSalida | null | undefined }>()

const open = defineModel<boolean>({ default: false })

const authStore = useAuthStore()
const mutation = useFinalizarRecargaMutation()

const almacenesFilters = ref({ pagina: 1, limite: 200 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)
const almacenOptions = computed(() => {
  const lista = almacenesQuery.data.value?.data ?? []
  const idSucursalDoc = props.documento?.id_sucursal
  const filtrados =
    idSucursalDoc != null
      ? lista.filter((a) => Number(a.id_sucursal) === Number(idSucursalDoc))
      : lista
  return filtrados.map((a) => ({ value: a.id, label: a.nombre }))
})

const form = reactive({
  fechaLlegadaAlmacen: '',
  idAlmacen: '' as number | '',
  fechaPruebaHidrostatica: '',
})

const puedeGuardar = computed(
  () => Boolean(form.fechaLlegadaAlmacen) && form.idAlmacen !== '',
)

watch(open, (abierto) => {
  if (!abierto || !props.documento) return
  // Por defecto vuelven al almacén del que salieron; el backend lo guarda como
  // almacén de retorno, sin pisar el origen de la orden.
  form.idAlmacen = props.documento.id_almacen_retorno ?? props.documento.id_almacen
})

async function onGuardar() {
  if (!props.documento || !puedeGuardar.value) return
  await mutation.mutateAsync({
    id: props.documento.id,
    payload: {
      fechaLlegadaAlmacen: form.fechaLlegadaAlmacen,
      idAlmacen: Number(form.idAlmacen),
      fechaPruebaHidrostatica: form.fechaPruebaHidrostatica || undefined,
      // Este modal es "registrar retorno": siempre mueve inventario. Sin esto
      // el backend no guarda las fechas y la orden queda igual que antes.
      guardarBalonesAlmacen: true,
      // Ficha ICP ya enganchada a la OS (Registrar lote): se re-aplica en el retorno.
      idLoteProtocolo: props.documento.id_lote_protocolo ?? undefined,
      idUsuarioAuditoria: authStore.user?.id,
    },
  })
  open.value = false
}
</script>
