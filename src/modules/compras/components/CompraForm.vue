<template>
  <div>
    <div v-if="isEdit && loadingDetail" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
      Cargando...
    </div>

    <form v-else id="compra-form" class="space-y-5" autocomplete="off" @submit.prevent="onSubmit">
      <FormCardsLayout>
        <!-- CREATE -->
        <!-- data-tutorial: anclas de la ruta guiada de Soporte (Gastos y Compras › registrar compra). -->
        <template v-if="!isEdit">
          <DetailSectionCard
            data-tutorial="compra-comprobante"
            title="Comprobante"
            :icon="ICONS.receipt"
            :full-width="true"
          >
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
              data-tutorial="compra-proveedor"
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

            <div data-tutorial="compra-documento" class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                help="Catálogo SUNAT 01: factura, boleta, recibo por honorarios, ticket, servicios públicos, etc."
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

            <div data-tutorial="compra-declarar-sunat" class="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <AppSwitch
                v-model="declararSunat"
                label="Declarar SUNAT"
                :help="DECLARAR_SUNAT_HELP"
                :disabled="saving"
              />
            </div>

            <AppTextarea
              v-model="glosa"
              label="Glosa"
              placeholder="Opcional"
              :disabled="saving"
              class="mt-5"
            />
          </DetailSectionCard>

          <DetailSectionCard
            data-tutorial="compra-clasificacion"
            title="Clasificación"
            :icon="ICONS.layers"
            :full-width="true"
          >
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
              <AppSelectWithCreate
                :can-create="canCrearCategoriaGasto"
                create-title="Nueva categoría de gasto"
                :disabled="saving"
                @create="categoriaGastoModalOpen = true"
              >
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
              </AppSelectWithCreate>
              <AppSelectSearch
                v-model="idAlmacen"
                label="Almacén"
                placeholder="Seleccionar"
                required
                help="El stock de los productos que ingresan (y de los cilindros al retornar de planta) se registra en este almacén."
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
                help="Sucursal a la que se atribuye la compra: sus ingresos de stock se reportan aquí y los pagos de su cuenta por pagar salen de la caja de esta sucursal."
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
                :help="CONDICION_PAGO_HELP"
                :options="condicionPagoOptions"
                :loading="condicionesQuery.isFetching.value"
                :disabled="saving"
              />
            </div>
            <CompraPagoPreview
              v-if="esPlanCuotas || esCreditoPago"
              class="mt-5"
              :modo="esPlanCuotas ? 'cuotas' : 'credito'"
              v-model:cuotas="cuotasPlan"
              v-model:fecha-vencimiento="fechaVencimientoCredito"
              v-model:dia-mes-pago="diaMesPagoEditable"
              :total="totalParaCuotas"
              :dias-credito="Number(condicionPagoSeleccionada?.dias_credito ?? 0)"
              :disabled="saving"
            />
          </DetailSectionCard>

          <DetailSectionCard
            data-tutorial="compra-recarga-externa"
            title="Recarga externa"
            :icon="ICONS.cylinder"
            :full-width="true"
            help="La compra puede ser de cualquier producto o gasto. Activa recarga externa solo si esta factura es el costo de una orden en planta."
          >
            <AppSwitch
              v-model="desdeRecargaExterna"
              label="A partir de recarga externa"
              help="Vincula la factura a una orden de planta. El gas entra al stock con el retorno de los cilindros, con las cantidades de esta factura."
              :disabled="saving"
            />

            <template v-if="desdeRecargaExterna">
            <div class="mt-5">
            <AppSelectSearch
              v-model="idRecargaPlanta"
              label="Orden de recarga"
              :placeholder="idProveedor ? 'Selecciona una orden' : 'Selecciona el proveedor primero'"
              search-placeholder="Número de orden..."
              :options="recargaPlantaOptions"
              :loading="recargaPlantaQuery.isFetching.value"
              :disabled="saving || !idProveedor"
              :error="errors.idRecargaPlanta"
            />
            </div>

            <template v-if="idRecargaPlantaNum">
              <!--
                Retorno ya registrado desde el documento de salida: los cilindros
                y el gas ya ingresaron. Volver a marcarlo aquí duplicaba el
                ingreso; ahora la factura solo se vincula a la orden.
              -->
              <div
                v-if="ordenYaRetorno"
                class="mt-3 flex items-start gap-2 rounded-lg border border-success-500/30 bg-success-50 px-3 py-2.5 text-xs text-gray-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-gray-300"
              >
                <AppIcon
                  :name="ICONS.check"
                  :size="14"
                  class="mt-0.5 shrink-0 text-success-600 dark:text-success-500"
                />
                <span>
                  Retorno registrado el
                  <strong class="font-semibold">{{ fechaRetornoOrdenLabel }}</strong>: los
                  cilindros ya están en almacén. Al guardar, esta factura queda vinculada a la
                  orden y el gas ingresado se ajusta a las cantidades que indiques en el detalle.
                </span>
              </div>

              <template v-else>
                <div class="mt-3 flex items-start gap-1.5">
                  <AppCheckbox
                    v-model="guardarBalonesAlmacen"
                    label="Registrar retorno de cilindros"
                    :disabled="saving"
                  />
                  <AppHelpTip
                    text="Márcalo si los cilindros ya llegaron: quedan disponibles en el almacén y el gas ingresa con las cantidades que indiques en el detalle. Si aún están en planta, déjalo apagado: la factura queda vinculada y el retorno se registra después desde el documento de salida."
                  />
                </div>

                <div
                  v-if="!guardarBalonesAlmacen"
                  class="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                >
                  <AppIcon :name="ICONS.alertTriangle" :size="14" class="mt-0.5 shrink-0" />
                  <span>
                    Mientras no marques el retorno, el gas de esta orden
                    <strong class="font-semibold">no entra al stock</strong>. La factura queda
                    vinculada; el retorno se registra acá o desde el documento de salida cuando
                    lleguen los cilindros, con las cantidades de esta compra.
                  </span>
                </div>

                <div v-if="guardarBalonesAlmacen" class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <AppInput
                    v-model="fechaLlegadaAlmacen"
                    label="Fecha llegada almacén"
                    type="date"
                    required
                    :disabled="saving"
                    :error="errors.fechaLlegadaAlmacen"
                  />
                </div>
              </template>

              <!--
                La GRE del proveedor es un dato de la factura, no del retorno:
                se puede tipear aunque el retorno ya esté registrado o aún no
                se marque. Se guarda en la orden como referencia.
              -->
              <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <AppInput
                  v-model="serieGuiaIngreso"
                  label="Serie GRE proveedor"
                  placeholder="T001"
                  help="Guía con la que el proveedor devuelve los cilindros; es referencial."
                  :disabled="saving"
                />

                <AppInput
                  v-model="numeroGuiaIngreso"
                  label="Número GRE proveedor"
                  placeholder="00000002"
                  :disabled="saving"
                />
              </div>

              <div class="mt-4">
                <p
                  class="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400"
                >
                  Cilindros de la orden
                </p>
                <CompraRecargaPlantaDetalle
                  :recarga="recargaPlantaDetalleQuery.data.value ?? null"
                  :loading="recargaPlantaDetalleQuery.isFetching.value"
                />
              </div>
            </template>
            </template>
          </DetailSectionCard>

          <DetailSectionCard
            data-tutorial="compra-detalle"
            :title="tituloDetalleProductos"
            :icon="ICONS.clipboardList"
            :full-width="true"
            :help="helpDetalleProductos"
          >
            <template #actions>
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
                {{ lineas.length }} {{ lineas.length === 1 ? 'ítem' : 'ítems' }}
              </span>
            </template>

            <div data-tutorial="compra-agregar-producto" class="mb-3">
              <CompraProductoField
                v-model="lineaIdProducto"
                v-model:search="lineaProductoBuscar"
                :label="
                  desdeRecargaExterna && idRecargaPlantaNum
                    ? 'Agregar otro producto (extras)'
                    : 'Agregar producto'
                "
                :placeholder="
                  desdeRecargaExterna && idRecargaPlantaNum
                    ? 'Buscar extras que no vienen de la orden'
                    : 'Buscar y agregar al detalle'
                "
                :options="productoOptions"
                :loading="productosQuery.isFetching.value"
                :disabled="saving"
                @created="onProductoCreado"
                @scanned="onProductoCreado"
              />
            </div>

            <!--
              Gas de la orden, en el mismo formato que "Productos según los balones"
              del documento de salida: un producto por gas derivado de los
              cilindros, con la capacidad total como referencia y un campo para
              lo que la planta realmente cargó. Esa cantidad es la que entra al
              stock al registrar el retorno; la capacidad solo pone el tope.
            -->
            <div v-if="desdeRecargaExterna && idRecargaPlantaNum" class="mb-4">
              <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p
                  class="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400"
                >
                  Gas que ingresa según los cilindros
                </p>
                <span class="text-[11px] text-gray-500 dark:text-gray-400">
                  {{
                    ordenYaRetorno
                      ? 'Lo facturado por cada gas; el stock ya entró con el retorno y se ajusta a estas cantidades.'
                      : 'Lo que cargó la planta por cada gas; entra al stock con el retorno.'
                  }}
                </span>
              </div>

              <div
                v-if="lineasRecarga.length === 0"
                class="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
              >
                <template v-if="recargaPlantaDetalleQuery.isFetching.value">
                  Cargando gases de la orden...
                </template>
                <template v-else>
                  Los cilindros de la orden no tienen gas asociado o capacidad. Asigna el gas en
                  la ficha del cilindro, o agrega el producto manualmente arriba.
                </template>
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
                        <th class="px-3 py-2.5 text-left font-medium text-gray-600 dark:text-gray-300">
                          Tipos que lo cargan
                        </th>
                        <th class="w-32 px-3 py-2.5 text-right font-medium text-gray-600 dark:text-gray-300">
                          Capacidad
                        </th>
                        <th class="w-36 px-3 py-2.5 text-right font-medium text-gray-600 dark:text-gray-300">
                          Ingresa
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
                        v-for="lin in lineasRecarga"
                        :key="lin.key"
                        class="border-t border-gray-100 align-top dark:border-gray-800"
                      >
                        <td class="px-3 py-2.5">
                          <p class="font-medium text-gray-800 dark:text-white/90">
                            {{ lin.productoLabel }}
                          </p>
                          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {{ lin.cilindrosRecarga ?? 0 }}
                            {{ lin.cilindrosRecarga === 1 ? 'cilindro' : 'cilindros' }}
                          </p>
                        </td>
                        <td class="px-3 py-2.5">
                          <div class="flex flex-wrap gap-1">
                            <AppBadge
                              v-for="tipo in lin.tiposRecarga ?? []"
                              :key="`${lin.key}-${tipo.nombre}`"
                              size="sm"
                              variant="light"
                              color="neutral"
                            >
                              {{ tipo.nombre }} ×{{ tipo.cantidad }}
                            </AppBadge>
                          </div>
                        </td>
                        <td
                          class="px-3 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300"
                        >
                          {{ formatCapacidadRecarga(lin) }}
                        </td>
                        <td class="px-3 py-2.5">
                          <CantidadUnidadInput
                            :ref="(el) => setCantidadRef(lin.key, el)"
                            v-model="lin.cantidad"
                            :name="`compra-cantidad-${lin.key}`"
                            :nombre-unidad="lin.nombreUnidadMedida"
                            es-gas
                            :disabled="saving"
                            :error="errorCantidadRecarga(lin)"
                          />
                        </td>
                        <td class="px-3 py-2.5">
                          <MoneyInput
                            v-model="precioNuevoInputs[lin.key]"
                            placeholder="0.00"
                            :disabled="saving"
                            :state="precioNuevoError(lin.key) ? 'error' : 'default'"
                            @blur="onBlurPrecioNuevo(lin.key)"
                          />
                        </td>
                        <td
                          class="px-3 py-2.5 text-right tabular-nums font-medium text-gray-800 dark:text-white/90"
                        >
                          {{ formatMoney(importeLinea(lin)) }}
                        </td>
                        <td class="px-2 py-2.5 text-center">
                          <button
                            type="button"
                            title="Quitar gas"
                            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-error-50 hover:text-error-500 disabled:opacity-40 dark:hover:bg-error-500/10"
                            :disabled="saving"
                            @click="quitarLineaNuevaPorKey(lin.key)"
                          >
                            <AppIcon :name="ICONS.trash" :size="15" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <p
              v-if="desdeRecargaExterna && idRecargaPlantaNum && lineasManuales.length"
              class="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400"
            >
              Otros productos
            </p>

            <div
              v-if="lineas.length === 0 && !(desdeRecargaExterna && idRecargaPlantaNum)"
              class="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
            >
              Busca un producto arriba para agregarlo al detalle.
            </div>

            <div
              v-if="lineasManuales.length"
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
                      v-for="lin in lineasManuales"
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
                          <AppBadge v-if="lin.esGas" size="sm" variant="light" color="primary">
                            Gas
                          </AppBadge>
                          <AppBadge v-if="lin.esServicio" size="sm" variant="light" color="neutral">
                            Servicio
                          </AppBadge>
                          <AppBadge v-if="lin.esAlquilable" size="sm" variant="light" color="warning">
                            Alquilable
                          </AppBadge>
                          <AppBadge v-if="lin.nombreCategoria" size="sm" variant="light" color="neutral">
                            {{ lin.nombreCategoria }}
                          </AppBadge>
                          <AppBadge v-if="lin.presentacion" size="sm" variant="light" color="neutral">
                            {{ lin.presentacion }}
                          </AppBadge>
                          <AppBadge v-if="lin.marca" size="sm" variant="light" color="neutral">
                            {{ lin.marca }}
                          </AppBadge>
                          <AppBadge v-if="lin.afectaStock" size="sm" variant="light" color="primary">
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
                        <MoneyInput
                          v-model="precioNuevoInputs[lin.key]"
                          placeholder="0.00"
                          :disabled="saving"
                          :state="precioNuevoError(lin.key) ? 'error' : 'default'"
                          @blur="onBlurPrecioNuevo(lin.key)"
                        />
                      </td>
                      <td
                        class="px-3 py-2.5 text-right tabular-nums font-medium text-gray-800 dark:text-white/90"
                      >
                        {{ formatMoney(importeLinea(lin)) }}
                      </td>
                      <td class="px-2 py-2.5 text-center">
                        <button
                          type="button"
                          title="Quitar producto"
                          class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-error-50 hover:text-error-500 disabled:opacity-40 dark:hover:bg-error-500/10"
                          :disabled="saving"
                          @click="quitarLineaNuevaPorKey(lin.key)"
                        >
                          <AppIcon :name="ICONS.trash" :size="15" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div
              v-if="lineas.length"
              class="mt-3 grid grid-cols-3 gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/3"
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
              <AppSelectWithCreate
                :can-create="canCrearCategoriaGasto"
                create-title="Nueva categoría de gasto"
                :disabled="saving"
                @create="categoriaGastoModalOpen = true"
              >
                <AppSelect
                  v-model="idCategoriaGasto"
                  label="Categoría gasto"
                  placeholder="Seleccionar"
                  :options="categoriaGastoOptions"
                  :disabled="saving"
                />
              </AppSelectWithCreate>
              <AppSelectSearch
                v-model="idCondicionPago"
                label="Condición pago"
                placeholder="Seleccionar"
                :help="CONDICION_PAGO_HELP"
                :options="condicionPagoOptions"
                :loading="condicionesQuery.isFetching.value"
                :disabled="saving"
              />
            </div>
            <CompraPagoPreview
              v-if="esPlanCuotas || esCreditoPago"
              class="mt-5"
              :modo="esPlanCuotas ? 'cuotas' : 'credito'"
              v-model:cuotas="cuotasPlan"
              v-model:fecha-vencimiento="fechaVencimientoCredito"
              v-model:dia-mes-pago="diaMesPagoEditable"
              :total="totalParaCuotas"
              :dias-credito="Number(condicionPagoSeleccionada?.dias_credito ?? 0)"
              :disabled="saving"
            />
            <AppTextarea v-model="glosa" label="Glosa" placeholder="Opcional" :disabled="saving" class="mt-5" />
            <AppSwitch
              v-model="declararSunat"
              label="Declarar SUNAT"
              :help="DECLARAR_SUNAT_HELP"
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
                @scanned="onProductoCreado"
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
                            :es-gas="det.es_gas"
                            :disabled="saving || lineaGuardando === det.id"
                          />
                        </template>
                        <span v-else class="tabular-nums">{{ det.cantidad }}</span>
                      </td>
                      <td class="px-3 py-2.5">
                        <template v-if="puedeModificar && lineasDraft[det.id]">
                          <MoneyInput
                            v-model="lineasDraft[det.id].precio"
                            placeholder="0.00"
                            :disabled="saving || lineaGuardando === det.id"
                            :state="precioEditError(det.id) ? 'error' : 'default'"
                            @blur="onBlurPrecioEdit(det.id)"
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
                            (parsePrecioLinea(lineasDraft[det.id]?.precio) ??
                              (Number(det.precio_unitario) || 0)) *
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
          data-tutorial="compra-guardar"
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

    <ListaOpcionFormModal
      v-model="categoriaGastoModalOpen"
      :id-lista="ListaIds.CATEGORIA_GASTO"
      title="Nueva categoría de gasto"
      subtitle="Quedará disponible para clasificar compras y gastos operativos."
      nombre-placeholder="Ej. ALQUILER_LOCAL"
      @saved="onCategoriaGastoCreada"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch, type ComponentPublicInstance } from 'vue'
import { useRoute } from 'vue-router'
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
import CompraPagoPreview from '@/modules/compras/components/CompraPagoPreview.vue'
import CompraProductoField from '@/modules/compras/components/CompraProductoField.vue'
import CompraRecargaPlantaDetalle from '@/modules/compras/components/CompraRecargaPlantaDetalle.vue'
import RecargaPlantaBalonesCard from '@/modules/compras/components/ResumenRecarga.vue'
import ClienteFormModal from '@/modules/clientes/components/ClienteFormModal.vue'
import ListaOpcionFormModal from '@/modules/catalogos/components/ListaOpcionFormModal.vue'
import type { ListaOpcion } from '@/modules/catalogos/interfaces/lista-opcion.interface'
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
  RecargaPlanta,
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
import {
  fechaVencimientoCredito as calcularVencimientoCredito,
  previewCuotasCompra,
  redistribuirMontos,
  type CuotaPreviewItem,
} from '@/modules/compras/utils/previewCuotasCompra'
import { esVentaSinDocumentoTipo } from '@/modules/ventas/comprobantes/constants/tipoComprobante'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { ListaIds, TipoClienteIds } from '@/shared/constants/lista-ids'
import DetailSectionCard from '@/shared/components/detail/DetailSectionCard.vue'
import FormCardsLayout from '@/shared/components/detail/FormCardsLayout.vue'
import {
  AppBadge,
  AppCheckbox,
  AppHelpTip,
  AppInput,
  AppSelect,
  AppSelectSearch,
  AppSelectWithCreate,
  AppSwitch,
  AppTextarea,
  MoneyInput,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { optionalString } from '@/shared/validation'
import { toastSuccess, toastWarning } from '@/shared/composables/useToast'
import { formatListDate } from '@/shared/utils/date'
import {
  esMontoMonedaValido,
  esNumeroMonedaValido,
  mensajeErrorMontoMoneda,
  parseMoneyInput,
  roundMoney,
} from '@/shared/utils/currency'
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
const route = useRoute()
const createMutation = useCreateCompraMutation()
const updateCabeceraMutation = useActualizarCabeceraMutation()
const crearDetalleMutation = useCrearDetalleMutation()
const actualizarDetalleMutation = useActualizarDetalleMutation()
const eliminarDetalleMutation = useEliminarDetalleMutation()

const isEdit = computed(() => props.mode === 'edit' && Boolean(props.compraId))
const canCreateProveedor = computed(() => authStore.hasPermission(PermisoBanderas.CLIENTES_CREAR))
const proveedorModalOpen = ref(false)
const categoriaGastoModalOpen = ref(false)
const canCrearCategoriaGasto = computed(() =>
  authStore.hasPermission(
    isEdit.value ? PermisoBanderas.COMPRAS_EDITAR : PermisoBanderas.COMPRAS_CREAR,
  ),
)
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

// Vive fuera del formulario (no se envía) pero el esquema lo consulta: con el
// switch encendido la orden de recarga pasa a ser obligatoria.
const desdeRecargaExterna = ref(false)

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
      // Con el switch encendido la factura declara ser el costo de una orden:
      // sin orden el backend la registra como compra suelta y el gas nunca
      // llega al retorno.
      idRecargaPlanta: yup
        .mixed<string | number>()
        .test('orden-requerida', 'Selecciona la orden de recarga', (value) =>
          !desdeRecargaExterna.value || (value !== '' && value != null),
        ),
      guardarBalonesAlmacen: yup.boolean().default(false),
      fechaLlegadaAlmacen: optionalString().test(
        'retorno-fecha',
        'La fecha de llegada es obligatoria al registrar el retorno',
        function (value) {
          if (!this.parent.guardarBalonesAlmacen) return true
          return Boolean(value)
        },
      ),
      serieGuiaIngreso: optionalString(),
      numeroGuiaIngreso: optionalString(),
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
    fechaLlegadaAlmacen: '',
    serieGuiaIngreso: '',
    numeroGuiaIngreso: '',
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
const [fechaLlegadaAlmacen] = defineField('fechaLlegadaAlmacen')
const [serieGuiaIngreso] = defineField('serieGuiaIngreso')
const [numeroGuiaIngreso] = defineField('numeroGuiaIngreso')
const [idAlmacen, idAlmacenAttrs] = defineField('idAlmacen')
const [idTipoComprobante, idTipoComprobanteAttrs] = defineField('idTipoComprobante')
const [idTipoRegistro, idTipoRegistroAttrs] = defineField('idTipoRegistro')
const [idCategoriaGasto, idCategoriaGastoAttrs] = defineField('idCategoriaGasto')
const [idSucursal] = defineField('idSucursal')
const [idMoneda, idMonedaAttrs] = defineField('idMoneda')
const [idCondicionPago] = defineField('idCondicionPago')
const [glosa] = defineField('glosa')
const [declararSunat] = defineField('declararSunat')
const DECLARAR_SUNAT_HELP =
  'Marca la factura para el registro de compras SUNAT (PLE). No la envía por internet; solo la clasifica para declarar.'
const CONDICION_PAGO_HELP =
  'Contado: la compra no mueve la caja por sí sola; si pagaste en efectivo, regístralo aparte como gasto de caja. Crédito o cuotas: verás un preview editable y al guardar se crea la cuenta por pagar; cada pago que registres sobre ella sí sale de la caja de la sucursal.'

const lineas = reactive<CompraLineaForm[]>([])
const lineasExistentes = computed(() => compraData.value?.detalle ?? [])

const lineaEliminando = ref<number | null>(null)
const lineaGuardando = ref<number | null>(null)
const lineasDraft = reactive<Record<number, { cantidad: number; precio: string }>>({})
const precioNuevoInputs = reactive<Record<string, string>>({})

const precioLineaOpts = { min: 0, allowZero: true } as const

function montoPrecioAString(value: number | string | null | undefined): string {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n) || n <= 0) return ''
  return roundMoney(n).toFixed(2)
}

function parsePrecioLinea(raw: string | undefined): number | null {
  const texto = String(raw ?? '').trim()
  if (!texto) return null
  return parseMoneyInput(texto)
}

function esPrecioLineaValido(raw: string | undefined): boolean {
  const texto = String(raw ?? '').trim()
  if (!texto) return true
  return esMontoMonedaValido(texto, precioLineaOpts)
}

function precioNuevoError(key: string): string {
  return mensajeErrorMontoMoneda(precioNuevoInputs[key] ?? '', precioLineaOpts) ?? ''
}

function precioEditError(id: number): string {
  return mensajeErrorMontoMoneda(lineasDraft[id]?.precio ?? '', precioLineaOpts) ?? ''
}

function onBlurPrecioNuevo(key: string) {
  const msg = mensajeErrorMontoMoneda(precioNuevoInputs[key] ?? '', precioLineaOpts)
  if (msg) return
  const n = parseMoneyInput(precioNuevoInputs[key])
  if (n != null) precioNuevoInputs[key] = roundMoney(n).toFixed(2)
}

function onBlurPrecioEdit(id: number) {
  const draft = lineasDraft[id]
  if (!draft) return
  const msg = mensajeErrorMontoMoneda(draft.precio, precioLineaOpts)
  if (msg) return
  const n = parseMoneyInput(draft.precio)
  if (n != null) draft.precio = roundMoney(n).toFixed(2)
}

function quitarLineaNuevaPorKey(key: string) {
  const index = lineas.findIndex((lin) => lin.key === key)
  if (index >= 0) lineas.splice(index, 1)
  delete precioNuevoInputs[key]
}

function importeLinea(lin: CompraLineaForm) {
  return (parsePrecioLinea(precioNuevoInputs[lin.key]) ?? 0) * Number(lin.cantidad)
}

function validarPreciosLineas(mostrarToast = true): boolean {
  for (const lin of lineas) {
    if (!esPrecioLineaValido(precioNuevoInputs[lin.key])) {
      if (mostrarToast) {
        toastWarning(
          `Precio unitario inválido en ${lin.productoLabel}: solo hasta 2 decimales`,
        )
      }
      return false
    }
  }
  return true
}

function validarCuotasPlan(mostrarToast = true): boolean {
  if (!esPlanCuotas.value || cuotasPlan.value.length <= 1) return true
  for (const cuota of cuotasPlan.value) {
    if (!esNumeroMonedaValido(cuota.monto, { min: 0.01 })) {
      if (mostrarToast) toastWarning('Revisa los montos del plan de cuotas')
      return false
    }
  }
  return true
}

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

const tipoComprobanteOptions = computed(() => {
  const items = (tipoComprobanteQuery.data.value ?? []).filter(
    (item) => !esVentaSinDocumentoTipo({ codigo: item.descripcion, nombre: item.nombre }),
  )
  const sorted = [...items].sort((a, b) => {
    const ca = String(a.descripcion ?? '')
    const cb = String(b.descripcion ?? '')
    const aNum = /^\d+$/.test(ca)
    const bNum = /^\d+$/.test(cb)
    if (aNum && bNum) return ca.localeCompare(cb, undefined, { numeric: true })
    if (aNum) return -1
    if (bNum) return 1
    return formatListaOpcionLabel(a.nombre, a.descripcion).localeCompare(
      formatListaOpcionLabel(b.nombre, b.descripcion),
      'es',
    )
  })
  return toSelectOptions(sorted)
})
const tipoRegistroOptions = computed(() => toSelectOptions(tipoRegistroQuery.data.value))
// La descripción de estas opciones es una aclaración larga, no una etiqueta:
// el select muestra el nombre humanizado (toSelectOptions prefiere la descripción).
const categoriaGastoOptions = computed(() =>
  (categoriaGastoQuery.data.value ?? []).map((opcion) => ({
    value: opcion.id,
    label: formatListaOpcionLabel(opcion.nombre),
  })),
)
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


/**
 * Solo órdenes que ya salieron a planta: en borrador no hay nada que facturar
 * ni que retornar, y las anuladas no cuentan. El proveedor se agrega al cambiar
 * el de la factura (una orden es de un proveedor concreto).
 */
const RECARGA_PLANTA_FILTROS_BASE: RecargaPlantaListFilters = {
  pagina: 1,
  limite: 50,
  codigoEstadoCiclo: 'GENERADA,EMITIDA_SUNAT',
}
const recargaPlantaFilters = ref<RecargaPlantaListFilters>({ ...RECARGA_PLANTA_FILTROS_BASE })
const recargaPlantaQuery = useRecargasPlantaQuery(recargaPlantaFilters)

function opcionDeRecarga(rp: RecargaPlanta) {
  const numero = rp.numero || `RP-${rp.id}`
  const yaRetorno = Boolean(rp.retorno_fisico) || rp.nombre_estado === 'RETORNADO'
  const partes = [numero, formatListDate(rp.fecha_salida)]
  // total_items mezclaba cilindros y líneas de gas; el listado ya los separa.
  if (rp.total_cilindros != null) {
    partes.push(`${rp.total_cilindros} cilindro${rp.total_cilindros === 1 ? '' : 's'}`)
  }
  if (rp.total_productos != null) {
    partes.push(`${rp.total_productos} producto${rp.total_productos === 1 ? '' : 's'}`)
  }
  return {
    value: rp.id,
    label: partes.join(' · '),
    // El badge avisa que el retorno ya está hecho; la orden sigue siendo
    // elegible porque lo que falta es justamente vincular su factura.
    badges: yaRetorno ? [{ label: 'Retorno registrado', color: 'success' as const }] : undefined,
  }
}

const recargaPlantaOptionsListado = computed(() =>
  (recargaPlantaQuery.data.value?.data ?? [])
    // Lo que descarta una orden es estar ya facturada, no haber retornado: el
    // retorno puede haberse marcado antes de que llegue la factura del proveedor.
    // El estado lo filtra la API; el guard local cubre datos en caché.
    .filter(
      (rp) =>
        !rp.id_comprobante_compra &&
        rp.nombre_estado !== 'BORRADOR' &&
        rp.nombre_estado !== 'ANULADA',
    )
    .map(opcionDeRecarga),
)

const idRecargaPlantaNum = computed(() =>
  idRecargaPlanta.value !== '' && idRecargaPlanta.value != null ? Number(idRecargaPlanta.value) : null,
)
const recargaPlantaDetalleQuery = useRecargaPlantaQuery(idRecargaPlantaNum)

/**
 * Al llegar por deep-link (o al corregir una compra anulada) la orden elegida
 * puede no estar en la página que devolvió el listado: sin su opción el select
 * mostraba el campo vacío como si no hubiera nada seleccionado. Se inyecta con
 * los datos del detalle, que ya se está pidiendo para armar las líneas de gas.
 */
const recargaPlantaOptions = computed(() => {
  const opciones = recargaPlantaOptionsListado.value
  const id = idRecargaPlantaNum.value
  if (!id || opciones.some((opt) => Number(opt.value) === id)) return opciones

  const detalle = recargaPlantaDetalleQuery.data.value
  if (!detalle || detalle.id !== id) return opciones
  return [opcionDeRecarga(detalle), ...opciones]
})

const tituloDetalleProductos = computed(() =>
  desdeRecargaExterna.value && idRecargaPlantaNum.value
    ? 'Detalle de productos (gases de la orden)'
    : 'Detalle de productos (opcional)',
)
const helpDetalleProductos = computed(() => {
  if (!(desdeRecargaExterna.value && idRecargaPlantaNum.value)) {
    return 'Opcional: puedes registrar la compra sin líneas y agregarlas después. Al seleccionar un producto se agrega una fila editable. La cantidad se valida según la U.M. (UNID = solo enteros).'
  }
  // Con el retorno ya hecho el gas está en almacén: estas cantidades no vuelven
  // a ingresarlo, solo ajustan lo ingresado a lo que el proveedor facturó.
  if (ordenYaRetorno.value) {
    return 'El retorno ya se registró: el gas está en el almacén. Estas cantidades son el costo facturado y ajustan lo que ingresó; no vuelven a sumar stock. Puedes agregar extras abajo.'
  }
  return 'Gases de la orden: indica cuánto ingresó de cada uno (tope: la capacidad de los cilindros) y su precio. El stock entra al registrar el retorno, con estas cantidades. Puedes agregar extras abajo.'
})

const suppressRecargaPlantaReset = ref(false)

function queryParam(key: string): string {
  const raw = route.query[key]
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' ? value.trim() : ''
}

function queryId(key: string): number | null {
  const id = Number(queryParam(key))
  return Number.isFinite(id) && id > 0 ? id : null
}

function resetRetornoFields() {
  guardarBalonesAlmacen.value = false
  fechaLlegadaAlmacen.value = ''
  serieGuiaIngreso.value = ''
  numeroGuiaIngreso.value = ''
}

watch(idProveedor, (id) => {
  const idNum = id !== '' && id != null ? Number(id) : undefined
  recargaPlantaFilters.value = { ...RECARGA_PLANTA_FILTROS_BASE, idProveedor: idNum }
  if (suppressRecargaPlantaReset.value) return
  idRecargaPlanta.value = ''
  resetRetornoFields()
})

/**
 * Deshace lo que dejó el deep-link cuando la URL pierde la orden (volver atrás,
 * o navegar a "Nueva compra" desde el menú estando en una de recarga). Antes el
 * formulario se quedaba con la orden, sus líneas de gas y el bloque de retorno
 * de la pantalla anterior.
 */
function limpiarRecargaExterna() {
  desdeRecargaExterna.value = false
  idRecargaPlanta.value = ''
  recargaPlantaLineasSyncedFor.value = null
  recargaRetornoPrefillFor.value = null
  referenciaLineasPendientes.value = null
  resetRetornoFields()
  quitarLineasDeRecargaPlanta()
}

/**
 * Deep-link: /admin/compras/nuevo?idRecargaPlanta=..&idProveedor=..&idAlmacen=..
 * (&serieFactura=..&numeroFactura=..). Solo precarga; marcar el retorno es
 * decisión del cajero: antes un parámetro lo dejaba activado por defecto y la
 * compra registraba un retorno que nadie pidió.
 */
async function prefillDesdeQuery() {
  if (isEdit.value) return

  const idRecarga = queryId('idRecargaPlanta')
  if (!idRecarga) {
    if (desdeRecargaExterna.value || idRecargaPlantaNum.value) limpiarRecargaExterna()
    return
  }

  suppressRecargaPlantaReset.value = true
  desdeRecargaExterna.value = true
  idRecargaPlanta.value = idRecarga

  // Proveedor y almacén también llegan de la orden, pero tenerlos en la URL
  // evita el parpadeo: el selector de órdenes ya filtra por proveedor desde el
  // primer render en vez de quedar deshabilitado hasta que cargue el detalle.
  const idProveedorQuery = queryId('idProveedor')
  const idAlmacenQuery = queryId('idAlmacen')
  if (idProveedorQuery) idProveedor.value = idProveedorQuery
  if (idAlmacenQuery) idAlmacen.value = idAlmacenQuery

  const serieFactura = queryParam('serieFactura')
  const numeroFactura = queryParam('numeroFactura')
  if (serieFactura) serie.value = serieFactura
  if (numeroFactura) numero.value = numeroFactura

  await nextTick()
  suppressRecargaPlantaReset.value = false
  sincronizarDesdeRecarga(idRecargaPlantaNum.value, recargaPlantaDetalleQuery.data.value)
}

watch(
  () => route.query.idRecargaPlanta,
  () => {
    void prefillDesdeQuery()
  },
)

watch(desdeRecargaExterna, (on) => {
  if (on || suppressRecargaPlantaReset.value) return
  idRecargaPlanta.value = ''
  resetRetornoFields()
  quitarLineasDeRecargaPlanta()
})

watch(guardarBalonesAlmacen, (on) => {
  if (!on) return
  if (!fechaLlegadaAlmacen.value) {
    fechaLlegadaAlmacen.value = (fecha.value as string) || today()
  }
})

const RECARGA_LINEA_PREFIX = 'recarga-planta-'
const recargaPlantaLineasSyncedFor = ref<number | null>(null)
const recargaRetornoPrefillFor = ref<number | null>(null)

function esLineaRecargaPlanta(key: string) {
  return key.startsWith(RECARGA_LINEA_PREFIX)
}

const lineasRecarga = computed(() => lineas.filter((lin) => esLineaRecargaPlanta(lin.key)))
const lineasManuales = computed(() => lineas.filter((lin) => !esLineaRecargaPlanta(lin.key)))

/**
 * La orden ya retornó desde el documento de salida: el gas y los cilindros ya
 * ingresaron. Lo prueba la entrada de inventario (`retorno_fisico`), no la
 * fecha de llegada: con "finalizar sin guardar en almacén" la orden quedaba con
 * fecha y los cilindros seguían en planta, y la compra se saltaba el retorno.
 */
const ordenYaRetorno = computed(() =>
  Boolean(recargaPlantaDetalleQuery.data.value?.retorno_fisico),
)
const fechaRetornoOrdenLabel = computed(
  () => formatListDate(recargaPlantaDetalleQuery.data.value?.fecha_llegada_almacen) || '—',
)

function formatCapacidadRecarga(lin: CompraLineaForm) {
  const cap = Number(lin.capacidadRecarga ?? 0)
  if (!(cap > 0)) return '—'
  const um = lin.nombreUnidadMedida?.trim()
  const texto = cap.toLocaleString('es-PE', { maximumFractionDigits: 2 })
  return um ? `${texto} ${um}` : texto
}

/**
 * Lo que ingresa por gas lo pone el cajero, pero la planta no puede cargar más
 * de lo que cabe en los cilindros que salieron: la capacidad total es el tope.
 */
function errorCantidadRecarga(lin: CompraLineaForm): string | undefined {
  const cantidad = Number(lin.cantidad)
  if (!(cantidad > 0)) return 'Indica cuánto ingresa'
  const cap = Number(lin.capacidadRecarga ?? 0)
  if (cap > 0 && cantidad > cap) {
    return `Máximo ${cap.toLocaleString('es-PE', { maximumFractionDigits: 2 })} (capacidad de los cilindros)`
  }
  return undefined
}

function validarCantidadesRecarga(): boolean {
  for (const lin of lineasRecarga.value) {
    const error = errorCantidadRecarga(lin)
    if (error) {
      toastWarning(`${lin.productoLabel}: ${error.toLowerCase()}`)
      return false
    }
  }
  return true
}

/** Al llegar por deep-link no hay proveedor todavía: se toma el de la orden. */
async function prefillProveedorAlmacenDesdeRecarga(recarga: {
  id_proveedor?: number | null
  id_almacen?: number | null
}) {
  if (isEdit.value) return
  const faltaProveedor = !idProveedor.value && Boolean(recarga.id_proveedor)
  const faltaAlmacen = !idAlmacen.value && Boolean(recarga.id_almacen)
  if (!faltaProveedor && !faltaAlmacen) return

  suppressRecargaPlantaReset.value = true
  if (faltaProveedor) idProveedor.value = recarga.id_proveedor as number
  if (faltaAlmacen) idAlmacen.value = recarga.id_almacen as number
  await nextTick()
  suppressRecargaPlantaReset.value = false
}

function quitarLineasDeRecargaPlanta() {
  for (let i = lineas.length - 1; i >= 0; i--) {
    if (lineas[i].key.startsWith(RECARGA_LINEA_PREFIX)) {
      delete precioNuevoInputs[lineas[i].key]
      lineas.splice(i, 1)
    }
  }
}

function agregarLineasDesdeRecargaPlanta(detalles: RecargaPlantaDetalle[]) {
  quitarLineasDeRecargaPlanta()

  // Una fila por gas (como DocSalida "Productos según los balones"): la
  // capacidad total de los cilindros es la referencia y el tope; la cantidad
  // que ingresa arranca igual a ella y el cajero la ajusta a lo que la planta
  // cargó. Es esa cantidad la que entra al stock al registrar el retorno.
  const grupos = new Map<number, CompraLineaForm>()
  for (const balon of detalles) {
    const idGas = balon.id_producto_gas_balon ?? balon.id_producto
    if (idGas == null) continue

    const capacidad =
      Number(balon.capacidad_balon ?? balon.capacidad) || 0
    if (capacidad <= 0) continue

    const nombreGas =
      balon.nombre_producto_gas_balon?.trim() ||
      balon.nombre_producto?.trim() ||
      `Gas ${idGas}`
    const nombreTipo = balon.nombre_tipo_balon?.trim() || 'Sin tipo'

    const existente = grupos.get(idGas)
    if (existente) {
      existente.cantidad += capacidad
      existente.capacidadRecarga = (existente.capacidadRecarga ?? 0) + capacidad
      existente.cilindrosRecarga = (existente.cilindrosRecarga ?? 0) + 1
      const tipos = existente.tiposRecarga ?? []
      const tipo = tipos.find((t) => t.nombre === nombreTipo)
      if (tipo) tipo.cantidad += 1
      else tipos.push({ nombre: nombreTipo, cantidad: 1 })
      existente.tiposRecarga = tipos
      continue
    }

    grupos.set(idGas, {
      key: `${RECARGA_LINEA_PREFIX}${idGas}`,
      idProducto: idGas,
      productoLabel: balon.codigo_producto
        ? `${balon.codigo_producto} - ${nombreGas}`
        : nombreGas,
      cantidad: capacidad,
      precioUnitario: 0,
      // La cantidad es una suma de capacidades: su U.M. es la de la capacidad
      // del tipo de balón. La línea del cilindro en la orden no trae unidad, y
      // sin id la API no puede convertir a la unidad del producto.
      idUnidadMedida: balon.id_unidad_capacidad_balon ?? balon.id_unidad_medida ?? null,
      nombreUnidadMedida:
        balon.unidad_capacidad_balon ?? balon.nombre_unidad_medida ?? null,
      esGas: true,
      afectaStock: false,
      capacidadRecarga: capacidad,
      cilindrosRecarga: 1,
      tiposRecarga: [{ nombre: nombreTipo, cantidad: 1 }],
    })
  }

  for (const linea of grupos.values()) {
    precioNuevoInputs[linea.key] = ''
  }

  lineas.push(...grupos.values())
  if (grupos.size > 0) {
    toastSuccess(
      `${grupos.size} gas${grupos.size === 1 ? '' : 'es'} de la orden cargado${grupos.size === 1 ? '' : 's'}. Indica cuánto ingresó de cada uno y su precio.`,
    )
  }
}

/**
 * Corrección de una compra anulada ligada a una orden: las líneas de gas se
 * vuelven a armar desde los cilindros de la orden (tope, U.M., badges) y sobre
 * ellas se aplican cantidad y precio de la compra anulada; lo que no era gas de
 * la orden entra como línea manual. Se resuelve cuando llega el detalle de la
 * orden, por eso queda pendiente. Antes se copiaban las líneas tal cual y el
 * formulario perdía la UI de gases (claves recarga-planta-*, esGas, tope).
 */
type LineaReferencia = Pick<
  CompraLineaForm,
  | 'idProducto'
  | 'productoLabel'
  | 'cantidad'
  | 'precioUnitario'
  | 'idUnidadMedida'
  | 'nombreUnidadMedida'
  | 'afectaStock'
>
const referenciaLineasPendientes = ref<LineaReferencia[] | null>(null)

function lineaDesdeReferencia(d: CompraDetalle): LineaReferencia {
  return {
    idProducto: d.id_producto as number,
    cantidad: Number(d.cantidad),
    precioUnitario: Number(d.precio_unitario ?? 0),
    productoLabel: d.codigo_producto
      ? `${d.codigo_producto} - ${d.nombre_producto ?? ''}`
      : (d.nombre_producto ?? d.descripcion),
    idUnidadMedida: d.id_unidad_medida ?? null,
    nombreUnidadMedida: d.unidad_medida ?? null,
    afectaStock: Boolean(d.afecta_stock),
  }
}

function agregarLineaManualDesdeReferencia(l: LineaReferencia) {
  const key = crypto.randomUUID()
  precioNuevoInputs[key] = montoPrecioAString(l.precioUnitario)
  lineas.push({ key, ...l })
}

function aplicarLineasReferenciaPendientes() {
  const pendientes = referenciaLineasPendientes.value
  if (!pendientes) return
  referenciaLineasPendientes.value = null

  for (const l of pendientes) {
    const gasOrden = lineas.find(
      (lin) => esLineaRecargaPlanta(lin.key) && lin.idProducto === l.idProducto,
    )
    if (!gasOrden) {
      agregarLineaManualDesdeReferencia(l)
      continue
    }
    const tope = Number(gasOrden.capacidadRecarga ?? 0)
    gasOrden.cantidad = tope > 0 ? Math.min(l.cantidad, tope) : l.cantidad
    gasOrden.precioUnitario = l.precioUnitario
    precioNuevoInputs[gasOrden.key] =
      l.precioUnitario > 0 ? montoPrecioAString(l.precioUnitario) : ''
  }
}

/**
 * Sincroniza el formulario con la orden elegida: proveedor/almacén/GRE la
 * primera vez, y las líneas de gas una sola vez por orden. Vive fuera del watch
 * para poder invocarla también cuando el detalle ya estaba en caché y el watch
 * no vuelve a disparar (deep-link y corrección la precargan con el reset
 * suprimido).
 */
function sincronizarDesdeRecarga(id: number | null, data: RecargaPlanta | null | undefined) {
  if (!id) {
    quitarLineasDeRecargaPlanta()
    recargaPlantaLineasSyncedFor.value = null
    recargaRetornoPrefillFor.value = null
    resetRetornoFields()
    return
  }

  if (!data || data.id !== id) return

  if (recargaRetornoPrefillFor.value !== id) {
    recargaRetornoPrefillFor.value = id
    void prefillProveedorAlmacenDesdeRecarga(data)
    serieGuiaIngreso.value = data.serie_guia_ingreso ?? ''
    numeroGuiaIngreso.value = data.numero_guia_ingreso ?? ''
    // Retorno ya hecho desde el documento: no se vuelve a marcar aquí (antes
    // se auto-marcaba y la compra repetía el ingreso de los cilindros). Manda
    // la entrada de inventario: una orden con solo fecha de llegada todavía
    // tiene los cilindros en planta y su retorno se registra desde aquí.
    if (data.retorno_fisico) {
      guardarBalonesAlmacen.value = false
      fechaLlegadaAlmacen.value = ''
    }
  }

  if (recargaPlantaLineasSyncedFor.value === id) return

  recargaPlantaLineasSyncedFor.value = id
  agregarLineasDesdeRecargaPlanta(data.detalles ?? [])
  aplicarLineasReferenciaPendientes()
}

watch(
  () => [idRecargaPlantaNum.value, recargaPlantaDetalleQuery.data.value] as const,
  ([id, data]) => {
    if (suppressRecargaPlantaReset.value) return
    sincronizarDesdeRecarga(id, data)
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
const condicionPagoOptions = computed(() =>
  (condicionesQuery.data.value?.data ?? []).map((item) => {
    const cuotas = Number(item.numero_cuotas ?? 0)
    const dias = Number(item.dias_credito ?? 0)
    const nombre = item.nombre
    const yaDetalla = /cuota|día|dias/i.test(nombre)
    let extra = ''
    if (!yaDetalla) {
      if (cuotas > 1) extra = `${cuotas} cuotas · día ${item.dia_mes_pago ?? '—'}`
      else if (dias > 0) extra = `${dias} días`
    }
    return { value: item.id, label: extra ? `${nombre} (${extra})` : nombre }
  }),
)
const condicionPagoSeleccionada = computed(
  () =>
    (condicionesQuery.data.value?.data ?? []).find(
      (item) => item.id === Number(idCondicionPago.value),
    ) ?? null,
)
const numeroCuotasCondicion = computed(() =>
  Number(condicionPagoSeleccionada.value?.numero_cuotas ?? 0),
)
const diaMesPagoCondicion = computed(() =>
  Number(condicionPagoSeleccionada.value?.dia_mes_pago ?? 0),
)
const esPlanCuotas = computed(() => numeroCuotasCondicion.value > 1)
const esCreditoPago = computed(
  () =>
    !esPlanCuotas.value && Number(condicionPagoSeleccionada.value?.dias_credito ?? 0) > 0,
)
const fechaParaCuotas = computed(() =>
  isEdit.value ? (cabecera.value?.fecha ?? '').slice(0, 10) : String(fecha.value || ''),
)
const totalLineas = computed(() => lineas.reduce((acc, lin) => acc + importeLinea(lin), 0))
const totalesDetalle = computed(() => calcularTotalesDesdeImporte(totalLineas.value))
const totalParaCuotas = computed(() => {
  if (!isEdit.value) return totalesDetalle.value.total
  const existentes = lineasExistentes.value
  if (!existentes.length) return Number(cabecera.value?.total_importe ?? 0)
  return existentes.reduce((acc, det) => {
    const draft = lineasDraft[det.id]
    const cantidad = draft?.cantidad ?? det.cantidad
    const precio = parsePrecioLinea(draft?.precio) ?? Number(det.precio_unitario ?? 0)
    return acc + Number(cantidad) * precio
  }, 0)
})
const cuotasPlan = ref<CuotaPreviewItem[]>([])
const fechaVencimientoCredito = ref('')
const diaMesPagoEditable = ref(0)

watch(
  () =>
    [
      Number(idCondicionPago.value) || 0,
      fechaParaCuotas.value,
      numeroCuotasCondicion.value,
      Number(condicionPagoSeleccionada.value?.dias_credito ?? 0),
      diaMesPagoCondicion.value,
    ] as const,
  () => {
    diaMesPagoEditable.value = diaMesPagoCondicion.value
    if (esPlanCuotas.value) {
      cuotasPlan.value = previewCuotasCompra({
        total: totalParaCuotas.value,
        numeroCuotas: numeroCuotasCondicion.value,
        fechaCompra: fechaParaCuotas.value,
        diasCredito: Number(condicionPagoSeleccionada.value?.dias_credito ?? 0),
        diaMesPago: diaMesPagoEditable.value,
      })
      fechaVencimientoCredito.value = ''
      return
    }
    if (esCreditoPago.value) {
      cuotasPlan.value = []
      fechaVencimientoCredito.value = calcularVencimientoCredito(
        fechaParaCuotas.value,
        Number(condicionPagoSeleccionada.value?.dias_credito ?? 0),
      )
      return
    }
    cuotasPlan.value = []
    fechaVencimientoCredito.value = ''
  },
)

watch(totalParaCuotas, (total) => {
  if (cuotasPlan.value.length > 1) {
    cuotasPlan.value = redistribuirMontos(cuotasPlan.value, total)
  }
})

const productosFilters = ref({
  pagina: 1,
  limite: 50,
  soloActivos: 1 as number,
  buscar: undefined as string | undefined,
  idAlmacen: undefined as number | undefined,
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
watch(
  () => (idAlmacen.value === '' || idAlmacen.value == null ? undefined : Number(idAlmacen.value)),
  (id) => {
    productosFilters.value = { ...productosFilters.value, idAlmacen: id }
  },
  { immediate: true },
)
const productoOptions = computed(() =>
  (productosQuery.data.value?.data ?? []).map((p) => {
    const badges: NonNullable<SelectOption['badges']> = []
    if (p.es_gas) badges.push({ label: 'Gas', color: 'primary' })
    if (p.es_servicio) badges.push({ label: 'Servicio', color: 'neutral' })
    if (p.es_alquilable) badges.push({ label: 'Alquilable', color: 'warning' })
    if (p.nombre_categoria) badges.push({ label: p.nombre_categoria, color: 'neutral' })
    if (p.nombre_sub_categoria) badges.push({ label: p.nombre_sub_categoria, color: 'neutral' })
    if (p.nombre_unidad_medida) badges.push({ label: p.nombre_unidad_medida, color: 'neutral' })
    if (p.presentacion) badges.push({ label: p.presentacion, color: 'neutral' })
    if (p.marca) badges.push({ label: p.marca, color: 'neutral' })
    if (p.afecta_stock) badges.push({ label: 'Ingresa stock', color: 'primary' })
    else badges.push({ label: 'Sin stock', color: 'neutral' })
    if (p.stock_actual != null) {
      badges.push({
        label: `Stock: ${p.stock_actual}`,
        color: Number(p.stock_actual) <= 0 ? 'error' : 'success',
      })
    }
    return {
      value: p.id,
      title: `${p.codigo} — ${p.nombre}`,
      label: `${p.codigo} — ${p.nombre}`,
      badges,
    }
  }),
)

watch(
  lineasExistentes,
  (detalles) => {
    for (const det of detalles) {
      lineasDraft[det.id] = {
        cantidad: Number(det.cantidad),
        precio: montoPrecioAString(det.precio_unitario),
      }
    }
  },
  { immediate: true, deep: true },
)

function lineaDraftCambiada(det: CompraDetalle) {
  const draft = lineasDraft[det.id]
  if (!draft) return false
  const precioOrig = det.precio_unitario == null ? 0 : roundMoney(Number(det.precio_unitario))
  const precioDraft = roundMoney(parsePrecioLinea(draft.precio) ?? 0)
  return Number(draft.cantidad) !== Number(det.cantidad) || precioDraft !== precioOrig
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
    det.es_gas,
  )
  if (errorCantidad) {
    toastWarning(errorCantidad)
    return
  }

  if (!esPrecioLineaValido(draft.precio)) {
    toastWarning('Precio unitario inválido: solo hasta 2 decimales')
    return
  }

  const precio = roundMoney(parsePrecioLinea(draft.precio) ?? 0)
  lineaGuardando.value = det.id
  try {
    await actualizarDetalleMutation.mutateAsync({
      idDetalle: det.id,
      payload: {
        idUsuarioAuditoria: userId,
        cantidad,
        precioUnitario: precio,
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

function onCategoriaGastoCreada(opcion: ListaOpcion) {
  idCategoriaGasto.value = opcion.id
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

  // Las filas de gas de la orden no se acumulan con los extras: su cantidad es
  // lo que la planta cargó (topada por la capacidad de los cilindros) y su
  // línea va como costo sin stock. Sumarle un extra del mismo producto rompía
  // el tope y convertía el extra en parte del retorno.
  const existente = lineas.find(
    (linea) => linea.idProducto === producto.id && !esLineaRecargaPlanta(linea.key),
  )
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
    esServicio: Boolean(producto.es_servicio),
    esAlquilable: Boolean(producto.es_alquilable),
    nombreCategoria: producto.nombre_categoria ?? null,
    marca: producto.marca ?? null,
    presentacion: producto.presentacion ?? null,
    afectaStock: Boolean(producto.afecta_stock),
  })
  const nuevaLinea = lineas[lineas.length - 1]
  precioNuevoInputs[nuevaLinea.key] = montoPrecioAString(precioDefault)
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

/** Código ISO de la moneda elegida (las opciones de la lista Moneda son 'PEN' / 'USD'). */
const codigoMoneda = computed(() => {
  const id = Number(idMoneda.value)
  const opcion = (monedaQuery.data.value ?? []).find((o) => Number(o.id) === id)
  const codigo = opcion?.nombre?.trim().toUpperCase()
  return codigo && /^[A-Z]{3}$/.test(codigo) ? codigo : 'PEN'
})

function formatMoney(value: number) {
  try {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: codigoMoneda.value,
    }).format(value)
  } catch {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
  }
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
      fechaLlegadaAlmacen: '',
      serieGuiaIngreso: '',
      numeroGuiaIngreso: '',
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
  recargaRetornoPrefillFor.value = null
  recargaPlantaFilters.value = { ...RECARGA_PLANTA_FILTROS_BASE }
  recargaPlantaLineasSyncedFor.value = null
  referenciaLineasPendientes.value = null
  desdeRecargaExterna.value = false
  lineas.splice(0, lineas.length)
  for (const key of Object.keys(precioNuevoInputs)) {
    delete precioNuevoInputs[key]
  }
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
      fechaLlegadaAlmacen: '',
      serieGuiaIngreso: '',
      numeroGuiaIngreso: '',
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
    ...RECARGA_PLANTA_FILTROS_BASE,
    idProveedor: c.id_proveedor ?? undefined,
  }

  // Se deja que la orden vuelva a armar sus líneas de gas (no se marca como
  // ya sincronizada): las de la compra anulada se aplican encima.
  recargaPlantaLineasSyncedFor.value = null
  recargaRetornoPrefillFor.value = null
  desdeRecargaExterna.value = Boolean(c.id_recarga_planta)

  proveedorBuscar.value = c.proveedor ?? ''

  lineas.splice(0, lineas.length)
  for (const key of Object.keys(precioNuevoInputs)) {
    delete precioNuevoInputs[key]
  }

  const lineasRef = (data.detalle ?? [])
    .filter((d) => d.id_producto != null)
    .map(lineaDesdeReferencia)

  await nextTick()
  suppressRecargaPlantaReset.value = false

  if (c.id_recarga_planta) {
    referenciaLineasPendientes.value = lineasRef
    sincronizarDesdeRecarga(idRecargaPlantaNum.value, recargaPlantaDetalleQuery.data.value)
    return
  }

  for (const l of lineasRef) agregarLineaManualDesdeReferencia(l)
}

watch(
  () =>
    [props.active, isEdit.value, props.referenciaCompraId, referenciaQuery.data.value] as const,
  ([isActive, edit, refId, refData]) => {
    if (!isActive || edit) return

    if (!refId) {
      resetCreateForm()
      void prefillDesdeQuery()
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
        fechaLlegadaAlmacen: '',
        serieGuiaIngreso: '',
        numeroGuiaIngreso: '',
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
    if (!validarCuotasPlan()) return

    const updated = await updateCabeceraMutation.mutateAsync({
      id: props.compraId,
      payload: {
        idUsuarioAuditoria: userId,
        glosa: values.glosa?.trim() || undefined,
        idCondicionPago: toOptionalNumber(values.idCondicionPago),
        idCategoriaGasto: toOptionalNumber(values.idCategoriaGasto),
        declararSunat: values.declararSunat,
        fechaVencimiento: esCreditoPago.value
          ? fechaVencimientoCredito.value || undefined
          : undefined,
        cuotas:
          esPlanCuotas.value && cuotasPlan.value.length > 1
            ? cuotasPlan.value.map((c) => ({
                fechaPago: c.fechaPago,
                monto: roundMoney(c.monto),
              }))
            : undefined,
      },
    })
    emit('saved', updated.cabecera.id)
    return
  }


  // Una compra suelta puede guardarse solo con cabecera y recibir sus líneas
  // después, pero la de una orden de planta no: sin líneas de gas el retorno se
  // registra con cantidad cero y la factura queda sin costo que repartir.
  if (desdeRecargaExterna.value && idRecargaPlantaNum.value && lineas.length === 0) {
    toastWarning('Agrega al menos una línea: es el gas (y el costo) que aporta esta factura')
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

  if (!validarPreciosLineas()) return
  if (!validarCuotasPlan()) return

  if (
    toOptionalNumber(values.idRecargaPlanta) != null &&
    Boolean(values.guardarBalonesAlmacen) &&
    !values.fechaLlegadaAlmacen
  ) {
    toastWarning('Para registrar el retorno indica la fecha de llegada al almacén')
    return
  }

  if (!validarCantidadesRecarga()) return

  const detalles = lineas.map((l) => {
    const precioParsed = parsePrecioLinea(precioNuevoInputs[l.key])
    return {
      idProducto: l.idProducto,
      cantidad: Number(l.cantidad),
      precioUnitario:
        precioParsed != null && precioParsed > 0 ? roundMoney(precioParsed) : undefined,
      idUnidadMedida: l.idUnidadMedida ?? undefined,
      // Gas de la orden: la línea es costo, no INGRESO. La cantidad es la que
      // bal_finalizar_recarga_planta lleva al stock al registrar el retorno.
      ...(l.afectaStock === false ? { afectaStock: false } : {}),
    }
  })

  const conRecarga =
    desdeRecargaExterna.value && toOptionalNumber(values.idRecargaPlanta) != null
  const registrarRetorno = conRecarga && Boolean(values.guardarBalonesAlmacen)

  const created = await createMutation.mutateAsync({
    idUsuarioAuditoria: userId,
    fecha: values.fecha as string,
    serie: String(values.serie ?? '').trim() || undefined,
    numero: String(values.numero ?? '').trim() || undefined,
    idProveedor: toOptionalNumber(values.idProveedor),
    idRecargaPlanta: toOptionalNumber(values.idRecargaPlanta),
    guardarBalonesAlmacen: registrarRetorno || undefined,
    fechaLlegadaAlmacen: registrarRetorno
      ? String(values.fechaLlegadaAlmacen || '').trim() || undefined
      : undefined,
    serieGuiaIngreso: conRecarga
      ? String(values.serieGuiaIngreso ?? '').trim() || undefined
      : undefined,
    numeroGuiaIngreso: conRecarga
      ? String(values.numeroGuiaIngreso ?? '').trim() || undefined
      : undefined,
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
    fechaVencimiento: esCreditoPago.value
      ? fechaVencimientoCredito.value || undefined
      : undefined,
    cuotas:
      esPlanCuotas.value && cuotasPlan.value.length > 1
        ? cuotasPlan.value.map((c) => ({
            fechaPago: c.fechaPago,
            monto: roundMoney(c.monto),
          }))
        : undefined,
    detalles,
  })
  emit('saved', created.cabecera.id)
})
</script>
