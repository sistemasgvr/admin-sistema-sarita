<template>
  <div>
    <div v-if="isEdit && loadingDetail" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando...
    </div>

    <form v-else id="compra-form" class="space-y-5" autocomplete="off" @submit.prevent="onSubmit">
      <FormCardsLayout>
        <!-- CREATE -->
        <template v-if="!isEdit">
          <DetailSectionCard title="Proveedor" :icon="ICONS.building2" :full-width="true">
            <div
              v-if="props.referenciaCompraId"
              class="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
            >
              <template v-if="referenciaQuery.isFetching.value">
                Cargando datos de la compra anulada...
              </template>
              <template v-else>
                Esta compra corrige a la compra anulada
                <span class="font-medium"   
                  >{{ referenciaCabecera?.serie ?? '—' }}-{{ referenciaCabecera?.numero ?? '—' }}</span
                >. Los campos y líneas se prellenaron; ajústalos según corresponda.
              </template>
            </div>

            <AppSelectWithCreate
              :can-create="canCreateProveedor"
              create-title="Nuevo proveedor"
              :disabled="saving"
              @create="proveedorModalOpen = true"
            >
              <AppSelectSearch
                v-model="idProveedor"
                v-model:search="proveedorBuscar"
                label="Proveedor"
                placeholder="Buscar y seleccionar"
                search-placeholder="Nombre o documento..."
                required
                v-bind="idProveedorAttrs"
                :options="proveedorOptions"
                :loading="proveedoresLoading"
                :disabled="saving"
                :error="errors.idProveedor"
              />
            </AppSelectWithCreate>
          </DetailSectionCard>

          <DetailSectionCard title="Comprobante" :icon="ICONS.receipt" :full-width="true">
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <AppInput
                v-model="fecha"
                label="Fecha"
                type="date"
                required
                v-bind="fechaAttrs"
                :disabled="saving"
                :error="errors.fecha"
              />
              <AppSelect
                v-model="idTipoComprobante"
                label="Tipo comprobante"
                placeholder="Seleccionar"
                required
                v-bind="idTipoComprobanteAttrs"
                :options="tipoComprobanteOptions"
                :disabled="saving"
                :error="errors.idTipoComprobante"
              />
              <AppInput
                v-model="serie"
                label="Serie"
                placeholder="F001"
                required
                v-bind="serieAttrs"
                :disabled="saving"
                :error="errors.serie"
              />
              <AppInput
                v-model="numero"
                label="Número"
                placeholder="00001234"
                required
                v-bind="numeroAttrs"
                :disabled="saving"
                :error="errors.numero"
              />
            </div>
          </DetailSectionCard>


          <DetailSectionCard title="Clasificación y ubicación" :icon="ICONS.layers" :full-width="true">
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <AppSelect
                v-model="idTipoRegistro"
                label="Tipo registro"
                placeholder="Seleccionar"
                required
                v-bind="idTipoRegistroAttrs"
                :options="tipoRegistroOptions"
                :disabled="saving"
                :error="errors.idTipoRegistro"
              />
              <AppSelect
                v-model="idCategoriaGasto"
                label="Categoría gasto"
                placeholder="Seleccionar"
                required
                v-bind="idCategoriaGastoAttrs"
                :options="categoriaGastoOptions"
                :disabled="saving"
                :error="errors.idCategoriaGasto"
              />
              <AppSelectSearch
                v-model="idAlmacen"
                label="Almacén"
                placeholder="Seleccionar"
                required
                v-bind="idAlmacenAttrs"
                :options="almacenOptions"
                :loading="almacenesQuery.isFetching.value"
                :disabled="saving"
                :error="errors.idAlmacen"
              />
              <AppSelectSearch
                v-model="idSucursal"
                label="Sucursal"
                placeholder="Seleccionar"
                :options="sucursalOptions"
                :loading="sucursalesQuery.isFetching.value"
                :disabled="saving"
              />
              <AppSelect
                v-model="idMoneda"
                label="Moneda"
                placeholder="Seleccionar"
                required
                v-bind="idMonedaAttrs"
                :options="monedaOptions"
                :disabled="saving"
                :error="errors.idMoneda"
              />
              <AppSelectSearch
                v-model="idCondicionPago"
                label="Condición pago"
                placeholder="Seleccionar"
                :options="condicionPagoOptions"
                :loading="condicionesQuery.isFetching.value"
                :disabled="saving"
              />
            </div>
          </DetailSectionCard>

          <DetailSectionCard title="Observaciones" :icon="ICONS.fileText" :full-width="true">
            <AppTextarea v-model="glosa" label="Glosa" placeholder="Opcional" :disabled="saving" />
            <AppCheckbox
              v-model="declararSunat"
              label="Declarar SUNAT"
              :disabled="saving"
              class="mt-4"
            />
          </DetailSectionCard>

          <DetailSectionCard
            title="Recarga en planta externa"
            :icon="ICONS.cylinder"
            :full-width="true"
            help="Opcional. Vincula esta factura al costo de una orden de planta externa. Las líneas de gas se agrupan por producto para ponerles precio; el gas no ingresa a stock de productos (el inventario físico es el cilindro al retornar)."
          >
            <AppSelectSearch
              v-model="idRecargaPlanta"
              label="Orden de recarga"
              :placeholder="idProveedor ? 'Selecciona una orden (opcional)' : 'Selecciona el proveedor primero'"
              search-placeholder="Número de orden..."
              :options="recargaPlantaOptions"
              :loading="recargaPlantaQuery.isFetching.value"
              :disabled="saving || !idProveedor"
            />

            <template v-if="idRecargaPlantaNum">
              <AppCheckbox
                v-model="guardarBalonesAlmacen"
                label="Guardar los balones en el almacén y sucursal seleccionados"
                :disabled="saving"
                class="mt-3"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Márcalo solo si los cilindros ya llegaron. Registra el retorno físico (En almacén /
                Lleno). Si aún están en planta, deja sin marcar: la factura queda vinculada y el
                retorno se completa desde Recargas / planta.
              </p>

              <div
                v-if="guardarBalonesAlmacen"
                class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
              >
                Al guardar, los cilindros de la orden pasarán a
                <strong>En almacén / Lleno</strong> (fecha de llegada = fecha de la compra). Esto no
                crea stock de producto de gas; solo actualiza el libro de cilindros.
              </div>
            </template>

            <div v-if="recargaPlantaBalones.length" class="mt-4">
              <p class="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                Balones vacíos de esta orden ({{ recargaPlantaBalones.length }})
              </p>
              <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <div class="overflow-x-auto">
                  <table class="min-w-full text-sm">
                    <thead class="bg-gray-50 dark:bg-white/5">
                      <tr>
                        <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                          Balón
                        </th>
                        <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                          Producto
                        </th>
                        <th class="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                          Capacidad
                        </th>
                        <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="balon in recargaPlantaBalones"
                        :key="balon.id"
                        class="border-t border-gray-100 dark:border-gray-800"
                      >
                        <td class="px-3 py-2 font-medium text-gray-800 dark:text-white/90">
                          {{ balon.codigo_balon ?? '—' }}
                        </td>
                        <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                          {{
                            balon.codigo_producto
                              ? `${balon.codigo_producto} - ${balon.nombre_producto ?? ''}`
                              : (balon.nombre_producto ?? '—')
                          }}
                        </td>
                        <td class="px-3 py-2 text-right tabular-nums">{{ balon.capacidad ?? '—' }}</td>
                        <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                          {{ balon.nombre_estado_balon ?? '—' }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                La cantidad de cada gas en el detalle de productos de abajo es la suma de la capacidad de
                estos balones agrupada por producto — no es una línea por balón.
              </p>
            </div>
            <p
              v-else-if="idRecargaPlantaNum && recargaPlantaDetalleQuery.isFetching.value"
              class="mt-3 text-xs text-gray-500 dark:text-gray-400"
            >
              Cargando balones de la orden...
            </p>
          </DetailSectionCard>

          <DetailSectionCard
            title="Detalle de productos (opcional)"
            :icon="ICONS.clipboardList"
            :full-width="true"
            help="Opcional: puedes registrar la compra sin líneas y agregarlas después. Al seleccionar un producto se agrega una fila editable. La cantidad se valida según la U.M. (UNID = solo enteros)."
          >
            <template #actions>
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
                {{ lineas.length }} {{ lineas.length === 1 ? 'ítem' : 'ítems' }}
              </span>
            </template>

            <div class="mb-3">
              <CompraProductoField
                v-model="lineaIdProducto"
                v-model:search="lineaProductoBuscar"
                label="Agregar producto"
                placeholder="Buscar y agregar al detalle"
                :options="productoOptions"
                :loading="productosQuery.isFetching.value"
                :disabled="saving"
                @created="onProductoCreado"
              />
            </div>

            <div
              v-if="lineas.length === 0"
              class="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
            >
              Busca un producto arriba para agregarlo al detalle.
            </div>

            <div
              v-else
              class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
            >
              <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                  <thead class="bg-gray-50 dark:bg-white/5">
                    <tr>
                      <th class="px-3 py-2.5 text-left font-medium text-gray-600 dark:text-gray-300">
                        Producto
                      </th>
                      <th class="w-28 px-3 py-2.5 text-right font-medium text-gray-600 dark:text-gray-300">
                        Cant.
                      </th>
                      <th class="w-32 px-3 py-2.5 text-right font-medium text-gray-600 dark:text-gray-300">
                        P. unit. (IGV)
                      </th>
                      <th class="w-28 px-3 py-2.5 text-right font-medium text-gray-600 dark:text-gray-300">
                        Importe
                      </th>
                      <th class="w-12 px-2 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(lin, index) in lineas"
                      :key="lin.key"
                      class="border-t border-gray-100 dark:border-gray-800"
                    >
                      <td class="px-3 py-2.5">
                        <p class="font-medium text-gray-800 dark:text-white/90">{{ lin.productoLabel }}</p>
                        <div class="mt-1 flex flex-wrap items-center gap-1.5">
                          <span
                            v-if="lin.nombreUnidadMedida"
                            class="text-xs text-gray-500 dark:text-gray-400"
                          >
                            {{ lin.nombreUnidadMedida }}
                          </span>
                          <AppBadge
                            v-if="lin.afectaStock"
                            size="sm"
                            variant="light"
                            color="primary"
                          >
                            Ingresa stock
                          </AppBadge>
                          <AppBadge v-else size="sm" variant="light" color="neutral">
                            Sin stock
                          </AppBadge>
                        </div>
                      </td>
                      <td class="px-3 py-2.5">
                        <CantidadUnidadInput
                          :ref="(el) => setCantidadRef(lin.key, el)"
                          v-model="lin.cantidad"
                          :name="`compra-cantidad-${lin.key}`"
                          :nombre-unidad="lin.nombreUnidadMedida"
                          :es-gas="lin.esGas"
                          :disabled="saving"
                        />
                      </td>
                      <td class="px-3 py-2.5">
                        <input
                          v-model.number="lin.precioUnitario"
                          type="number"
                          :min="NUMBER_MIN.money"
                          :step="NUMBER_STEP.money"
                          class="w-full rounded-lg border border-gray-300 bg-transparent px-2 py-1.5 text-right tabular-nums focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700"
                          :disabled="saving"
                          aria-label="Precio unitario"
                        />
                      </td>
                      <td
                        class="px-3 py-2.5 text-right tabular-nums font-medium text-gray-800 dark:text-white/90"
                      >
                        {{ formatMoney((Number(lin.precioUnitario) || 0) * Number(lin.cantidad)) }}
                      </td>
                      <td class="px-2 py-2.5 text-center">
                        <button
                          type="button"
                          title="Quitar producto"
                          class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-error-50 hover:text-error-500 disabled:opacity-40 dark:hover:bg-error-500/10"
                          :disabled="saving"
                          @click="lineas.splice(index, 1)"
                        >
                          <AppIcon :name="ICONS.trash" :size="15" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                class="grid grid-cols-3 gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/3"
              >
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Sub total</p>
                  <p class="font-semibold text-gray-800 dark:text-white/90">
                    {{ formatMoney(totalesDetalle.valorVenta) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">IGV (18%)</p>
                  <p class="font-semibold text-gray-800 dark:text-white/90">
                    {{ formatMoney(totalesDetalle.igv) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Total</p>
                  <p class="font-semibold text-gray-800 dark:text-white/90">
                    {{ formatMoney(totalesDetalle.total) }}
                  </p>
                </div>
              </div>
            </div>
          </DetailSectionCard>
        
        </template>
        <!-- EDIT -->
        <template v-else>
          <DetailSectionCard title="Datos de la compra" :icon="ICONS.receipt" :full-width="true">
            <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">Proveedor</p>
                <p class="font-medium text-gray-800 dark:text-white/90">{{ cabecera?.proveedor ?? '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">Comprobante</p>
                <p class="font-medium text-gray-800 dark:text-white/90">
                  {{ cabecera?.serie ?? '—' }}-{{ cabecera?.numero ?? '—' }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">Fecha</p>
                <p class="font-medium text-gray-800 dark:text-white/90">{{ cabecera?.fecha ?? '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">Almacén</p>
                <p class="font-medium text-gray-800 dark:text-white/90">{{ cabecera?.almacen ?? '—' }}</p>
              </div>
            </div>
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <AppSelect
                v-model="idCategoriaGasto"
                label="Categoría gasto"
                placeholder="Seleccionar"
                :options="categoriaGastoOptions"
                :disabled="saving"
              />
              <AppSelectSearch
                v-model="idCondicionPago"
                label="Condición pago"
                placeholder="Seleccionar"
                :options="condicionPagoOptions"
                :loading="condicionesQuery.isFetching.value"
                :disabled="saving"
              />
            </div>
            <AppTextarea v-model="glosa" label="Glosa" placeholder="Opcional" :disabled="saving" class="mt-5" />
            <AppCheckbox
              v-model="declararSunat"
              label="Declarar SUNAT"
              :disabled="saving"
              class="mt-4"
            />
          </DetailSectionCard>

          <RecargaPlantaBalonesCard
            :id-recarga-planta="cabecera?.id_recarga_planta ?? null"
            :numero="cabecera?.numero_recarga_planta"
          />

          <DetailSectionCard
            title="Detalle de productos"
            :icon="ICONS.clipboardList"
            :full-width="true"
            help="Puedes editar cantidad y precio en cada fila. La cantidad se valida según la U.M. (UNID = solo enteros)."
          >
            <div
              v-if="puedeModificar"
              class="mb-3"
            >
              <CompraProductoField
                v-model="lineaIdProducto"
                v-model:search="lineaProductoBuscar"
                label="Agregar producto"
                placeholder="Buscar y agregar al detalle"
                :options="productoOptions"
                :loading="productosQuery.isFetching.value"
                :disabled="saving"
                @created="onProductoCreado"
              />
            </div>

            <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                  <thead class="bg-gray-50 dark:bg-white/5">
                    <tr>
                      <th class="px-3 py-2.5 text-left font-medium text-gray-600 dark:text-gray-300">
                        Producto
                      </th>
                      <th class="px-3 py-2.5 text-left font-medium text-gray-600 dark:text-gray-300">
                        Almacén
                      </th>
                      <th class="w-28 px-3 py-2.5 text-right font-medium text-gray-600 dark:text-gray-300">
                        Cant.
                      </th>
                      <th class="w-32 px-3 py-2.5 text-right font-medium text-gray-600 dark:text-gray-300">
                        P. unit. (IGV)
                      </th>
                      <th class="w-28 px-3 py-2.5 text-right font-medium text-gray-600 dark:text-gray-300">
                        Importe
                      </th>
                      <th v-if="puedeModificar" class="w-20 px-2 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="det in lineasExistentes"
                      :key="det.id"
                      class="border-t border-gray-100 dark:border-gray-800"
                    >
                      <td class="px-3 py-2.5">
                        <p class="font-medium text-gray-800 dark:text-white/90">
                          {{ det.nombre_producto ?? det.descripcion }}
                        </p>
                        <div class="mt-1 flex flex-wrap items-center gap-1.5">
                          <span
                            v-if="det.unidad_medida"
                            class="text-xs text-gray-500 dark:text-gray-400"
                          >
                            {{ det.unidad_medida }}
                          </span>
                          <AppBadge
                            v-if="det.afecta_stock"
                            size="sm"
                            variant="light"
                            color="primary"
                          >
                            Ingresa stock
                          </AppBadge>
                          <AppBadge v-else size="sm" variant="light" color="neutral">
                            Sin stock
                          </AppBadge>
                        </div>
                      </td>
                      <td class="px-3 py-2.5 text-gray-600 dark:text-gray-400">
                        {{ det.almacen ?? '—' }}
                      </td>
                      <td class="px-3 py-2.5">
                        <template v-if="puedeModificar && lineasDraft[det.id]">
                          <CantidadUnidadInput
                            :ref="(el) => setCantidadRef(`edit-${det.id}`, el)"
                            v-model="lineasDraft[det.id].cantidad"
                            :name="`compra-edit-cantidad-${det.id}`"
                            :nombre-unidad="det.unidad_medida"
                            :disabled="saving || lineaGuardando === det.id"
                          />
                        </template>
                        <span v-else class="tabular-nums">{{ det.cantidad }}</span>
                      </td>
                      <td class="px-3 py-2.5">
                        <template v-if="puedeModificar && lineasDraft[det.id]">
                          <input
                            v-model.number="lineasDraft[det.id].precio"
                            type="number"
                            :min="NUMBER_MIN.money"
                            :step="NUMBER_STEP.money"
                            class="w-full rounded-lg border border-gray-300 bg-transparent px-2 py-1.5 text-right tabular-nums focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700"
                            :disabled="saving || lineaGuardando === det.id"
                            aria-label="Precio unitario"
                          />
                        </template>
                        <span v-else class="tabular-nums">
                          {{ det.precio_unitario != null ? formatMoney(det.precio_unitario) : '—' }}
                        </span>
                      </td>
                      <td
                        class="px-3 py-2.5 text-right tabular-nums font-medium text-gray-800 dark:text-white/90"
                      >
                        {{
                          formatMoney(
                            (Number(lineasDraft[det.id]?.precio ?? det.precio_unitario) || 0) *
                              Number(lineasDraft[det.id]?.cantidad ?? det.cantidad),
                          )
                        }}
                      </td>
                      <td v-if="puedeModificar" class="px-2 py-2.5 text-center">
                        <div class="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            class="text-xs font-medium text-brand-600 hover:underline disabled:opacity-50"
                            :disabled="saving || lineaGuardando === det.id || !lineaDraftCambiada(det)"
                            @click="guardarLinea(det)"
                          >
                            {{ lineaGuardando === det.id ? '...' : 'Aplicar' }}
                          </button>
                          <button
                            type="button"
                            title="Quitar"
                            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-error-50 hover:text-error-500 disabled:opacity-40 dark:hover:bg-error-500/10"
                            :disabled="saving || lineaEliminando === det.id || lineaGuardando === det.id"
                            @click="eliminarLinea(det.id)"
                          >
                            <AppIcon :name="ICONS.trash" :size="15" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </DetailSectionCard>
        </template>
      </FormCardsLayout>

      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/3 sm:w-auto"
          :disabled="saving"
          @click="emit('cancel')"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          :disabled="saving || (isEdit && loadingDetail)"
        >
          {{ saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar compra' }}
        </button>
      </div>
    </form>

    <ClienteFormModal
      v-model="proveedorModalOpen"
      mode="create"
      create-title="Nuevo proveedor"
      create-subtitle="Registra el proveedor para usarlo en esta compra."
      :default-id-tipo-cliente="TipoClienteIds.PROVEEDOR"
      @saved="onProveedorCreado"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch, type ComponentPublicInstance } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useCompraQuery } from '@/modules/compras/composables/useComprasQuery'
import {
  useActualizarCabeceraMutation,
  useActualizarDetalleMutation,
  useCreateCompraMutation,
  useCrearDetalleMutation,
  useEliminarDetalleMutation,
} from '@/modules/compras/composables/useCompraMutations'
import type {
  CompraDetalle,
  CompraFormMode,
  CompraLineaForm,
} from '@/modules/compras/interfaces/compra.interface'
import CompraProductoField from '@/modules/compras/components/CompraProductoField.vue'
import RecargaPlantaBalonesCard from '@/modules/compras/components/ResumenRecarga.vue'
import ClienteFormModal from '@/modules/clientes/components/ClienteFormModal.vue'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import type { Cliente, ClienteListFilters } from '@/modules/clientes/interfaces/cliente.interface'
import { getClienteOptionLabel } from '@/modules/clientes/utils/clienteNombre'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useSucursalesQuery } from '@/modules/configuracion/sucursales/composables/useSucursalesQuery'
import { useCondicionesPagoQuery } from '@/modules/configuracion/condiciones-pago/composables/useCondicionesPagoQuery'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import {
  useRecargaPlantaQuery,
  useRecargasPlantaQuery,
} from '@/modules/balones/recargas/composables/useRecargasPlantaQuery'
import type {
  RecargaPlantaDetalle,
  RecargaPlantaListFilters,
} from '@/modules/balones/recargas/interfaces/recarga-planta.interface'
import CantidadUnidadInput from '@/modules/ventas/comprobantes/components/CantidadUnidadInput.vue'
import { calcularTotalesDesdeImporte } from '@/modules/ventas/comprobantes/composables/usePosComprobanteForm'
import {
  unidadRequiereCantidadEntera,
  validarCantidadSegunUnidad,
} from '@/shared/utils/unidadMedidaCantidad'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { ListaIds, TipoClienteIds } from '@/shared/constants/lista-ids'
import { NUMBER_MIN, NUMBER_STEP } from '@/shared/constants/number-input'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import {
  AppBadge,
  AppCheckbox,
  AppInput,
  AppSelect,
  AppSelectSearch,
  AppSelectWithCreate,
  AppTextarea,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { optionalString } from '@/shared/validation'
import { toastSuccess, toastWarning } from '@/shared/composables/useToast'
import { formatListDate } from '@/shared/utils/date'
import type { SelectOption } from '@/shared/interfaces/form.interface'

const props = withDefaults(
  defineProps<{
    mode: CompraFormMode
    compraId?: number | null
    referenciaCompraId?: number | null
    active?: boolean
  }>(),
  {
    compraId: null,
    referenciaCompraId: null,
    active: true,
  },
)

const emit = defineEmits<{
  saved: [id: number]
  cancel: []
}>()

const authStore = useAuthStore()
const createMutation = useCreateCompraMutation()
const updateCabeceraMutation = useActualizarCabeceraMutation()
const crearDetalleMutation = useCrearDetalleMutation()
const actualizarDetalleMutation = useActualizarDetalleMutation()
const eliminarDetalleMutation = useEliminarDetalleMutation()

const isEdit = computed(() => props.mode === 'edit' && Boolean(props.compraId))
const canCreateProveedor = computed(() => authStore.hasPermission(PermisoBanderas.CLIENTES_CREAR))
const proveedorModalOpen = ref(false)
const proveedorCreadoOption = ref<SelectOption | null>(null)

const editId = computed(() =>
  props.active && isEdit.value ? (props.compraId as number) : null,
)
const detailQuery = useCompraQuery(editId)
const compraData = computed(() => detailQuery.data.value)
const cabecera = computed(() => compraData.value?.cabecera ?? null)
const puedeModificar = computed(() => cabecera.value?.puede_modificarse_parcial ?? false)
const loadingDetail = computed(() => detailQuery.isFetching.value)

const referenciaId = computed(() =>
  props.active && !isEdit.value && props.referenciaCompraId ? props.referenciaCompraId : null,
)
const referenciaQuery = useCompraQuery(referenciaId)
const referenciaCabecera = computed(() => referenciaQuery.data.value?.cabecera ?? null)

const saving = computed(
  () =>
    createMutation.isPending.value ||
    updateCabeceraMutation.isPending.value ||
    crearDetalleMutation.isPending.value ||
    actualizarDetalleMutation.isPending.value ||
    eliminarDetalleMutation.isPending.value,
)

const requiredOnCreate = (label: string) =>
  yup
    .mixed<string | number>()
    .test('required-on-create', `${label} es obligatorio`, (value) =>
      isEdit.value || (value !== '' && value != null),
    )

const requiredDateOnCreate = () =>
  yup
    .string()
    .test('required-on-create', 'La fecha es obligatoria', (value) => isEdit.value || Boolean(value))

const today = () => new Date().toISOString().slice(0, 10)

const { defineField, handleSubmit, resetForm, errors } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      fecha: requiredDateOnCreate(),
      serie: requiredOnCreate('La serie'),
      numero: requiredOnCreate('El número'),
      idProveedor: requiredOnCreate('El proveedor'),
      idRecargaPlanta: yup.mixed<string | number>().optional(),
      guardarBalonesAlmacen: yup.boolean().default(false),
      idAlmacen: requiredOnCreate('El almacén'),
      idTipoComprobante: requiredOnCreate('El tipo de comprobante'),
      idTipoRegistro: requiredOnCreate('El tipo de registro'),
      idCategoriaGasto: requiredOnCreate('La categoría de gasto'),
      idSucursal: yup.mixed<string | number>().optional(),
      idMoneda: requiredOnCreate('La moneda'),
      idCondicionPago: yup.mixed<string | number>().optional(),
      glosa: optionalString(),
      declararSunat: yup.boolean().default(false),
    }),
  ),
  initialValues: {
    fecha: today(),
    serie: '',
    numero: '',
    idProveedor: '' as string | number,
    idRecargaPlanta: '' as string | number,
    guardarBalonesAlmacen: false,
    idAlmacen: '' as string | number,
    idTipoComprobante: '' as string | number,
    idTipoRegistro: '' as string | number,
    idCategoriaGasto: '' as string | number,
    idSucursal: '' as string | number,
    idMoneda: '' as string | number,
    idCondicionPago: '' as string | number,
    glosa: '',
    declararSunat: false,
  },
})

const [fecha, fechaAttrs] = defineField('fecha')
const [serie, serieAttrs] = defineField('serie')
const [numero, numeroAttrs] = defineField('numero')
const [idProveedor, idProveedorAttrs] = defineField('idProveedor')
const [idRecargaPlanta] = defineField('idRecargaPlanta')
const [guardarBalonesAlmacen] = defineField('guardarBalonesAlmacen')
const [idAlmacen, idAlmacenAttrs] = defineField('idAlmacen')
const [idTipoComprobante, idTipoComprobanteAttrs] = defineField('idTipoComprobante')
const [idTipoRegistro, idTipoRegistroAttrs] = defineField('idTipoRegistro')
const [idCategoriaGasto, idCategoriaGastoAttrs] = defineField('idCategoriaGasto')
const [idSucursal] = defineField('idSucursal')
const [idMoneda, idMonedaAttrs] = defineField('idMoneda')
const [idCondicionPago] = defineField('idCondicionPago')
const [glosa] = defineField('glosa')
const [declararSunat] = defineField('declararSunat')

const lineas = reactive<CompraLineaForm[]>([])
const lineasExistentes = computed(() => compraData.value?.detalle ?? [])

const lineaEliminando = ref<number | null>(null)
const lineaGuardando = ref<number | null>(null)
const lineasDraft = reactive<Record<number, { cantidad: number; precio: number }>>({})

type CantidadInputExpose = {
  validate: () => Promise<{ valid: boolean }>
}

const cantidadInputRefs = new Map<string, CantidadInputExpose>()

function setCantidadRef(key: string, el: unknown) {
  if (!el) {
    cantidadInputRefs.delete(key)
    return
  }
  const exposed = el as ComponentPublicInstance & CantidadInputExpose
  if (typeof exposed.validate === 'function') {
    cantidadInputRefs.set(key, exposed)
  }
}

async function validarCantidadesVeeValidate(): Promise<boolean> {
  const results = await Promise.all(
    [...cantidadInputRefs.values()].map((input) => input.validate()),
  )
  return results.every((result) => result.valid)
}

const tipoComprobanteQuery = useListaOpcionesQuery(computed(() => ListaIds.TIPO_COMPROBANTE))
const tipoRegistroQuery = useListaOpcionesQuery(computed(() => ListaIds.TIPO_REGISTRO))
const categoriaGastoQuery = useListaOpcionesQuery(computed(() => ListaIds.CATEGORIA_GASTO))
const monedaQuery = useListaOpcionesQuery(computed(() => ListaIds.MONEDA))

const tipoComprobanteOptions = computed(() => toSelectOptions(tipoComprobanteQuery.data.value))
const tipoRegistroOptions = computed(() => toSelectOptions(tipoRegistroQuery.data.value))
const categoriaGastoOptions = computed(() => toSelectOptions(categoriaGastoQuery.data.value))
const monedaOptions = computed(() => toSelectOptions(monedaQuery.data.value))

const proveedorBuscar = ref('')
const proveedoresFiltersBase: ClienteListFilters = { pagina: 1, limite: 50, soloActivos: 1 }
const proveedoresFilters = ref<ClienteListFilters>({
  ...proveedoresFiltersBase,
  idTipoCliente: TipoClienteIds.PROVEEDOR,
})
const clienteProveedoresFilters = ref<ClienteListFilters>({
  ...proveedoresFiltersBase,
  idTipoCliente: TipoClienteIds.CLIENTE_PROVEEDOR,
})
const proveedoresQuery = useClientesQuery(proveedoresFilters)
const clienteProveedoresQuery = useClientesQuery(clienteProveedoresFilters)
let proveedorBuscarTimeout: ReturnType<typeof setTimeout> | undefined
watch(proveedorBuscar, (v) => {
  clearTimeout(proveedorBuscarTimeout)
  proveedorBuscarTimeout = setTimeout(() => {
    const buscar = v.trim() || undefined
    proveedoresFilters.value = { ...proveedoresFilters.value, buscar }
    clienteProveedoresFilters.value = { ...clienteProveedoresFilters.value, buscar }
  }, 350)
})
const proveedoresLoading = computed(
  () => proveedoresQuery.isFetching.value || clienteProveedoresQuery.isFetching.value,
)
const proveedorOptions = computed(() => {
  const base = [
    ...(proveedoresQuery.data.value?.data ?? []),
    ...(clienteProveedoresQuery.data.value?.data ?? []),
  ].map((c) => ({ value: c.id, label: getClienteOptionLabel(c) }))
  if (!proveedorCreadoOption.value) return base
  if (base.some((opt) => String(opt.value) === String(proveedorCreadoOption.value!.value))) {
    return base
  }
  return [proveedorCreadoOption.value, ...base]
})


const recargaPlantaFilters = ref<RecargaPlantaListFilters>({ pagina: 1, limite: 50 })
const recargaPlantaQuery = useRecargasPlantaQuery(recargaPlantaFilters)
const recargaPlantaOptions = computed(() =>
  (recargaPlantaQuery.data.value?.data ?? []).map((rp) => {
    const numero = rp.numero || `RP-${rp.id}`
    const cilindros = rp.total_cilindros ?? 0
    // Mismo criterio que valida com_crear_compra: ya vinculada a una
    // compra, o su estado ya es CERRADO -> no se puede volver a elegir.
    const yaCerrada = Boolean(rp.id_comprobante_compra) || rp.nombre_estado === 'CERRADO'
    return {
      value: rp.id,
      label: `${numero} · ${formatListDate(rp.fecha_salida)} · ${cilindros} cilindro${cilindros === 1 ? '' : 's'}`,
      disabled: yaCerrada,
      badges: yaCerrada ? [{ label: 'Cerrada / facturada', color: 'neutral' as const }] : undefined,
    }
  }),
)

const idRecargaPlantaNum = computed(() =>
  idRecargaPlanta.value !== '' && idRecargaPlanta.value != null ? Number(idRecargaPlanta.value) : null,
)
const recargaPlantaDetalleQuery = useRecargaPlantaQuery(idRecargaPlantaNum)
const recargaPlantaBalones = computed(() => recargaPlantaDetalleQuery.data.value?.detalles ?? [])

const suppressRecargaPlantaReset = ref(false)
watch(idProveedor, (id) => {
  const idNum = id !== '' && id != null ? Number(id) : undefined
  recargaPlantaFilters.value = { pagina: 1, limite: 50, idProveedor: idNum }
  if (suppressRecargaPlantaReset.value) return
  idRecargaPlanta.value = ''
  guardarBalonesAlmacen.value = false
})


const RECARGA_LINEA_PREFIX = 'recarga-planta-'
const recargaPlantaLineasSyncedFor = ref<number | null>(null)

function quitarLineasDeRecargaPlanta() {
  for (let i = lineas.length - 1; i >= 0; i--) {
    if (lineas[i].key.startsWith(RECARGA_LINEA_PREFIX)) {
      lineas.splice(i, 1)
    }
  }
}

function agregarLineasDesdeRecargaPlanta(detalles: RecargaPlantaDetalle[]) {
  quitarLineasDeRecargaPlanta()

  const grupos = new Map<number, CompraLineaForm>()
  for (const balon of detalles) {
    if (balon.id_producto == null) continue
    const cantidadBalon = Number(balon.capacidad) || 0
    if (cantidadBalon <= 0) continue

    const existente = grupos.get(balon.id_producto)
    if (existente) {
      existente.cantidad += cantidadBalon
      continue
    }

    grupos.set(balon.id_producto, {
      key: `${RECARGA_LINEA_PREFIX}${balon.id_producto}`,
      idProducto: balon.id_producto,
      productoLabel: balon.codigo_producto
        ? `${balon.codigo_producto} - ${balon.nombre_producto ?? ''}`
        : (balon.nombre_producto ?? `Producto ${balon.id_producto}`),
      cantidad: cantidadBalon,
      precioUnitario: 0,
      idUnidadMedida: balon.id_unidad_medida ?? null,
      nombreUnidadMedida: balon.nombre_unidad_medida ?? null,
      // Gas de planta: costo documental. No ingresa pro_stock (afecta_stock=false).
      afectaStock: false,
    })
  }

  lineas.push(...grupos.values())
  if (grupos.size > 0) {
    toastSuccess(
      `${grupos.size} línea${grupos.size === 1 ? '' : 's'} de gas agregada${grupos.size === 1 ? '' : 's'} (sin stock de producto). Completa el precio unitario.`,
    )
  }
}

// Se sincroniza una sola vez por orden seleccionada (no en cada refetch en
// segundo plano de la query, para no pisar ediciones de cantidad/precio que
// ya haya hecho el usuario sobre esas líneas).
watch(
  () => [idRecargaPlantaNum.value, recargaPlantaDetalleQuery.data.value] as const,
  ([id, data]) => {
    if (suppressRecargaPlantaReset.value) return

    if (!id) {
      quitarLineasDeRecargaPlanta()
      recargaPlantaLineasSyncedFor.value = null
      return
    }

    if (!data || data.id !== id) return
    if (recargaPlantaLineasSyncedFor.value === id) return

    recargaPlantaLineasSyncedFor.value = id
    agregarLineasDesdeRecargaPlanta(data.detalles ?? [])
  },
)

const almacenesFilters = ref({ pagina: 1, limite: 100 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)
const almacenOptions = computed(() => toSelectOptions(almacenesQuery.data.value?.data))

const sucursalesFilters = ref({ pagina: 1, limite: 100 })
const sucursalesQuery = useSucursalesQuery(sucursalesFilters)
const sucursalOptions = computed(() => toSelectOptions(sucursalesQuery.data.value?.data))

const condicionesFilters = ref({ pagina: 1, limite: 100 })
const condicionesQuery = useCondicionesPagoQuery(condicionesFilters)
const condicionPagoOptions = computed(() => toSelectOptions(condicionesQuery.data.value?.data))

const productosFilters = ref({
  pagina: 1,
  limite: 50,
  soloActivos: 1 as number,
  buscar: undefined as string | undefined,
})
const productosQuery = useProductosQuery(productosFilters)
const lineaIdProducto = ref<number | ''>('')
const lineaProductoBuscar = ref('')
let productoBuscarTimeout: ReturnType<typeof setTimeout> | undefined
watch(lineaProductoBuscar, (v) => {
  clearTimeout(productoBuscarTimeout)
  productoBuscarTimeout = setTimeout(() => {
    productosFilters.value = { ...productosFilters.value, buscar: v.trim() || undefined }
  }, 350)
})
const productoOptions = computed(() =>
  (productosQuery.data.value?.data ?? []).map((p) => ({
    value: p.id,
    label: `${p.codigo} - ${p.nombre}${p.afecta_stock ? ' · Ingresa stock' : ' · Sin stock'}`,
  })),
)

watch(
  lineasExistentes,
  (detalles) => {
    for (const det of detalles) {
      lineasDraft[det.id] = {
        cantidad: Number(det.cantidad),
        precio: Number(det.precio_unitario ?? 0),
      }
    }
  },
  { immediate: true, deep: true },
)

function lineaDraftCambiada(det: CompraDetalle) {
  const draft = lineasDraft[det.id]
  if (!draft) return false
  const precioOrig = det.precio_unitario == null ? 0 : Number(det.precio_unitario)
  return Number(draft.cantidad) !== Number(det.cantidad) || Number(draft.precio) !== precioOrig
}

async function guardarLinea(det: CompraDetalle) {
  const userId = authStore.user?.id
  const draft = lineasDraft[det.id]
  if (!userId || !draft) return

  const input = cantidadInputRefs.get(`edit-${det.id}`)
  if (input) {
    const result = await input.validate()
    if (!result.valid) {
      toastWarning('Corrige la cantidad según la unidad de medida')
      return
    }
  }

  const cantidad = Number(draft.cantidad)
  const errorCantidad = validarCantidadSegunUnidad(
    cantidad,
    det.unidad_medida,
    det.nombre_producto ?? det.descripcion,
  )
  if (errorCantidad) {
    toastWarning(errorCantidad)
    return
  }
  lineaGuardando.value = det.id
  try {
    await actualizarDetalleMutation.mutateAsync({
      idDetalle: det.id,
      payload: {
        idUsuarioAuditoria: userId,
        cantidad,
        precioUnitario: Number(draft.precio),
      },
    })
  } finally {
    lineaGuardando.value = null
  }
}

async function onProductoCreado(producto: Producto) {
  lineaProductoBuscar.value = producto.codigo
  productosFilters.value = { ...productosFilters.value, buscar: producto.codigo }
  await productosQuery.refetch()
  await agregarProducto(producto)
}

async function onProveedorCreado(cliente: Cliente) {
  proveedorCreadoOption.value = {
    value: cliente.id,
    label: getClienteOptionLabel(cliente),
  }
  idProveedor.value = cliente.id
  proveedorBuscar.value = getClienteOptionLabel(cliente)
  await Promise.all([proveedoresQuery.refetch(), clienteProveedoresQuery.refetch()])
}

watch(lineaIdProducto, (id) => {
  if (id === '' || id == null) return
  const selectedId = Number(id)
  lineaIdProducto.value = ''

  const producto = (productosQuery.data.value?.data ?? []).find((item) => item.id === selectedId)
  if (!producto) {
    toastWarning('No se pudo cargar el producto seleccionado. Intenta de nuevo.')
    return
  }
  void agregarProducto(producto)
})

async function agregarProducto(producto: Producto) {
  const unidad = producto.nombre_unidad_medida ?? null
  const esGas = Boolean(producto.es_gas)
  const incremento = unidadRequiereCantidadEntera(unidad, esGas) ? 1 : 0.01
  const precioDefault = Number(producto.precio_compra ?? producto.precio ?? 0)

  if (isEdit.value && props.compraId) {
    const userId = authStore.user?.id
    if (!userId) return
    await crearDetalleMutation.mutateAsync({
      id: props.compraId,
      payload: {
        idUsuarioAuditoria: userId,
        idProducto: producto.id,
        cantidad: 1,
        precioUnitario: precioDefault || undefined,
        idUnidadMedida: producto.id_unidad_medida,
      },
    })
    toastSuccess(`${producto.nombre} agregado`)
    return
  }

  const existente = lineas.find((linea) => linea.idProducto === producto.id)
  if (existente) {
    existente.cantidad = Math.max(incremento, Number(existente.cantidad || 0) + incremento)
    existente.nombreUnidadMedida = unidad ?? existente.nombreUnidadMedida
    existente.esGas = esGas
    toastSuccess(`${producto.nombre}: cantidad ${existente.cantidad}`)
    return
  }

  lineas.push({
    key: crypto.randomUUID(),
    idProducto: producto.id,
    cantidad: 1,
    precioUnitario: precioDefault,
    productoLabel: `${producto.codigo} - ${producto.nombre}`,
    idUnidadMedida: producto.id_unidad_medida ?? null,
    nombreUnidadMedida: unidad,
    esGas,
    afectaStock: Boolean(producto.afecta_stock),
  })
  toastSuccess(`${producto.nombre} agregado`)
}

async function eliminarLinea(idDetalle: number) {
  const userId = authStore.user?.id
  if (!userId) return
  lineaEliminando.value = idDetalle
  try {
    await eliminarDetalleMutation.mutateAsync({ idDetalle, idUsuarioAuditoria: userId })
  } finally {
    lineaEliminando.value = null
  }
}

const totalLineas = computed(() =>
  lineas.reduce((acc, lin) => acc + (Number(lin.precioUnitario) || 0) * Number(lin.cantidad), 0),
)
const totalesDetalle = computed(() => calcularTotalesDesdeImporte(totalLineas.value))

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function resetCreateForm() {
  resetForm({
    values: {
      fecha: today(),
      serie: '',
      numero: '',
      idProveedor: '',
      idRecargaPlanta: '',
      guardarBalonesAlmacen: false,
      idAlmacen: '',
      idTipoComprobante: '',
      idTipoRegistro: '',
      idCategoriaGasto: '',
      idSucursal: '',
      idMoneda: '',
      idCondicionPago: '',
      glosa: '',
      declararSunat: false,
    },
  })
  recargaPlantaFilters.value = { pagina: 1, limite: 50 }
  recargaPlantaLineasSyncedFor.value = null
  lineas.splice(0, lineas.length)
  proveedorBuscar.value = ''
  proveedorCreadoOption.value = null
  lineaProductoBuscar.value = ''
  lineaIdProducto.value = ''
}

async function prefillFromReferencia(data: NonNullable<typeof referenciaQuery.data.value>) {
  const c = data.cabecera

  suppressRecargaPlantaReset.value = true

  resetForm({
    values: {
      fecha: today(),
      serie: c.serie ?? '',
      numero: '',
      idProveedor: c.id_proveedor ?? '',
      idRecargaPlanta: c.id_recarga_planta ?? '',
      guardarBalonesAlmacen: false,
      idAlmacen: c.id_almacen ?? '',
      idTipoComprobante: c.id_tipo_comprobante ?? '',
      idTipoRegistro: c.id_tipo_registro ?? '',
      idCategoriaGasto: c.id_categoria_gasto ?? '',
      idSucursal: c.id_sucursal ?? '',
      idMoneda: c.id_moneda ?? '',
      idCondicionPago: c.id_condicion_pago ?? '',
      glosa: '',
      declararSunat: c.declarar_sunat,
    },
  })

  recargaPlantaFilters.value = {
    pagina: 1,
    limite: 50,
    idProveedor: c.id_proveedor ?? undefined,
  }

  recargaPlantaLineasSyncedFor.value = c.id_recarga_planta ?? null

  proveedorBuscar.value = c.proveedor ?? ''

  await nextTick()
  suppressRecargaPlantaReset.value = false

  lineas.splice(
    0,
    lineas.length,
    ...(data.detalle ?? [])
      .filter((d) => d.id_producto != null)
      .map((d) => ({
        key: crypto.randomUUID(),
        idProducto: d.id_producto as number,
        cantidad: Number(d.cantidad),
        precioUnitario: Number(d.precio_unitario ?? 0),
        productoLabel: d.codigo_producto
          ? `${d.codigo_producto} - ${d.nombre_producto ?? ''}`
          : (d.nombre_producto ?? d.descripcion),
        idUnidadMedida: d.id_unidad_medida ?? null,
        nombreUnidadMedida: d.unidad_medida ?? null,
        afectaStock: Boolean(d.afecta_stock),
      })),
  )
}

watch(
  () =>
    [props.active, isEdit.value, props.referenciaCompraId, referenciaQuery.data.value] as const,
  ([isActive, edit, refId, refData]) => {
    if (!isActive || edit) return

    if (!refId) {
      resetCreateForm()
      return
    }

    if (refData) {
      void prefillFromReferencia(refData)
    }
  },
  { immediate: true },
)

watch(
  () => detailQuery.data.value,
  (data) => {
    if (!data || !isEdit.value) return
    resetForm({
      values: {
        fecha: today(),
        serie: '',
        numero: '',
        idProveedor: '',
        idRecargaPlanta: '',
        guardarBalonesAlmacen: false,
        idAlmacen: '',
        idTipoComprobante: '',
        idTipoRegistro: '',
        idCategoriaGasto: data.cabecera.id_categoria_gasto ?? '',
        idSucursal: '',
        idMoneda: '',
        idCondicionPago: data.cabecera.id_condicion_pago ?? '',
        glosa: data.cabecera.glosa ?? '',
        declararSunat: data.cabecera.declarar_sunat,
      },
    })
  },
)

const onSubmit = handleSubmit(async (values) => {
  const userId = authStore.user?.id
  if (!userId) return

  const toOptionalNumber = (value: string | number | undefined) =>
    value !== '' && value != null ? Number(value) : undefined

  if (isEdit.value && props.compraId) {
    const updated = await updateCabeceraMutation.mutateAsync({
      id: props.compraId,
      payload: {
        idUsuarioAuditoria: userId,
        glosa: values.glosa?.trim() || undefined,
        idCondicionPago: toOptionalNumber(values.idCondicionPago),
        idCategoriaGasto: toOptionalNumber(values.idCategoriaGasto),
        declararSunat: values.declararSunat,
      },
    })
    emit('saved', updated.cabecera.id)
    return
  }


  const cantidadesOk = await validarCantidadesVeeValidate()
  if (!cantidadesOk) {
    toastWarning('Corrige las cantidades del detalle (UNID solo admite enteros)')
    return
  }

  for (const lin of lineas) {
    const errorCantidad = validarCantidadSegunUnidad(
      Number(lin.cantidad),
      lin.nombreUnidadMedida,
      lin.productoLabel,
      lin.esGas,
    )
    if (errorCantidad) {
      toastWarning(errorCantidad)
      return
    }
  }

  const detalles = lineas.map((l) => ({
    idProducto: l.idProducto,
    cantidad: Number(l.cantidad),
    precioUnitario: Number(l.precioUnitario) || undefined,
    idUnidadMedida: l.idUnidadMedida ?? undefined,
  }))

  const created = await createMutation.mutateAsync({
    idUsuarioAuditoria: userId,
    fecha: values.fecha as string,
    serie: String(values.serie ?? '').trim() || undefined,
    numero: String(values.numero ?? '').trim() || undefined,
    idProveedor: toOptionalNumber(values.idProveedor),
    idRecargaPlanta: toOptionalNumber(values.idRecargaPlanta),
    guardarBalonesAlmacen: toOptionalNumber(values.idRecargaPlanta) != null ? Boolean(values.guardarBalonesAlmacen) : undefined,
    idAlmacen: toOptionalNumber(values.idAlmacen),
    idTipoComprobante: toOptionalNumber(values.idTipoComprobante),
    idTipoRegistro: toOptionalNumber(values.idTipoRegistro),
    idCategoriaGasto: toOptionalNumber(values.idCategoriaGasto),
    idSucursal: toOptionalNumber(values.idSucursal),
    idMoneda: toOptionalNumber(values.idMoneda),
    idCondicionPago: toOptionalNumber(values.idCondicionPago),
    idComprobanteReferencia: props.referenciaCompraId ?? undefined,
    declararSunat: values.declararSunat,
    glosa: values.glosa?.trim() || undefined,
    detalles,
  })
  emit('saved', created.cabecera.id)
})
</script>
