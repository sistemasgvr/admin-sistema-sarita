<template>
  <AppModal
    v-model="open"
    title="Cilindros comprados"
    subtitle="Se dan de alta en el libro y cada uno genera su entrada de inventario."
    size="xl"
  >
    <div class="space-y-4">
      <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table class="min-w-full text-sm">
          <thead
            class="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-white/[0.03] dark:text-gray-400"
          >
            <tr>
              <th class="px-3 py-2 font-medium">Código *</th>
              <th class="px-3 py-2 font-medium">N° de serie</th>
              <th class="px-3 py-2 font-medium">Tipo *</th>
              <th class="px-3 py-2 font-medium">Gas</th>
              <th class="px-3 py-2 font-medium">Cantidad</th>
              <th class="px-3 py-2 font-medium">Marca</th>
              <th class="px-3 py-2 font-medium">Fabricación</th>
              <th class="px-3 py-2 font-medium">Última P.H.</th>
              <th class="w-12 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="(fila, index) in filas" :key="index">
              <td class="px-3 py-2">
                <AppInput v-model="fila.codigoBalon" placeholder="BAL-OXM10-020" :disabled="guardando" />
              </td>
              <td class="px-3 py-2">
                <AppInput v-model="fila.numeroSerie" placeholder="J25642171" :disabled="guardando" />
              </td>
              <td class="px-3 py-2">
                <AppSelect
                  v-model="fila.idTipoBalon"
                  :options="tipoOptions"
                  placeholder="Tipo"
                  :disabled="guardando || tiposQuery.isLoading.value"
                />
              </td>
              <!--
                El gas no se elige: lo define el tipo de balón. Así un cilindro
                de oxígeno medicinal no puede entrar con otro gas por un descuido.
              -->
              <td class="px-3 py-2">
                <span v-if="gasDeFila(fila)" class="text-xs text-gray-700 dark:text-gray-300">
                  {{ gasDeFila(fila) }}
                </span>
                <span v-else class="text-xs text-gray-400">Elige el tipo</span>
              </td>
              <td class="px-3 py-2">
                <AppInput
                  v-model.number="fila.cantidadGas"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  :disabled="guardando || !fila.idTipoBalon"
                />
              </td>
              <td class="px-3 py-2">
                <AppSelect
                  v-model="fila.idMarcaCilindro"
                  :options="marcaOptions"
                  placeholder="Marca"
                  :disabled="guardando"
                />
              </td>
              <td class="px-3 py-2">
                <AppInput v-model="fila.fechaFabricacion" type="date" :disabled="guardando" />
              </td>
              <td class="px-3 py-2">
                <AppInput
                  v-model="fila.fechaUltimaPruebaHidrostatica"
                  type="date"
                  :disabled="guardando"
                />
              </td>
              <td class="px-3 py-2 text-right">
                <button
                  type="button"
                  title="Quitar cilindro"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:border-error-300 hover:bg-error-50 hover:text-error-600 disabled:opacity-50 dark:border-gray-700"
                  :disabled="guardando || filas.length === 1"
                  @click="quitarFila(index)"
                >
                  <AppIcon :name="ICONS.x" :size="14" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-70 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          :disabled="guardando"
          @click="agregarFila"
        >
          <AppIcon :name="ICONS.plus" :size="15" />
          Agregar cilindro
        </button>

        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ filasValidas.length }} de {{ filas.length }} fila(s) completa(s). Código y tipo son
          obligatorios.
        </p>
      </div>

      <p
        class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-400"
      >
        Los cilindros entran como propiedad de la empresa, disponibles en el almacén de la compra.
        El gas lo define el tipo de balón; si indicas cantidad, entra además al stock del producto
        con su propio movimiento. Si un código ya existe en el libro, la operación se rechaza entera.
      </p>
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
        :disabled="guardando || filasValidas.length === 0"
        @click="onGuardar"
      >
        {{ guardando ? 'Registrando...' : `Registrar ${filasValidas.length} cilindro(s)` }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRegistrarBalonesCompraMutation } from '@/modules/compras/composables/useCompraMutations'
import type { CompraBalonPayload } from '@/modules/compras/interfaces/compra.interface'
import { useTiposBalonQuery } from '@/modules/balones/tipos-balon/composables/useTiposBalonQuery'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'

interface FilaBalon {
  codigoBalon: string
  numeroSerie: string
  idTipoBalon: number | ''
  cantidadGas: number | ''
  idMarcaCilindro: number | ''
  fechaFabricacion: string
  fechaUltimaPruebaHidrostatica: string
}

const props = defineProps<{ idCompra: number | null }>()

const open = defineModel<boolean>({ default: false })

const authStore = useAuthStore()
const mutation = useRegistrarBalonesCompraMutation()

const tiposFilters = ref({ pagina: 1, limite: 200 })
const tiposQuery = useTiposBalonQuery(tiposFilters)
const listaMarcaId = ref(ListaIds.MARCA_CILINDRO)
const marcaQuery = useListaOpcionesQuery(listaMarcaId)

const guardando = computed(() => mutation.isPending.value)

const tipoOptions = computed(
  () => tiposQuery.data.value?.data?.map((t) => ({ value: t.id, label: t.nombre })) ?? [],
)
const marcaOptions = computed(() => toSelectOptions(marcaQuery.data.value))

const tipos = computed(() => tiposQuery.data.value?.data ?? [])

const tipoDe = (fila: FilaBalon) =>
  fila.idTipoBalon === '' ? null : tipos.value.find((t) => t.id === Number(fila.idTipoBalon))

const gasDeFila = (fila: FilaBalon) => tipoDe(fila)?.nombre_gas ?? null

const filaVacia = (): FilaBalon => ({
  codigoBalon: '',
  numeroSerie: '',
  idTipoBalon: '',
  cantidadGas: '',
  idMarcaCilindro: '',
  fechaFabricacion: '',
  fechaUltimaPruebaHidrostatica: '',
})

const filas = ref<FilaBalon[]>([filaVacia()])

// Solo se envían las filas completas: así se puede dejar una vacía al final
// mientras se tipea sin que bloquee el guardado.
const filasValidas = computed(() =>
  filas.value.filter((fila) => fila.codigoBalon.trim() !== '' && fila.idTipoBalon !== ''),
)

watch(open, (abierto) => {
  if (abierto) filas.value = [filaVacia()]
})

function agregarFila() {
  filas.value.push(filaVacia())
}

function quitarFila(index: number) {
  filas.value.splice(index, 1)
  if (filas.value.length === 0) filas.value.push(filaVacia())
}

async function onGuardar() {
  const currentUserId = authStore.user?.id
  if (!props.idCompra || !currentUserId || filasValidas.value.length === 0) return

  const balones: CompraBalonPayload[] = filasValidas.value.map((fila) => ({
    codigoBalon: fila.codigoBalon.trim(),
    numeroSerie: fila.numeroSerie.trim() || undefined,
    idTipoBalon: Number(fila.idTipoBalon),
    idMarcaCilindro: fila.idMarcaCilindro === '' ? undefined : Number(fila.idMarcaCilindro),
    fechaFabricacion: fila.fechaFabricacion || undefined,
    fechaUltimaPruebaHidrostatica: fila.fechaUltimaPruebaHidrostatica || undefined,
    cantidadGas:
      fila.cantidadGas === '' || Number(fila.cantidadGas) <= 0
        ? undefined
        : Number(fila.cantidadGas),
  }))

  try {
    await mutation.mutateAsync({
      id: props.idCompra,
      payload: { balones, idUsuarioAuditoria: currentUserId },
    })
    open.value = false
  } catch {
    // toast en mutation
  }
}
</script>
