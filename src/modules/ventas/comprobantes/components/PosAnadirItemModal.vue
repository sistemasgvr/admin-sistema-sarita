<template>
  <AppModal
    v-model="open"
    :title="titulo"
    :subtitle="subtitulo"
    :size="paso === 'catalogo' ? 'xl' : 'lg'"
  >
    <!-- Paso 1: tipo -->
    <div v-if="paso === 'tipo'" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <button
        v-for="opcion in tiposDisponibles"
        :key="opcion.key"
        type="button"
        class="flex items-start gap-3 rounded-xl border border-gray-200 p-4 text-left transition hover:border-brand-400 hover:bg-brand-50/40 dark:border-gray-700 dark:hover:border-brand-500 dark:hover:bg-brand-500/10"
        @click="elegirTipo(opcion.key)"
      >
        <span
          class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
        >
          <AppIcon :name="opcion.icon" :size="20" />
        </span>
        <span class="min-w-0">
          <span class="block text-sm font-semibold text-gray-800 dark:text-white/90">
            {{ opcion.label }}
          </span>
          <span class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
            {{ opcion.help }}
          </span>
        </span>
      </button>
    </div>

    <!-- Paso 2: catálogo (galería / listado + filtros) -->
    <div v-else-if="paso === 'catalogo'" class="max-h-[min(70vh,640px)] overflow-y-auto">
      <PosProductPicker
        v-model:search="buscar"
        v-model:filters="dynamicFilters"
        :filter-fields="filterFields"
        :productos="productos"
        :total="productosQuery.data.value?.meta?.total ?? null"
        :loading="productosQuery.isLoading.value || productosQuery.isFetching.value"
        :stock-gas-por-producto="stockGasPorProducto"
        :sin-almacen-para-gas="tipo === 'gas' && !idAlmacen"
        :stock-gas-listo="tipo !== 'gas' || !idAlmacen || stockGasQuery.isFetched.value"
        @filter-change="onFiltersChange"
        @add="elegirProducto"
        @scanned="elegirProducto"
      />
    </div>

    <!-- Paso 3: configurar -->
    <div v-else-if="paso === 'config' && producto" class="space-y-4">
      <p
        v-if="tipo !== 'gas' && tipo !== 'alquiler'"
        class="text-sm text-gray-500 dark:text-gray-400"
      >
        {{ ayudaConfig }}
      </p>

      <div
        v-if="tipo !== 'gas' && tipo !== 'alquiler'"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <CantidadUnidadInput
          v-if="!esTallerProducto"
          v-model="cantidad"
          name="pos-anadir-cantidad"
          :nombre-unidad="producto.nombre_unidad_medida ?? 'UNID'"
          :es-gas="false"
          label="Cantidad"
        />
        <div :class="esTallerProducto ? 'sm:col-span-2' : ''">
          <AppFormField
            :label="esTallerProducto ? 'Costo / importe' : 'Precio unitario'"
            required
            :error="errorPrecioUnitario"
          >
            <MoneyInput
              v-model="precioUnitario"
              placeholder="0.00"
              :state="errorPrecioUnitario ? 'error' : 'default'"
              @blur="onBlurPrecioUnitario"
            />
          </AppFormField>
        </div>
      </div>

      <template v-if="tipo === 'gas'">
        <div>
          <p class="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
            {{
              continuarConPrestamoGas
                ? 'Préstamo del cilindro'
                : '1. ¿Qué hace el cliente?'
            }}
          </p>
          <div
            class="grid gap-2"
            :class="escenariosGasVisibles.length >= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'"
          >
            <button
              v-for="opcion in escenariosGasVisibles"
              :key="opcion.key"
              type="button"
              class="flex items-start gap-2.5 rounded-xl border px-3 py-3 text-left transition"
              :class="
                escenarioGas === opcion.key
                  ? 'border-brand-500 bg-brand-50/60 dark:border-brand-500 dark:bg-brand-500/10'
                  : 'border-gray-200 hover:border-brand-300 dark:border-gray-700 dark:hover:border-brand-500'
              "
              @click="setEscenarioGas(opcion.key)"
            >
              <span
                class="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                :class="
                  escenarioGas === opcion.key
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300'
                "
              >
                <AppIcon :name="opcion.icon" :size="16" />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold leading-snug text-gray-800 dark:text-white/90">
                  {{ opcion.label }}
                </span>
                <span class="mt-0.5 block text-xs leading-snug text-gray-500 dark:text-gray-400">
                  {{ opcion.help }}
                </span>
              </span>
            </button>
          </div>
        </div>

        <template v-if="escenarioGas === 'balon_cliente'">
          <p class="text-sm font-semibold text-gray-800 dark:text-white/90">
            2. Elige el cilindro que trae
          </p>
          <p
            v-if="esClientesVarios"
            class="rounded-lg bg-error-50 px-3 py-2 text-xs font-medium text-error-600 dark:bg-error-500/10 dark:text-error-400"
          >
            Primero elige un cliente con nombre (no “Clientes varios”).
          </p>
          <PosBalonSelectField
            v-model="idBalon"
            v-model:etiqueta="etiquetaBalon"
            mode="cliente"
            :id-cliente="idCliente"
            :extra-filters="extraFiltersProductoGas"
            label="Cilindro del cliente"
            placeholder="Buscar código o serie"
            register-label="Registrar cilindro del cliente"
            empty-text="No hay cilindros de este cliente. Regístralo con el +."
            required
            @selected="onBalonClienteSelected"
          />
          <p
            v-if="capacidadBalonSeleccionado"
            class="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-white/5 dark:text-gray-300"
          >
            Este cilindro es de
            <span class="font-semibold">{{ capacidadBalonSeleccionado }} m³</span>
            (esa cantidad se cobrará).
          </p>
          <p
            v-if="errorOrigenes"
            class="rounded-lg bg-error-50 px-3 py-2 text-xs font-medium text-error-600 dark:bg-error-500/10 dark:text-error-400"
          >
            {{ errorOrigenes }}
          </p>
          <p
            v-else-if="cargandoOrigenes"
            class="text-xs text-gray-500 dark:text-gray-400"
          >
            Buscando de dónde salir el gas...
          </p>
          <p
            v-else-if="sugerenciaOrigenLabel"
            class="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
          >
            El gas se descontará de:
            <span class="font-semibold">{{ sugerenciaOrigenLabel }}</span>
          </p>
          <details class="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
            <summary class="cursor-pointer text-sm text-gray-600 dark:text-gray-400">
              Elegir otro cilindro de la empresa (opcional)
            </summary>
            <div class="mt-3">
              <AppSelect
                v-model="idBalonPreferido"
                label="Usar primero este cilindro lleno"
                placeholder="Automático (el más antiguo)"
                :options="origenOptions"
                :disabled="cargandoOrigenes || !producto"
              />
            </div>
          </details>
        </template>

        <template v-else-if="escenarioGas === 'entregar_prestamo'">
          <p class="text-sm font-semibold text-gray-800 dark:text-white/90">
            2. Elige el cilindro que le entregamos
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Cobras el gas. El cilindro es de la empresa y el cliente lo devuelve después.
          </p>
          <p
            v-if="esClientesVarios"
            class="rounded-lg bg-error-50 px-3 py-2 text-xs font-medium text-error-600 dark:bg-error-500/10 dark:text-error-400"
          >
            Primero elige un cliente con nombre (no “Clientes varios”).
          </p>
          <PosBalonSelectField
            v-model="idBalon"
            v-model:etiqueta="etiquetaBalon"
            mode="alquiler"
            :id-almacen="idAlmacen"
            :extra-filters="extraFiltersProductoGas"
            label="Cilindro de la empresa"
            placeholder="Buscar en almacén"
            empty-text="No hay cilindros con gas de este producto en el almacén."
            required
            @selected="onBalonEmpresaSelected"
          />
          <p
            v-if="capacidadBalonSeleccionado"
            class="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-white/5 dark:text-gray-300"
          >
            Este cilindro es de
            <span class="font-semibold">{{ capacidadBalonSeleccionado }} m³</span>
            (esa cantidad se cobrará de gas).
          </p>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AppInput v-model="fechaInicio" label="Fecha de entrega" type="date" required />
            <AppInput v-model="fechaFin" label="Fecha de devolución" type="date" />
          </div>
          <AppFormField
            label="Garantía (dinero que deja)"
            optional
            hint="0 si no se cobra. Se puede devolver cuando traiga el cilindro."
            :error="errorMontoGarantia"
          >
            <MoneyInput
              v-model="montoGarantia"
              placeholder="0.00"
              :state="errorMontoGarantia ? 'error' : 'default'"
              @blur="onBlurMontoGarantia"
            />
          </AppFormField>
          <p
            v-if="origenMontoGarantia"
            class="text-xs text-gray-500 dark:text-gray-400"
          >
            {{ origenMontoGarantia }}
          </p>
          <GarantiaRecepcionFields
            v-if="montoNumerico(montoGarantia) > 0"
            v-model:id-medio-pago="idMedioPagoGarantia"
            v-model:observacion="observacionGarantia"
          />
        </template>

        <template v-else-if="escenarioGas === 'comprar_balon'">
          <p class="text-sm font-semibold text-gray-800 dark:text-white/90">
            2. Elige el cilindro que se vende
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            El cliente se lleva el cilindro. Se cobra el gas y el envase por separado.
          </p>
          <PosBalonSelectField
            v-model="idBalon"
            v-model:etiqueta="etiquetaBalon"
            mode="alquiler"
            :id-almacen="idAlmacen"
            :extra-filters="extraFiltersProductoGas"
            label="Cilindro a vender"
            placeholder="Buscar en almacén"
            empty-text="No hay cilindros con gas de este producto en el almacén."
            required
            @selected="onBalonEmpresaSelected"
          />
          <p
            v-if="capacidadBalonSeleccionado"
            class="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-white/5 dark:text-gray-300"
          >
            Este cilindro es de
            <span class="font-semibold">{{ capacidadBalonSeleccionado }} m³</span>
            (esa cantidad se cobrará de gas).
          </p>
          <AppFormField label="Precio del envase (cilindro vacío)" required :error="errorPrecioBalon">
            <MoneyInput
              v-model="precioBalon"
              placeholder="0.00"
              :state="errorPrecioBalon ? 'error' : 'default'"
              @blur="onBlurPrecioBalon"
            />
          </AppFormField>
          <div
            class="grid grid-cols-3 gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs dark:border-gray-700 dark:bg-white/[0.03]"
          >
            <div>
              <p class="text-gray-500 dark:text-gray-400">Gas</p>
              <p class="font-medium tabular-nums text-gray-800 dark:text-white/90">
                {{ formatMoney(importeGas) }}
              </p>
            </div>
            <div>
              <p class="text-gray-500 dark:text-gray-400">Envase</p>
              <p class="font-medium tabular-nums text-gray-800 dark:text-white/90">
                {{ formatMoney(montoNumerico(precioBalon)) }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-gray-500 dark:text-gray-400">Total</p>
              <p class="font-semibold tabular-nums text-brand-600 dark:text-brand-400">
                {{ formatMoney(importe) }}
              </p>
            </div>
          </div>
        </template>

        <div v-if="escenarioGas" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CantidadUnidadInput
            v-if="!cantidadBloqueadaPorBalon"
            v-model="cantidad"
            name="pos-anadir-cantidad"
            :nombre-unidad="producto.nombre_unidad_medida ?? 'UNID'"
            es-gas
            label="Cantidad de gas (m³)"
            :error="errorCantidadVsBalon || undefined"
            :hint="hintCantidadBalon"
          />
          <div :class="cantidadBloqueadaPorBalon ? 'sm:col-span-2' : ''">
            <AppFormField label="Precio por m³" required :error="errorPrecioUnitario">
              <MoneyInput
                v-model="precioUnitario"
                placeholder="0.00"
                :state="errorPrecioUnitario ? 'error' : 'default'"
                @blur="onBlurPrecioUnitario"
              />
            </AppFormField>
          </div>
        </div>
      </template>

      <template v-else-if="tipo === 'alquiler'">
        <p class="text-sm font-semibold text-gray-800 dark:text-white/90">
          1. Alquiler del accesorio
        </p>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CantidadUnidadInput
            v-model="cantidad"
            name="pos-anadir-cantidad"
            :nombre-unidad="producto.nombre_unidad_medida ?? 'UNID'"
            label="Cantidad"
          />
          <AppFormField label="Precio del alquiler" required :error="errorPrecioUnitario">
            <MoneyInput
              v-model="precioUnitario"
              placeholder="0.00"
              :state="errorPrecioUnitario ? 'error' : 'default'"
              @blur="onBlurPrecioUnitario"
            />
          </AppFormField>
          <AppInput v-model="fechaInicio" label="Desde" type="date" required />
          <AppInput v-model="fechaFin" label="Hasta (lo devuelve)" type="date" required />
        </div>
        <AppFormField
          label="Garantía (dinero que deja)"
          optional
          hint="0 si no se cobra."
          :error="errorMontoGarantia"
        >
          <MoneyInput
            v-model="montoGarantia"
            placeholder="0.00"
            :state="errorMontoGarantia ? 'error' : 'default'"
            @blur="onBlurMontoGarantia"
          />
        </AppFormField>
        <p
          v-if="origenMontoGarantia"
          class="text-xs text-gray-500 dark:text-gray-400"
        >
          {{ origenMontoGarantia }}
        </p>
        <GarantiaRecepcionFields
          v-if="montoNumerico(montoGarantia) > 0"
          v-model:id-medio-pago="idMedioPagoGarantia"
          v-model:observacion="observacionGarantia"
        />

        <div v-if="!modoEdicion">
          <p class="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
            2. ¿También le das un cilindro?
          </p>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              class="flex items-start gap-2.5 rounded-xl border px-3 py-3 text-left transition"
              :class="
                !entregarCilindroAlquiler
                  ? 'border-brand-500 bg-brand-50/60 dark:border-brand-500 dark:bg-brand-500/10'
                  : 'border-gray-200 hover:border-brand-300 dark:border-gray-700 dark:hover:border-brand-500'
              "
              @click="setEntregarCilindroAlquiler(false)"
            >
              <span
                class="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                :class="
                  !entregarCilindroAlquiler
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300'
                "
              >
                <AppIcon :name="ICONS.package" :size="16" />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold text-gray-800 dark:text-white/90">
                  Solo el accesorio
                </span>
                <span class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                  El cliente ya tiene cilindro, o no necesita uno.
                </span>
              </span>
            </button>
            <button
              v-if="puedePrestarCilindro"
              type="button"
              class="flex items-start gap-2.5 rounded-xl border px-3 py-3 text-left transition"
              :class="
                entregarCilindroAlquiler
                  ? 'border-brand-500 bg-brand-50/60 dark:border-brand-500 dark:bg-brand-500/10'
                  : 'border-gray-200 hover:border-brand-300 dark:border-gray-700 dark:hover:border-brand-500'
              "
              @click="setEntregarCilindroAlquiler(true)"
            >
              <span
                class="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                :class="
                  entregarCilindroAlquiler
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300'
                "
              >
                <AppIcon :name="ICONS.cylinder" :size="16" />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold text-gray-800 dark:text-white/90">
                  Sí, prestar cilindro
                </span>
                <span class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                  Primero se agrega el alquiler. Luego eliges el gas y el precio.
                </span>
              </span>
            </button>
          </div>
          <p
            v-if="entregarCilindroAlquiler"
            class="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
          >
            Al continuar, el regulador entra al carrito y te pediremos el gas del cilindro (precio,
            m³ y qué envase sale).
          </p>
        </div>
      </template>

      <template v-else-if="tipo === 'servicio' && esTallerProducto">
        <PosBalonSelectField
          v-model="idBalon"
          v-model:etiqueta="etiquetaBalon"
          mode="cliente"
          :id-cliente="idCliente"
          label="Cilindro del cliente"
          placeholder="Buscar código o serie"
          register-label="Registrar cilindro del cliente"
          empty-text="No hay cilindros de este cliente. Regístralo con el +."
          required
        />
        <AppSelectSearch
          v-model="idTipoMantenimiento"
          v-model:search="tipoMantenimientoBuscar"
          label="Tipo de mantenimiento"
          placeholder="P.H., válvula, etc."
          search-placeholder="Buscar tipo..."
          :options="tipoMantenimientoOptions"
          :loading="tiposMantenimientoQuery.isFetching.value"
        />
        <AppInput v-model="fechaIngreso" label="Fecha ingreso" type="date" required />
        <AppInput
          v-model="descripcionMantenimiento"
          label="Descripción"
          placeholder="Detalle del trabajo"
        />
      </template>

      <AppInput v-model="observacion" label="Nota del ítem" placeholder="Opcional" />

      <p
        v-if="!(tipo === 'gas' && escenarioGas === 'comprar_balon')"
        class="text-right text-sm font-medium tabular-nums text-gray-700 dark:text-gray-300"
      >
        Importe: {{ formatMoney(importe) }}
      </p>
    </div>

    <template #footer>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        @click="onSecundario"
      >
        {{ textoSecundario }}
      </button>
      <button
        v-if="paso === 'config'"
        type="button"
        class="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        :disabled="!puedeConfirmar"
        @click="confirmar"
      >
        <AppIcon :name="ICONS.plus" :size="16" />
        {{ textoConfirmar }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, onMounted, ref, watch } from 'vue'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { categoriasProductoService } from '@/modules/productos/categorias/services/categorias-producto.service'
import type { CategoriaProducto } from '@/modules/productos/categorias/interfaces/categoria-producto.interface'
import { subCategoriasProductoService } from '@/modules/productos/sub-categorias/services/sub-categorias-producto.service'
import type { SubCategoriaProducto } from '@/modules/productos/sub-categorias/interfaces/sub-categoria-producto.interface'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import type { Producto, ProductoListFilters } from '@/modules/productos/articulos/interfaces/producto.interface'
import { productosService } from '@/modules/productos/articulos/services/productos.service'
import { filtrarProductosCatalogo } from '@/modules/productos/articulos/utils/productosSistema'
import { productoEsMantenimientoTaller } from '@/modules/productos/articulos/utils/productoEsMantenimientoTaller'
import { catalogoPreciosService } from '@/modules/productos/catalogo-precios/services/catalogo-precios.service'
import { stockGasQueryKeys } from '@/modules/balones/stock-gas/constants/stockGasQueryKeys'
import type { StockGasListFilters } from '@/modules/balones/stock-gas/interfaces/stock-gas.interface'
import { stockGasService } from '@/modules/balones/stock-gas/services/stock-gas.service'
import type { Balon } from '@/modules/balones/cilindros/interfaces/balon.interface'
import { movimientosRecargaService } from '@/modules/balones/recargas/services/movimientos-recarga.service'
import type { BalonOrigenRecarga } from '@/modules/balones/recargas/interfaces/movimiento-recarga.interface'
import { formatOrigenRecargaLabel } from '@/modules/balones/recargas/utils/formatOrigenRecargaLabel'
import GarantiaRecepcionFields from '@/modules/balones/garantias/components/GarantiaRecepcionFields.vue'
import CantidadUnidadInput from '@/modules/ventas/comprobantes/components/CantidadUnidadInput.vue'
import PosBalonSelectField from '@/modules/ventas/comprobantes/components/PosBalonSelectField.vue'
import PosProductPicker from '@/modules/ventas/comprobantes/components/PosProductPicker.vue'
import { addDaysIso } from '@/modules/ventas/comprobantes/composables/usePosKitMedicinal'
import {
  CODIGO_PRODUCTO_VENTA_ENVASE,
  NOMBRE_PRODUCTO_VENTA_ENVASE,
} from '@/modules/ventas/comprobantes/constants/ventaEnvase'
import type { PosLineItem } from '@/modules/ventas/comprobantes/interfaces/comprobante.interface'
import {
  productoGasSinStockParaVenta,
  productoSinStockParaVenta,
  validarStockParaAgregar,
  type StockGasPosInfo,
} from '@/modules/ventas/comprobantes/utils/stockPos'
import { validarCantidadSegunUnidad } from '@/modules/ventas/comprobantes/utils/unidadMedidaCantidad'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect, AppSelectSearch, MoneyInput } from '@/shared/components'
import AppFormField from '@/shared/components/form/AppFormField.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useMoneyField } from '@/shared/composables/useMoneyField'
import { getApiErrorMessage, toastWarning } from '@/shared/composables/useToast'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { hoyIsoLima } from '@/shared/utils/date'
import { parseMoneyInput, roundMoney } from '@/shared/utils/currency'
import type { DynamicFilterFieldDef, DynamicFilterValues } from '@/shared/interfaces/dynamic-filter.interface'

export type PosAnadirTipo = 'accesorio' | 'gas' | 'alquiler' | 'servicio'
export type EscenarioGas =
  | 'balon_cliente'
  | 'entregar_prestamo'
  | 'comprar_balon'
type Paso = 'tipo' | 'catalogo' | 'config'

export interface PosLineaConfirmada {
  tipo: PosAnadirTipo | 'mantenimiento'
  producto: Producto
  cantidad: number
  precioUnitario: number
  idBalon?: number
  idBalonOrigen?: number
  etiquetaBalonOrigen?: string
  capacidad?: number
  fechaInicioAlquiler?: string
  fechaFinAlquiler?: string
  observacionLinea?: string
  idTipoMantenimiento?: number
  fechaIngresoMantenimiento?: string
  descripcionMantenimiento?: string
  escenarioGas?: EscenarioGas
  precioBalon?: number
  idProductoEnvase?: number
  nombreProductoEnvase?: string
  precioAlquiler?: number
  idProductoAlquiler?: number
  nombreProductoAlquiler?: string
  etiquetaBalon?: string
  montoGarantia?: number
  idMedioPagoGarantia?: number
  observacionGarantia?: string
  stockDisponible?: number | null
}

const props = withDefaults(
  defineProps<{
    idCliente?: number | ''
    idAlmacen?: number | ''
    /** Nombre del cliente del comprobante (para gas + alquiler). */
    nombreCliente?: string
    /** true si el cliente del comprobante es CVARIOS (mostrador). */
    esClientesVarios?: boolean
    /** Edición de una línea ya en el carrito. */
    linea?: PosLineItem | null
    productoEdicion?: Producto | null
    /** Deep-link desde ?tab=recarga: abre catálogo de gas. */
    inicioPreferido?: 'gas' | 'alquiler' | null
  }>(),
  {
    idCliente: '',
    idAlmacen: '',
    nombreCliente: '',
    esClientesVarios: false,
    linea: null,
    productoEdicion: null,
    inicioPreferido: null,
  },
)

const emit = defineEmits<{
  confirm: [payload: PosLineaConfirmada]
}>()

const open = defineModel<boolean>({ default: false })
const authStore = useAuthStore()

const paso = ref<Paso>('tipo')
const tipo = ref<PosAnadirTipo | null>(null)
const producto = ref<Producto | null>(null)
const esTallerProducto = computed(() =>
  Boolean(producto.value && productoEsMantenimientoTaller(producto.value)),
)
const extraFiltersProductoGas = computed(() =>
  producto.value?.id ? { idProductoGas: producto.value.id } : undefined,
)

const buscar = ref('')
const dynamicFilters = ref<DynamicFilterValues>({})
const categorias = ref<CategoriaProducto[]>([])
const subCategorias = ref<SubCategoriaProducto[]>([])
const categoriaIdsEnTipo = ref<Set<number>>(new Set())
const subCategoriaIdsEnTipo = ref<Set<number>>(new Set())
let buscarTimeout: ReturnType<typeof setTimeout> | undefined

const cantidad = ref(1)
const precioUnitario = ref('')
const {
  error: errorPrecioUnitario,
  valido: precioUnitarioValido,
  onBlur: onBlurPrecioUnitario,
} = useMoneyField(precioUnitario, { min: 0, allowZero: true })
const idBalon = ref<number | ''>('')
const etiquetaBalon = ref('')
const idBalonOrigen = ref<number | ''>('')
const idBalonPreferido = ref<number | ''>('')
const origenes = ref<BalonOrigenRecarga[]>([])
const cargandoOrigenes = ref(false)
const errorOrigenes = ref('')
const sugerenciaOrigenLabel = ref('')
const capacidad = ref<number | string>('')
const fechaInicio = ref('')
const fechaFin = ref('')
const observacion = ref('')
const idTipoMantenimiento = ref<number | ''>('')
const tipoMantenimientoBuscar = ref('')
const fechaIngreso = ref(hoyIsoLima())
const descripcionMantenimiento = ref('')
const escenarioGas = ref<EscenarioGas | null>(null)
const entregarCilindroAlquiler = ref(false)
const continuarConPrestamoGas = ref(false)
const montoGarantia = ref('')
const {
  error: errorMontoGarantia,
  valido: montoGarantiaValido,
  onBlur: onBlurMontoGarantia,
} = useMoneyField(montoGarantia, { min: 0, allowZero: true })
const origenMontoGarantia = ref('')
const idMedioPagoGarantia = ref<string | number>('')
const observacionGarantia = ref('')
const precioBalon = ref('')
const {
  error: errorPrecioBalon,
  valido: precioBalonValido,
  onBlur: onBlurPrecioBalon,
} = useMoneyField(precioBalon, { min: 0, allowZero: true })
const idProductoEnvase = ref<number | ''>('')
const nombreProductoEnvase = ref(NOMBRE_PRODUCTO_VENTA_ENVASE)
const resolviendoProductoEnvase = ref(false)
const precioAlquiler = ref<number | string>(0)
const idProductoAlquiler = ref<number | ''>('')
const nombreProductoAlquiler = ref('')

const origenOptions = computed(() =>
  origenes.value.map((origen) => ({
    value: origen.id,
    label: formatOrigenRecargaLabel(origen),
  })),
)

/** Volumen que debe cubrir el origen (capacidad del cilindro o cantidad a cobrar). */
const capacidadRequerida = computed(() => {
  if (capacidad.value !== '' && capacidad.value != null && Number(capacidad.value) > 0) {
    return Number(capacidad.value)
  }
  return Number(cantidad.value) || 0
})

/** Capacidad (m³) del cilindro seleccionado (cliente u empresa). */
const capacidadBalonSeleccionado = ref<number | null>(null)

const escenarioUsaBalon = computed(
  () =>
    tipo.value === 'gas' &&
    (escenarioGas.value === 'balon_cliente' ||
      escenarioGas.value === 'entregar_prestamo' ||
      escenarioGas.value === 'comprar_balon'),
)

/** Con cilindro seleccionado, la cantidad la fija el sistema (capacidad del balón). */
const cantidadBloqueadaPorBalon = computed(
  () =>
    escenarioUsaBalon.value &&
    capacidadBalonSeleccionado.value != null &&
    capacidadBalonSeleccionado.value > 0,
)

const errorCantidadVsBalon = computed(() => {
  if (!escenarioUsaBalon.value) return ''
  const cap = capacidadBalonSeleccionado.value
  const cant = Number(cantidad.value)
  if (cap == null || cap <= 0 || !(cant > 0)) return ''
  if (cant > cap) {
    return `Máximo ${cap} m³ (capacidad del cilindro)`
  }
  return ''
})

const hintCantidadBalon = computed(() => {
  if (!escenarioUsaBalon.value) return undefined
  const cap = capacidadBalonSeleccionado.value
  if (cap != null && cap > 0) {
    return `${cap} m³ — se toma del cilindro elegido`
  }
  return 'Se completa al elegir el cilindro'
})

function aplicarCapacidadBalon(balon: Balon | null, opts?: { setCapacidadCilindro?: boolean }) {
  if (!balon?.capacidad || Number(balon.capacidad) <= 0) {
    capacidadBalonSeleccionado.value = null
    return
  }
  const cap = Number(balon.capacidad)
  capacidadBalonSeleccionado.value = cap
  cantidad.value = cap
  if (opts?.setCapacidadCilindro) {
    capacidad.value = cap
  }
}

function onBalonClienteSelected(balon: Balon | null) {
  aplicarCapacidadBalon(balon, { setCapacidadCilindro: true })
}

function onBalonEmpresaSelected(balon: Balon | null) {
  aplicarCapacidadBalon(balon)
}

async function refrescarOrigenesRecarga() {
  if (escenarioGas.value !== 'balon_cliente' || !producto.value) {
    origenes.value = []
    idBalonOrigen.value = ''
    errorOrigenes.value = ''
    sugerenciaOrigenLabel.value = ''
    return
  }

  cargandoOrigenes.value = true
  errorOrigenes.value = ''
  sugerenciaOrigenLabel.value = ''
  idBalonOrigen.value = ''

  const requerida = capacidadRequerida.value
  const idAlmacen = props.idAlmacen ? Number(props.idAlmacen) : undefined

  try {
    const listado = await movimientosRecargaService.listarOrigenes({
      idProductoGas: producto.value.id,
      idAlmacen,
      limite: 50,
    })
    origenes.value = listado.data ?? []

    if (idBalonPreferido.value && !origenes.value.some((o) => o.id === Number(idBalonPreferido.value))) {
      idBalonPreferido.value = ''
    }

    if (!origenes.value.length) {
      errorOrigenes.value =
        'No hay balón empresa LLENO del mismo gas con gas disponible en almacén. No se puede recargar.'
      return
    }

    if (requerida <= 0) {
      errorOrigenes.value = 'Indica la capacidad del cilindro del cliente para asignar orígenes.'
      return
    }

    try {
      const asignacion = await movimientosRecargaService.asignarOrigenes({
        idProductoGas: producto.value.id,
        capacidad: requerida,
        idAlmacen,
        idBalonPreferido: idBalonPreferido.value ? Number(idBalonPreferido.value) : undefined,
      })

      idBalonOrigen.value = asignacion.idBalonOrigenPrincipal ?? ''
      sugerenciaOrigenLabel.value = asignacion.etiqueta || ''
      if (!idBalonOrigen.value) {
        errorOrigenes.value = 'No se pudo asignar balones empresa origen para esta recarga.'
      }
    } catch (error) {
      idBalonOrigen.value = ''
      sugerenciaOrigenLabel.value = ''
      errorOrigenes.value = getApiErrorMessage(
        error,
        'Stock insuficiente de gas en balones empresa para cubrir la capacidad pedida.',
      )
    }
  } catch {
    origenes.value = []
    idBalonOrigen.value = ''
    sugerenciaOrigenLabel.value = ''
    errorOrigenes.value =
      'No hay balón empresa LLENO del mismo gas con gas disponible en almacén. No se puede recargar.'
  } finally {
    cargandoOrigenes.value = false
  }
}

const importeGas = computed(() => {
  if (esTallerProducto.value) return montoNumerico(precioUnitario.value)
  return Number(cantidad.value || 0) * montoNumerico(precioUnitario.value)
})

const importe = computed(() => {
  if (tipo.value === 'gas' && escenarioGas.value === 'comprar_balon') {
    return importeGas.value + montoNumerico(precioBalon.value)
  }
  return importeGas.value
})

function montoNumerico(raw: string): number {
  return parseMoneyInput(raw) ?? 0
}

function montoAString(value: number | string | null | undefined): string {
  return roundMoney(Number(value ?? 0)).toFixed(2)
}

/** Resuelve en silencio el producto contable VTA-ENVASE (no se elige en el POS). */
async function resolverProductoVentaEnvase(): Promise<boolean> {
  if (idProductoEnvase.value) return true
  resolviendoProductoEnvase.value = true
  try {
    const response = await productosService.listar({
      pagina: 1,
      limite: 20,
      soloActivos: 1,
      buscar: CODIGO_PRODUCTO_VENTA_ENVASE,
    })
    const match = response.data.find(
      (item) => item.codigo.trim().toUpperCase() === CODIGO_PRODUCTO_VENTA_ENVASE,
    )

    if (!match) {
      toastWarning(
        `Falta el producto ${CODIGO_PRODUCTO_VENTA_ENVASE} (Venta de envase) en el catálogo`,
      )
      return false
    }

    idProductoEnvase.value = match.id
    nombreProductoEnvase.value = match.nombre || NOMBRE_PRODUCTO_VENTA_ENVASE
    return true
  } catch {
    toastWarning('No se pudo cargar el producto de venta de envase')
    return false
  } finally {
    resolviendoProductoEnvase.value = false
  }
}

function normalizarEscenarioGas(value?: string | null): EscenarioGas | null {
  if (!value) return null
  if (value === 'solo_gas' || value === 'balon_cliente') return 'balon_cliente'
  if (value === 'entregar_alquiler' || value === 'entregar_prestamo') {
    return 'entregar_prestamo'
  }
  if (value === 'comprar_balon') return 'comprar_balon'
  return null
}

const escenariosGas = computed(() => {
  const opciones: {
    key: EscenarioGas
    label: string
    help: string
    icon: string
  }[] = [
    {
      key: 'balon_cliente',
      label: 'Trae su cilindro',
      help: 'Lo recargamos y se lo lleva.',
      icon: ICONS.users,
    },
  ]

  if (authStore.hasPermission(PermisoBanderas.PRESTAMOS_BALON_CREAR)) {
    opciones.push({
      key: 'entregar_prestamo',
      label: 'Le prestamos uno',
      help: 'Cilindro de la empresa. Lo devuelve después.',
      icon: ICONS.cylinder,
    })
  }

  if (authStore.hasPermission(PermisoBanderas.BAJAS_BALON_SOLICITAR)) {
    opciones.push({
      key: 'comprar_balon',
      label: 'Se lo vende',
      help: 'Se queda con el cilindro.',
      icon: ICONS.shoppingcard,
    })
  }

  return opciones
})

const puedePrestarCilindro = computed(() =>
  authStore.hasPermission(PermisoBanderas.PRESTAMOS_BALON_CREAR),
)

const escenariosGasVisibles = computed(() => {
  if (!continuarConPrestamoGas.value) return escenariosGas.value
  return escenariosGas.value.filter((opcion) => opcion.key === 'entregar_prestamo')
})

function setEscenarioGas(key: EscenarioGas) {
  if (
    (key === 'entregar_prestamo' || key === 'comprar_balon') &&
    !props.idAlmacen
  ) {
    toastWarning('Selecciona un almacén en el comprobante para elegir el cilindro')
    return
  }
  if (key === 'balon_cliente' && !props.idCliente) {
    toastWarning('Selecciona un cliente para vincular su balón')
    return
  }
  if (key === 'comprar_balon' && !props.idCliente) {
    toastWarning('Selecciona un cliente comprador del cilindro')
    return
  }
  if (key === 'entregar_prestamo' && !props.idCliente) {
    toastWarning('Selecciona el cliente al que se presta el cilindro')
    return
  }
  if (
    key === 'entregar_prestamo' &&
    !authStore.hasPermission(PermisoBanderas.PRESTAMOS_BALON_CREAR)
  ) {
    toastWarning('No tienes permiso para registrar préstamos de cilindro')
    return
  }
  if (key === 'comprar_balon' && !authStore.hasPermission(PermisoBanderas.BAJAS_BALON_SOLICITAR)) {
    toastWarning('No tienes permiso para registrar la baja por venta del cilindro')
    return
  }
  if ((key === 'entregar_prestamo' || key === 'balon_cliente') && props.esClientesVarios) {
    toastWarning(
      key === 'entregar_prestamo'
        ? 'No se puede prestar un cilindro a Clientes Varios. Selecciona un cliente identificado.'
        : 'La recarga con balón del cliente requiere un cliente identificado.',
    )
    return
  }
  if (escenarioGas.value === key) return
  escenarioGas.value = key
  idBalon.value = ''
  etiquetaBalon.value = ''
  capacidadBalonSeleccionado.value = null
  idBalonOrigen.value = ''
  idBalonPreferido.value = ''
  origenes.value = []
  errorOrigenes.value = ''
  sugerenciaOrigenLabel.value = ''
  capacidad.value = ''
  precioBalon.value = '0.00'
  idProductoEnvase.value = ''
  nombreProductoEnvase.value = NOMBRE_PRODUCTO_VENTA_ENVASE
  precioAlquiler.value = 0
  idProductoAlquiler.value = ''
  nombreProductoAlquiler.value = ''
  if (key === 'entregar_prestamo') {
    fechaInicio.value = hoyIsoLima()
    fechaFin.value = ''
    void prefillMontoGarantia(producto.value)
  } else {
    montoGarantia.value = '0.00'
    origenMontoGarantia.value = ''
    idMedioPagoGarantia.value = ''
    observacionGarantia.value = ''
  }
  if (key === 'comprar_balon') {
    void resolverProductoVentaEnvase()
  }
  if (key === 'balon_cliente') {
    void refrescarOrigenesRecarga()
  }
}

function setEntregarCilindroAlquiler(value: boolean) {
  if (value) {
    if (!props.idAlmacen) {
      toastWarning('Selecciona un almacén en el comprobante para elegir el cilindro')
      return
    }
    if (!props.idCliente) {
      toastWarning('Selecciona el cliente al que se presta el cilindro')
      return
    }
    if (props.esClientesVarios) {
      toastWarning(
        'No se puede prestar un cilindro a Clientes Varios. Selecciona un cliente identificado.',
      )
      return
    }
  }
  entregarCilindroAlquiler.value = value
}

async function prefillMontoGarantia(prod?: Producto | null) {
  if (!prod) {
    montoGarantia.value = '0.00'
    origenMontoGarantia.value = ''
    return
  }

  let sugerido = Number(prod.precio_garantia ?? 0)
  let origen = sugerido > 0 ? `producto (${prod.nombre})` : ''

  try {
    const catalogo = await catalogoPreciosService.listar({
      idProducto: prod.id,
      pagina: 1,
      limite: 5,
    })
    const conGarantia = (catalogo.data ?? []).find(
      (row) => row.precio_garantia != null && Number(row.precio_garantia) > 0,
    )
    if (conGarantia) {
      sugerido = Number(conGarantia.precio_garantia)
      origen = `catálogo (${conGarantia.nombre_item})`
    }
  } catch {
    // sin catálogo: se usa precio del producto
  }

  montoGarantia.value = montoAString(sugerido)
  origenMontoGarantia.value =
    sugerido > 0
      ? `Sugerido S/ ${sugerido.toFixed(2)} (${origen})`
      : 'Sin monto sugerido — escríbelo o déjalo en 0'
}

const listaTipoMantenimientoId = ref(ListaIds.TIPO_MANTENIMIENTO)
const tiposMantenimientoQuery = useListaOpcionesQuery(listaTipoMantenimientoId)
const tipoMantenimientoOptions = computed(() =>
  toSelectOptions(tiposMantenimientoQuery.data.value),
)

const modoEdicion = computed(() => Boolean(props.linea))

const tiposDisponibles = computed(() => {
  const opciones: {
    key: PosAnadirTipo
    label: string
    help: string
    icon: string
  }[] = []

  if (authStore.hasPermission(PermisoBanderas.COMPROBANTES_CREAR)) {
    opciones.push({
      key: 'accesorio',
      label: 'Producto o accesorio',
      help: 'Válvulas, reguladores de venta, descartables…',
      icon: ICONS.package,
    })
  }

  if (
    authStore.hasPermission(PermisoBanderas.MOVIMIENTOS_RECARGA_CREAR) ||
    authStore.hasPermission(PermisoBanderas.COMPROBANTES_CREAR)
  ) {
    opciones.push({
      key: 'gas',
      label: 'Gas',
      help: 'Recarga, préstamo de cilindro o venta del envase.',
      icon: ICONS.cylinder,
    })
  }

  if (authStore.hasPermission(PermisoBanderas.ALQUILERES_BALON_CREAR)) {
    opciones.push({
      key: 'alquiler',
      label: 'Alquiler de accesorio',
      help: 'Regulador u otro equipo. El cilindro, si se entrega, se presta.',
      icon: ICONS.calendar,
    })
  }

  if (
    authStore.hasPermission(PermisoBanderas.COMPROBANTES_CREAR) ||
    authStore.hasPermission(PermisoBanderas.MANTENIMIENTOS_BALON_CREAR)
  ) {
    opciones.push({
      key: 'servicio',
      label: 'Servicio',
      help: 'Flete, mantenimiento de cilindro u otro cobro sin stock.',
      icon: ICONS.clipboardList,
    })
  }

  return opciones
})

const filters = ref<ProductoListFilters>({
  pagina: 1,
  limite: 500,
  soloActivos: 1,
  incluirImagenes: true,
})

const productosQuery = useProductosQuery(filters)

const stockGasFilters = computed<StockGasListFilters>(() => ({
  pagina: 1,
  limite: 500,
  idAlmacen: props.idAlmacen ? Number(props.idAlmacen) : undefined,
}))

const stockGasQuery = useQuery({
  queryKey: computed(() => stockGasQueryKeys.list(stockGasFilters.value)),
  queryFn: () => stockGasService.listar(stockGasFilters.value),
  enabled: computed(
    () => open.value && tipo.value === 'gas' && Boolean(props.idAlmacen),
  ),
  placeholderData: keepPreviousData,
})

const stockGasPorProducto = computed(() => {
  const map: Record<number, StockGasPosInfo> = {}
  for (const row of stockGasQuery.data.value?.data ?? []) {
    map[row.id_producto_gas] = {
      capacidad_disponible: Number(row.capacidad_disponible || 0),
      balones_llenos: Number(row.balones_llenos || 0),
      nombre_unidad_medida: row.nombre_unidad_medida,
      tiene_stock_disponible: row.tiene_stock_disponible,
    }
  }
  return map
})

const opcionesStockGas = computed(() => ({
  sinAlmacen: tipo.value === 'gas' && !props.idAlmacen,
  stockGasListo: tipo.value !== 'gas' || !props.idAlmacen || stockGasQuery.isFetched.value,
}))

const productosBase = computed(() =>
  filtrarProductosCatalogo(productosQuery.data.value?.data ?? []),
)

const productos = computed(() => {
  const marca = dynamicFilters.value.marca
  if (!marca) return productosBase.value
  return productosBase.value.filter((item) => item.marca === marca)
})

watch(
  productosBase,
  (list) => {
    if (dynamicFilters.value.idCategoria != null) return
    const cats = new Set(categoriaIdsEnTipo.value)
    const subs = new Set(subCategoriaIdsEnTipo.value)
    for (const item of list) {
      if (item.id_categoria != null) cats.add(item.id_categoria)
      if (item.id_sub_categoria != null) subs.add(item.id_sub_categoria)
    }
    categoriaIdsEnTipo.value = cats
    subCategoriaIdsEnTipo.value = subs
  },
  { immediate: true },
)

const categoriasEnTipo = computed(() => {
  const ids = new Set(categoriaIdsEnTipo.value)
  const selected = dynamicFilters.value.idCategoria
  if (selected != null) ids.add(Number(selected))
  return categorias.value
    .filter((categoria) => ids.has(categoria.id))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
})

const subCategoriasEnTipo = computed(() => {
  const ids = new Set(subCategoriaIdsEnTipo.value)
  const selected = dynamicFilters.value.idSubCategoria
  if (selected != null) ids.add(Number(selected))
  return subCategorias.value
    .filter((sub) => ids.has(sub.id))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
})

const filterFields = computed<DynamicFilterFieldDef[]>(() => {
  const categoriaId =
    dynamicFilters.value.idCategoria != null
      ? Number(dynamicFilters.value.idCategoria)
      : null

  const marcas = new Set<string>()
  for (const item of productosBase.value) {
    const valor = item.marca?.trim()
    if (valor) marcas.add(valor)
  }

  return [
    {
      key: 'idCategoria',
      label: 'Categoría',
      type: 'select',
      placeholder: 'Seleccionar categoría',
      options: categoriasEnTipo.value.map((categoria) => ({
        value: categoria.id,
        label: categoria.nombre,
      })),
    },
    {
      key: 'idSubCategoria',
      label: 'Subcategoría',
      type: 'select',
      placeholder: 'Seleccionar subcategoría',
      disabled: !categoriaId,
      options: subCategoriasEnTipo.value
        .filter((sub) => (categoriaId ? sub.id_categoria === categoriaId : true))
        .map((sub) => ({
          value: sub.id,
          label: sub.nombre,
        })),
    },
    {
      key: 'marca',
      label: 'Marca',
      type: 'select',
      placeholder: 'Seleccionar marca',
      options: [...marcas].sort((a, b) => a.localeCompare(b, 'es')).map((valor) => ({
        value: valor,
        label: valor,
      })),
    },
  ]
})

async function loadCatalogosFiltro() {
  try {
    const [categoriasResponse, subCategoriasResponse] = await Promise.all([
      categoriasProductoService.listar({ pagina: 1, limite: 100 }),
      subCategoriasProductoService.listar({ pagina: 1, limite: 500 }),
    ])
    categorias.value = categoriasResponse.data
    subCategorias.value = subCategoriasResponse.data
  } catch {
    categorias.value = []
    subCategorias.value = []
  }
}

onMounted(() => {
  void loadCatalogosFiltro()
})

const titulo = computed(() => {
  if (modoEdicion.value) return 'Editar ítem'
  if (paso.value === 'tipo') return '¿Qué deseas añadir?'
  if (paso.value === 'catalogo') {
    if (continuarConPrestamoGas.value) return 'Elegir gas del cilindro a prestar'
    if (tipo.value === 'gas') return 'Elegir gas'
    if (tipo.value === 'alquiler') return 'Elegir alquiler'
    if (tipo.value === 'servicio') return 'Elegir servicio'
    return 'Elegir producto'
  }
  return producto.value?.nombre || 'Configurar ítem'
})

const subtitulo = computed(() => {
  if (paso.value === 'config' && producto.value) {
    if (tipo.value === 'gas') {
      return continuarConPrestamoGas.value
        ? 'El accesorio ya está en el carrito. Ahora el cilindro con gas.'
        : 'Elige qué hace el cliente con el cilindro'
    }
    if (tipo.value === 'alquiler') return 'Solo se alquila el accesorio'
    if (tipo.value === 'servicio' && esTallerProducto.value) {
      return 'Queda en taller hasta finalizarlo'
    }
    return producto.value.codigo
  }
  if (paso.value === 'catalogo') {
    return continuarConPrestamoGas.value
      ? 'Toca el gas que vas a entregar con el cilindro'
      : 'Toca un producto para continuar'
  }
  return ''
})

const ayudaConfig = computed(() => {
  if (tipo.value === 'alquiler') {
    return 'Indica fechas y, si aplica, la garantía.'
  }
  if (tipo.value === 'servicio' && esTallerProducto.value) {
    return 'El cilindro entra a taller. Se finaliza después en Balones → Mantenimientos.'
  }
  if (tipo.value === 'servicio') {
    return 'Cobro de servicio (flete u otro). No descuenta stock ni entra a taller.'
  }
  return 'Ajusta cantidad y precio.'
})

const puedeConfirmar = computed(() => {
  if (!producto.value || !tipo.value) return false
  if (!precioUnitarioValido.value) return false
  if (tipo.value === 'servicio' && esTallerProducto.value) {
    return (
      Boolean(props.idCliente) &&
      !props.esClientesVarios &&
      Boolean(idBalon.value && fechaIngreso.value)
    )
  }
  if (Number(cantidad.value) <= 0) return false
  if (errorCantidadVsBalon.value) return false
  if (tipo.value === 'alquiler') {
    if (!montoGarantiaValido.value) return false
    return (
      Boolean(props.idCliente) &&
      !props.esClientesVarios &&
      Boolean(fechaInicio.value && fechaFin.value)
    )
  }
  if (tipo.value === 'gas') {
    if (props.idAlmacen && !stockGasQuery.isFetched.value) return false
    if (!escenarioGas.value) return false
    if (escenarioGas.value === 'balon_cliente') {
      return (
        Boolean(props.idCliente) &&
        !props.esClientesVarios &&
        Boolean(idBalon.value) &&
        Boolean(idBalonOrigen.value) &&
        !cargandoOrigenes.value &&
        !errorOrigenes.value
      )
    }
    if (escenarioGas.value === 'entregar_prestamo') {
      if (!montoGarantiaValido.value) return false
      return (
        Boolean(props.idCliente) &&
        !props.esClientesVarios &&
        Boolean(idBalon.value) &&
        Boolean(fechaInicio.value) &&
        (!fechaFin.value || fechaFin.value >= fechaInicio.value)
      )
    }
    if (escenarioGas.value === 'comprar_balon') {
      return (
        Boolean(idBalon.value) &&
        precioBalonValido.value &&
        Boolean(idProductoEnvase.value) &&
        !resolviendoProductoEnvase.value
      )
    }
    return true
  }
  return true
})

const textoSecundario = computed(() => {
  if (paso.value === 'tipo' || modoEdicion.value) return 'Cancelar'
  if (paso.value === 'catalogo' && continuarConPrestamoGas.value) return 'Cerrar'
  if (paso.value === 'catalogo') return 'Atrás'
  return 'Atrás'
})

const textoConfirmar = computed(() => {
  if (modoEdicion.value) return 'Actualizar ítem'
  if (tipo.value === 'alquiler' && entregarCilindroAlquiler.value) {
    return 'Agregar y elegir gas'
  }
  return 'Agregar al carrito'
})

function filtrosPorTipo(t: PosAnadirTipo): Partial<ProductoListFilters> {
  if (t === 'gas') return { esGas: true }
  if (t === 'accesorio') return { esGas: false, esServicio: false }
  if (t === 'alquiler') return { esAlquilable: true }
  if (t === 'servicio') return { esServicio: true, esAlquilable: false }
  return { esServicio: true, esAlquilable: false }
}

function syncFilters() {
  if (!tipo.value) return
  const active = dynamicFilters.value
  filters.value = {
    buscar: buscar.value.trim(),
    pagina: 1,
    limite: 500,
    soloActivos: 1,
    incluirImagenes: true,
    idAlmacen: props.idAlmacen ? Number(props.idAlmacen) : undefined,
    idCategoria: active.idCategoria != null ? Number(active.idCategoria) : undefined,
    idSubCategoria:
      active.idSubCategoria != null ? Number(active.idSubCategoria) : undefined,
    ...filtrosPorTipo(tipo.value),
  }
}

function onFiltersChange() {
  const active = { ...dynamicFilters.value }
  const categoriaId =
    active.idCategoria != null ? Number(active.idCategoria) : null

  if (active.idSubCategoria != null) {
    const subCategoria = subCategorias.value.find(
      (item) => item.id === Number(active.idSubCategoria),
    )
    if (!categoriaId || subCategoria?.id_categoria !== categoriaId) {
      delete active.idSubCategoria
      dynamicFilters.value = active
    }
  }

  syncFilters()
}

function resetConfig(fromProducto?: Producto | null, fromLinea?: PosLineItem | null) {
  if (fromLinea) {
    cantidad.value = Math.max(1, Number(fromLinea.cantidad || 1))
    precioUnitario.value = montoAString(fromLinea.precioUnitario)
    idBalon.value = fromLinea.idBalon ?? ''
    etiquetaBalon.value = fromLinea.etiquetaBalon ?? ''
    idBalonOrigen.value = fromLinea.idBalonOrigen ?? ''
    idBalonPreferido.value = fromLinea.idBalonOrigen ?? ''
    capacidad.value = fromLinea.capacidad ?? ''
    sugerenciaOrigenLabel.value = fromLinea.etiquetaBalonOrigen ?? ''
    fechaInicio.value =
      fromLinea.fechaInicioAlquiler || hoyIsoLima()
    fechaFin.value =
      fromLinea.fechaFinAlquiler || addDaysIso(fechaInicio.value, 14)
    observacion.value = fromLinea.observacionLinea || ''
    idTipoMantenimiento.value = fromLinea.idTipoMantenimiento ?? ''
    fechaIngreso.value =
      fromLinea.fechaIngresoMantenimiento || hoyIsoLima()
    descripcionMantenimiento.value =
      fromLinea.descripcionMantenimiento || fromLinea.nombre || ''
    escenarioGas.value =
      normalizarEscenarioGas(fromLinea.escenarioGas) ||
      (fromLinea.esGas
        ? fromLinea.precioBalon != null
          ? 'comprar_balon'
          : fromLinea.idBalon && fromLinea.fechaInicioAlquiler
            ? 'entregar_prestamo'
            : fromLinea.idBalon
              ? 'balon_cliente'
              : null
        : null)
    if (escenarioGas.value === 'entregar_prestamo' && !fromLinea.fechaFinAlquiler) {
      fechaFin.value = ''
    }
    precioBalon.value = montoAString(fromLinea.precioBalon)
    idProductoEnvase.value = fromLinea.idProductoEnvase ?? ''
    nombreProductoEnvase.value =
      fromLinea.nombreProductoEnvase || NOMBRE_PRODUCTO_VENTA_ENVASE
    precioAlquiler.value = fromLinea.precioAlquiler ?? 0
    idProductoAlquiler.value = fromLinea.idProductoAlquiler ?? ''
    nombreProductoAlquiler.value = fromLinea.nombreProductoAlquiler || ''
    const esAlquilerLinea =
      fromLinea.tipoPos === 'alquiler' || Boolean(fromLinea.esAlquilable)
    entregarCilindroAlquiler.value = esAlquilerLinea && Boolean(fromLinea.idBalon)
    if (escenarioGas.value === 'entregar_prestamo' || esAlquilerLinea) {
      if (fromLinea.montoGarantia != null) {
        montoGarantia.value = montoAString(fromLinea.montoGarantia)
        origenMontoGarantia.value = ''
      } else {
        void prefillMontoGarantia(fromProducto)
      }
      idMedioPagoGarantia.value = fromLinea.idMedioPagoGarantia ?? ''
      observacionGarantia.value = fromLinea.observacionGarantia ?? ''
    } else {
      montoGarantia.value = '0.00'
      origenMontoGarantia.value = ''
      idMedioPagoGarantia.value = ''
      observacionGarantia.value = ''
    }
    if (fromLinea.escenarioGas === 'comprar_balon' || fromLinea.precioBalon != null) {
      void resolverProductoVentaEnvase()
    }
    return
  }

  cantidad.value = 1
  precioUnitario.value = montoAString(fromProducto?.precio)
  idBalon.value = ''
  etiquetaBalon.value = ''
  capacidadBalonSeleccionado.value = null
  idBalonOrigen.value = ''
  idBalonPreferido.value = ''
  origenes.value = []
  errorOrigenes.value = ''
  sugerenciaOrigenLabel.value = ''
  capacidad.value = ''
  fechaInicio.value = hoyIsoLima()
  fechaFin.value = addDaysIso(fechaInicio.value, 14)
  observacion.value = ''
  idTipoMantenimiento.value = ''
  fechaIngreso.value = hoyIsoLima()
  descripcionMantenimiento.value = fromProducto?.nombre || ''
  escenarioGas.value = null
  entregarCilindroAlquiler.value = false
  montoGarantia.value = '0.00'
  origenMontoGarantia.value = ''
  idMedioPagoGarantia.value = ''
  observacionGarantia.value = ''
  precioBalon.value = '0.00'
  idProductoEnvase.value = ''
  nombreProductoEnvase.value = NOMBRE_PRODUCTO_VENTA_ENVASE
  precioAlquiler.value = 0
  idProductoAlquiler.value = ''
  nombreProductoAlquiler.value = ''

  if (tipo.value === 'alquiler' && fromProducto) {
    void prefillMontoGarantia(fromProducto)
  }
}

function elegirTipo(t: PosAnadirTipo) {
  if ((t === 'alquiler' || t === 'gas') && !props.idAlmacen) {
    toastWarning('Selecciona un almacén en el comprobante antes de añadir')
    return
  }
  if (t === 'alquiler' && props.esClientesVarios) {
    toastWarning(
      'No se puede registrar un alquiler a Clientes Varios. Selecciona un cliente identificado.',
    )
    return
  }
  tipo.value = t
  producto.value = null
  buscar.value = ''
  dynamicFilters.value = {}
  categoriaIdsEnTipo.value = new Set()
  subCategoriaIdsEnTipo.value = new Set()
  syncFilters()
  paso.value = 'catalogo'
}

function elegirProducto(p: Producto) {
  if (
    productoSinStockParaVenta(p) ||
    productoGasSinStockParaVenta(p, stockGasPorProducto.value[p.id], opcionesStockGas.value)
  ) {
    toastWarning(`${p.nombre} no tiene stock disponible`)
    return
  }
  if (tipo.value === 'servicio' && productoEsMantenimientoTaller(p)) {
    if (!props.idCliente || props.esClientesVarios) {
      toastWarning(
        'El taller requiere un cliente identificado. Elige el cliente en el comprobante (no Clientes varios) y vuelve a intentar.',
      )
      return
    }
    if (!authStore.hasPermission(PermisoBanderas.MANTENIMIENTOS_BALON_CREAR)) {
      toastWarning('No tienes permiso para registrar este servicio de taller')
      return
    }
  }
  producto.value = p
  resetConfig(p)
  paso.value = 'config'
  if (continuarConPrestamoGas.value && tipo.value === 'gas') {
    setEscenarioGas('entregar_prestamo')
  }
}

function onSecundario() {
  if (modoEdicion.value || paso.value === 'tipo') {
    open.value = false
    return
  }
  if (paso.value === 'config') {
    paso.value = 'catalogo'
    producto.value = null
    return
  }
  if (continuarConPrestamoGas.value) {
    continuarConPrestamoGas.value = false
    open.value = false
    return
  }
  paso.value = 'tipo'
  tipo.value = null
}

function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(
    Number(value || 0),
  )
}

async function confirmar() {
  if (!producto.value || !tipo.value || !puedeConfirmar.value) return

  const cant = esTallerProducto.value ? 1 : Number(cantidad.value)
  const errorCantidad = validarCantidadSegunUnidad(
    cant,
    producto.value.nombre_unidad_medida ?? 'UNID',
    producto.value.nombre,
  )
  if (errorCantidad) {
    toastWarning(errorCantidad)
    return
  }
  if (errorCantidadVsBalon.value) {
    toastWarning(errorCantidadVsBalon.value)
    return
  }

  onBlurPrecioUnitario()
  onBlurMontoGarantia()
  onBlurPrecioBalon()
  const precio = roundMoney(parseMoneyInput(precioUnitario.value) ?? 0)
  if (!precioUnitarioValido.value) {
    toastWarning('El precio solo admite hasta 2 decimales')
    return
  }

  const errorStock = validarStockParaAgregar(producto.value, cant, {
    requiereAlmacenSeleccionado: true,
    stockGas:
      producto.value.es_gas && stockGasQuery.isFetched.value
        ? (stockGasPorProducto.value[producto.value.id] ?? null)
        : undefined,
    sinAlmacen: Boolean(producto.value.es_gas && !props.idAlmacen),
  })
  if (errorStock) {
    toastWarning(errorStock)
    return
  }

  if (tipo.value === 'gas' && escenarioGas.value === 'balon_cliente') {
    if (!props.idCliente) {
      toastWarning('Selecciona un cliente para vincular su balón')
      return
    }
    if (props.esClientesVarios) {
      toastWarning('La recarga con balón del cliente requiere un cliente identificado.')
      return
    }
    if (!idBalonOrigen.value) {
      toastWarning(
        errorOrigenes.value ||
          'No hay asignación de balones empresa origen. Sin stock físico no se puede recargar.',
      )
      return
    }
  }
  if (tipo.value === 'gas' && escenarioGas.value === 'comprar_balon') {
    if (!authStore.hasPermission(PermisoBanderas.BAJAS_BALON_SOLICITAR)) {
      toastWarning('No tienes permiso para registrar la baja por venta del cilindro')
      return
    }
    const ok = await resolverProductoVentaEnvase()
    if (!ok || !idProductoEnvase.value) return
  }
  if (tipo.value === 'gas' && escenarioGas.value === 'entregar_prestamo') {
    if (!props.idCliente) {
      toastWarning('Selecciona el cliente al que se presta el cilindro')
      return
    }
    if (props.esClientesVarios) {
      toastWarning(
        'No se puede prestar un cilindro a Clientes Varios. Selecciona un cliente identificado.',
      )
      return
    }
    if (!authStore.hasPermission(PermisoBanderas.PRESTAMOS_BALON_CREAR)) {
      toastWarning('No tienes permiso para registrar préstamos de cilindro')
      return
    }
    if (!idBalon.value) {
      toastWarning('Selecciona el cilindro empresa a prestar')
      return
    }
  }
  if (tipo.value === 'alquiler' && props.esClientesVarios) {
    toastWarning(
      'No se puede registrar un alquiler a Clientes Varios. Selecciona un cliente identificado.',
    )
    return
  }
  if (esTallerProducto.value && props.esClientesVarios) {
    toastWarning(
      'El taller requiere un cliente identificado. Elige el cliente en el comprobante (no Clientes varios).',
    )
    return
  }

  const cobraGarantia =
    montoNumerico(montoGarantia.value) > 0 &&
    (tipo.value === 'alquiler' ||
      (tipo.value === 'gas' && escenarioGas.value === 'entregar_prestamo'))
  if (cobraGarantia && !montoGarantiaValido.value) {
    toastWarning('La garantía solo admite hasta 2 decimales')
    return
  }
  if (cobraGarantia && !idMedioPagoGarantia.value) {
    toastWarning('Indica el medio con el que se recibe la garantía')
    return
  }

  const payload: PosLineaConfirmada = {
    tipo: esTallerProducto.value ? 'mantenimiento' : tipo.value,
    producto: producto.value,
    cantidad: cant,
    precioUnitario: precio,
    observacionLinea: observacion.value.trim() || undefined,
  }

  if (producto.value.es_gas && stockGasQuery.isFetched.value) {
    const info = stockGasPorProducto.value[producto.value.id]
    payload.stockDisponible = info ? Number(info.capacidad_disponible || 0) : 0
  }

  if (idBalon.value && (tipo.value === 'gas' || esTallerProducto.value)) {
    payload.idBalon = Number(idBalon.value)
    payload.etiquetaBalon = etiquetaBalon.value.trim() || undefined
  }

  if (tipo.value === 'gas' && escenarioGas.value) {
    payload.escenarioGas = escenarioGas.value
    if (escenarioGas.value === 'balon_cliente') {
      if (capacidad.value !== '' && capacidad.value != null) {
        payload.capacidad = Number(capacidad.value)
      }
      if (idBalonOrigen.value) {
        payload.idBalonOrigen = Number(idBalonOrigen.value)
        payload.etiquetaBalonOrigen = sugerenciaOrigenLabel.value || undefined
      }
    }
    if (escenarioGas.value === 'entregar_prestamo') {
      payload.fechaInicioAlquiler = fechaInicio.value
      payload.fechaFinAlquiler = fechaFin.value || undefined
      payload.montoGarantia = Math.max(0, roundMoney(parseMoneyInput(montoGarantia.value) ?? 0))
      if (payload.montoGarantia > 0) {
        payload.idMedioPagoGarantia = Number(idMedioPagoGarantia.value)
        payload.observacionGarantia = observacionGarantia.value.trim() || undefined
      }
    }
    if (escenarioGas.value === 'comprar_balon') {
      payload.precioBalon = roundMoney(parseMoneyInput(precioBalon.value) ?? 0)
      payload.idProductoEnvase = Number(idProductoEnvase.value)
      payload.nombreProductoEnvase = nombreProductoEnvase.value
    }
  }

  if (tipo.value === 'alquiler') {
    payload.fechaInicioAlquiler = fechaInicio.value
    payload.fechaFinAlquiler = fechaFin.value
    payload.montoGarantia = Math.max(0, roundMoney(parseMoneyInput(montoGarantia.value) ?? 0))
    if (payload.montoGarantia > 0) {
      payload.idMedioPagoGarantia = Number(idMedioPagoGarantia.value)
      payload.observacionGarantia = observacionGarantia.value.trim() || undefined
    }
  }

  if (esTallerProducto.value) {
    payload.fechaIngresoMantenimiento = fechaIngreso.value
    payload.descripcionMantenimiento =
      descripcionMantenimiento.value.trim() || producto.value.nombre
    if (idTipoMantenimiento.value) {
      payload.idTipoMantenimiento = Number(idTipoMantenimiento.value)
    }
  }

  const seguirConPrestamo =
    tipo.value === 'alquiler' && entregarCilindroAlquiler.value && !modoEdicion.value

  emit('confirm', payload)

  if (seguirConPrestamo) {
    continuarConPrestamoGas.value = true
    elegirTipo('gas')
    return
  }

  continuarConPrestamoGas.value = false
  open.value = false
}

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) return

    if (props.linea && props.productoEdicion) {
      const t: PosAnadirTipo =
        props.linea.tipoPos === 'servicio' ||
        props.linea.tipoPos === 'mantenimiento' ||
        props.linea.esMantenimiento ||
        (props.productoEdicion && productoEsMantenimientoTaller(props.productoEdicion))
          ? 'servicio'
          : props.linea.tipoPos === 'gas' || props.linea.esGas
            ? 'gas'
            : props.linea.tipoPos === 'alquiler' || props.linea.esAlquilable
              ? 'alquiler'
              : 'accesorio'
      tipo.value = t
      producto.value = props.productoEdicion
      resetConfig(props.productoEdicion, props.linea)
      paso.value = 'config'
      return
    }

    continuarConPrestamoGas.value = false
    paso.value = 'tipo'
    tipo.value = null
    producto.value = null
    buscar.value = ''
    dynamicFilters.value = {}
    resetConfig()

    if (props.inicioPreferido === 'gas') {
      elegirTipo('gas')
    } else if (props.inicioPreferido === 'alquiler') {
      elegirTipo('alquiler')
    }
  },
)

watch(buscar, () => {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(() => {
    if (paso.value === 'catalogo') syncFilters()
  }, 350)
})

watch(fechaInicio, (inicio) => {
  if (!inicio) return
  if (!fechaFin.value || fechaFin.value < inicio) {
    fechaFin.value = addDaysIso(inicio, 14)
  }
})

watch(
  () => props.idAlmacen,
  () => {
    if (tipo.value) syncFilters()
  },
)

let origenTimeout: ReturnType<typeof setTimeout> | undefined
watch(
  [
    escenarioGas,
    producto,
    capacidad,
    cantidad,
    idBalonPreferido,
    () => props.idAlmacen,
    () => props.linea?.idBalonOrigen,
  ],
  () => {
    if (origenTimeout) clearTimeout(origenTimeout)
    origenTimeout = setTimeout(() => {
      void refrescarOrigenesRecarga()
    }, 250)
  },
)
</script>
