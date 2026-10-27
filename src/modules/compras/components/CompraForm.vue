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
            description="Datos tal como figuran en la factura o boleta del proveedor."
            :icon="ICONS.receipt"
            :full-width="true"
          >
            <template #actions>
              <div data-tutorial="compra-declarar-sunat">
                <AppSwitch
                  v-model="declararSunat"
                  label="Declarar SUNAT"
                  :help="DECLARAR_SUNAT_HELP"
                  :disabled="saving"
                />
              </div>
            </template>

            <div
              v-if="props.referenciaCompraId"
              class="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
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

            <div data-tutorial="compra-documento" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
              <AppDatePicker
                v-model="fecha"
                label="Fecha de emisión"
                required
                v-bind="fechaAttrs"
                :disabled="saving"
                :error="errors.fecha"
              />
            </div>
          </DetailSectionCard>

          <DetailSectionCard
            data-tutorial="compra-clasificacion"
            title="Registro y destino"
            description="Cómo se contabiliza la compra y a qué almacén ingresa el stock."
            :icon="ICONS.layers"
            :full-width="true"
          >
            <div>
              <p class="compra-subtitulo">Contabilidad</p>
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
              </div>
            </div>

            <div class="border-t border-gray-100 pt-5 dark:border-gray-800">
              <p class="compra-subtitulo">Destino</p>
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
              </div>
            </div>
          </DetailSectionCard>

          <DetailSectionCard
            data-tutorial="compra-pago"
            title="Pago"
            description="Modalidad y medio con el que se pagó la factura."
            :icon="ICONS.wallet"
            :full-width="true"
          >
            <CompraPagoResumen
              :modalidad="etiquetaModalidadPago"
              :detalle="detallePago"
              :estado="estadoPago"
              :icono="esContado ? ICONS.banknote : ICONS.calendarRange"
              :total="formatMoney(totalesDetalle.total)"
              :disabled="saving"
              @editar="pagoModalOpen = true"
            />
          </DetailSectionCard>

          <DetailSectionCard
            data-tutorial="compra-recarga-externa"
            title="Recarga externa"
            description="Actívalo solo si esta factura es el costo de una orden de recarga en planta."
            :icon="ICONS.cylinder"
            :full-width="true"
          >
            <AppSwitch
              v-model="desdeRecargaExterna"
              label="Vincular a una orden de recarga"
              help="Vincula la factura a una orden de planta. El gas entra al stock con el retorno de los cilindros, con las cantidades de esta factura."
              :disabled="saving"
            />

            <template v-if="desdeRecargaExterna">
              <!--
                La GRE del proveedor es un dato de la factura, no del retorno:
                se puede tipear aunque el retorno ya esté registrado o aún no
                se marque. Se guarda en la orden como referencia.
              -->
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div class="sm:col-span-2">
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
                </template>
              </div>

              <template v-if="idRecargaPlantaNum">
                <!--
                  Retorno ya registrado desde el documento de salida: los cilindros
                  y el gas ya ingresaron. Volver a marcarlo aquí duplicaba el
                  ingreso; ahora la factura solo se vincula a la orden.
                -->
                <div
                  v-if="ordenYaRetorno"
                  class="flex items-start gap-2 rounded-lg border border-success-500/30 bg-success-50 px-3 py-2.5 text-xs text-gray-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-gray-300"
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

                <div
                  v-else
                  class="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                >
                  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div class="flex items-start gap-1.5">
                      <AppCheckbox
                        v-model="guardarBalonesAlmacen"
                        label="Registrar retorno de cilindros"
                        :disabled="saving"
                      />
                      <AppHelpTip
                        text="Márcalo si los cilindros ya llegaron: quedan disponibles en el almacén y el gas ingresa con las cantidades que indiques en el detalle. Si aún están en planta, déjalo apagado: la factura queda vinculada y el retorno se registra después desde el documento de salida."
                      />
                    </div>
                    <div v-if="guardarBalonesAlmacen" class="w-full sm:w-64">
                      <AppDatePicker
                        v-model="fechaLlegadaAlmacen"
                        label="Fecha llegada almacén"
                        required
                        :disabled="saving"
                        :error="errors.fechaLlegadaAlmacen"
                      />
                    </div>
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
                </div>

                <div>
                  <p class="compra-subtitulo">Cilindros de la orden</p>
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
            :description="descripcionDetalleProductos"
            :icon="ICONS.clipboardList"
            :full-width="true"
            :help="helpDetalleProductos"
          >
            <template #actions>
              <span
                class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300"
              >
                {{ lineas.length }} {{ lineas.length === 1 ? 'ítem' : 'ítems' }}
              </span>
            </template>

            <div data-tutorial="compra-agregar-producto">
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
            <div v-if="desdeRecargaExterna && idRecargaPlantaNum">
              <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p class="compra-subtitulo !mb-0">Gas que ingresa según los cilindros</p>
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
                  <table class="compra-detalle-table w-full min-w-[760px] table-fixed text-sm">
                    <thead class="bg-gray-50 dark:bg-white/5">
                      <tr>
                        <th class="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Producto
                        </th>
                        <th class="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Tipos que lo cargan
                        </th>
                        <th class="w-32 px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Capacidad
                        </th>
                        <th class="w-36 px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Ingresa
                        </th>
                        <th class="w-56 px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Monto (IGV)
                        </th>
                        <th class="w-48 px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
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
                          <div class="compra-precio">
                            <button
                              type="button"
                              :title="
                                esModoImporte(claveModoNueva(lin.key))
                                  ? 'Usar precio unitario'
                                  : 'Usar importe total de la línea'
                              "
                              class="compra-precio-modo inline-flex items-center gap-1 rounded text-[11px] font-medium text-brand-600 transition hover:text-brand-700 disabled:opacity-40 dark:text-brand-400 dark:hover:text-brand-300"
                              :disabled="saving"
                              @click="
                                alternarModoPrecio(claveModoNueva(lin.key), () => Number(lin.cantidad))
                              "
                            >
                              {{ etiquetaMonto(claveModoNueva(lin.key)) }}
                              <AppIcon :name="ICONS.arrowLeftRight" :size="11" />
                            </button>
                            <MoneyInput
                              v-model="precioNuevoInputs[lin.key]"
                            :max-decimals="decimalesPrecio(claveModoNueva(lin.key))"
                            :max-integer-digits="enterosPrecio(claveModoNueva(lin.key))"
                              placeholder="0.00"
                              :disabled="saving"
                              :state="precioNuevoError(lin.key) ? 'error' : 'default'"
                              @blur="onBlurPrecioNuevo(lin.key)"
                            />
                            <p
                              v-if="precioUnitarioDerivadoTexto(claveModoNueva(lin.key), Number(lin.cantidad))"
                              class="compra-precio-hint text-[11px] text-gray-500 dark:text-gray-400"
                            >
                              {{
                                precioUnitarioDerivadoTexto(claveModoNueva(lin.key), Number(lin.cantidad))
                              }}
                            </p>
                          </div>
                        </td>
                        <td
                          class="px-3 py-2.5 text-right tabular-nums font-medium break-all text-gray-800 dark:text-white/90"
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

            <div
              v-if="lineas.length === 0 && !(desdeRecargaExterna && idRecargaPlantaNum)"
              class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center dark:border-gray-700"
            >
              <span
                class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5"
              >
                <AppIcon :name="ICONS.package" :size="18" />
              </span>
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Sin productos todavía</p>
              <p class="max-w-sm text-xs text-gray-500 dark:text-gray-400">
                Busca un producto arriba para agregarlo. También puedes registrar la compra sin
                líneas y agregarlas después.
              </p>
            </div>

            <div v-if="lineasManuales.length">
              <p v-if="desdeRecargaExterna && idRecargaPlantaNum" class="compra-subtitulo">
                Otros productos
              </p>
              <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <div class="overflow-x-auto">
                <table class="compra-detalle-table w-full min-w-[760px] table-fixed text-sm">
                  <thead class="bg-gray-50 dark:bg-white/5">
                    <tr>
                      <th class="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Producto
                      </th>
                      <th class="w-32 px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Cant.
                      </th>
                      <th class="w-56 px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Monto (IGV)
                      </th>
                      <th class="w-48 px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
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
                        <p
                          v-if="metaLinea(lin)"
                          class="mt-0.5 text-xs text-gray-500 dark:text-gray-400"
                        >
                          {{ metaLinea(lin) }}
                        </p>
                        <div class="mt-1.5 flex flex-wrap items-center gap-1">
                          <AppBadge v-if="lin.esGas" size="sm" variant="light" color="primary">
                            Gas
                          </AppBadge>
                          <AppBadge v-if="lin.esServicio" size="sm" variant="light" color="neutral">
                            Servicio
                          </AppBadge>
                          <AppBadge v-if="lin.esAlquilable" size="sm" variant="light" color="warning">
                            Alquilable
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
                        <div class="compra-precio">
                          <button
                            type="button"
                            :title="
                              esModoImporte(claveModoNueva(lin.key))
                                ? 'Usar precio unitario'
                                : 'Usar importe total de la línea'
                            "
                            class="compra-precio-modo inline-flex items-center gap-1 rounded text-[11px] font-medium text-brand-600 transition hover:text-brand-700 disabled:opacity-40 dark:text-brand-400 dark:hover:text-brand-300"
                            :disabled="saving"
                            @click="
                              alternarModoPrecio(claveModoNueva(lin.key), () => Number(lin.cantidad))
                            "
                          >
                            {{ etiquetaMonto(claveModoNueva(lin.key)) }}
                            <AppIcon :name="ICONS.arrowLeftRight" :size="11" />
                          </button>
                          <MoneyInput
                            v-model="precioNuevoInputs[lin.key]"
                            :max-decimals="decimalesPrecio(claveModoNueva(lin.key))"
                            :max-integer-digits="enterosPrecio(claveModoNueva(lin.key))"
                            placeholder="0.00"
                            :disabled="saving"
                            :state="precioNuevoError(lin.key) ? 'error' : 'default'"
                            @blur="onBlurPrecioNuevo(lin.key)"
                          />
                          <p
                            v-if="precioUnitarioDerivadoTexto(claveModoNueva(lin.key), Number(lin.cantidad))"
                            class="compra-precio-hint text-[11px] text-gray-500 dark:text-gray-400"
                          >
                            {{
                              precioUnitarioDerivadoTexto(claveModoNueva(lin.key), Number(lin.cantidad))
                            }}
                          </p>
                        </div>
                      </td>
                      <td
                        class="px-3 py-2.5 text-right tabular-nums font-medium break-all text-gray-800 dark:text-white/90"
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
            </div>

            <!-- Pie tipo factura: observaciones a la izquierda, totales a la derecha. -->
            <div
              class="grid grid-cols-1 gap-5 border-t border-gray-100 pt-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start dark:border-gray-800"
            >
              <AppTextarea
                v-model="glosa"
                label="Glosa / observaciones"
                placeholder="Opcional"
                :disabled="saving"
              />
              <dl
                v-if="lineas.length"
                class="compra-totales rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-white/3"
              >
                <div class="flex items-center justify-between gap-3">
                  <dt class="text-gray-500 dark:text-gray-400">Subtotal</dt>
                  <dd class="tabular-nums text-gray-700 dark:text-gray-300">
                    {{ formatMoney(totalesDetalle.valorVenta) }}
                  </dd>
                </div>
                <div class="mt-2 flex items-start justify-between gap-3">
                  <dt class="pt-2.5 text-gray-500 dark:text-gray-400">
                    <label for="compra-porcentaje-igv">% IGV</label>
                  </dt>
                  <dd class="w-28">
                    <AppInput
                      id="compra-porcentaje-igv"
                      v-model="porcentajeIgvInput"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      inputmode="decimal"
                      aria-label="Porcentaje de IGV"
                      :error="porcentajeIgvError"
                      :disabled="saving"
                    />
                  </dd>
                </div>
                <div class="mt-2 flex items-center justify-between gap-3">
                  <dt class="text-gray-500 dark:text-gray-400">{{ etiquetaIgv(porcentajeIgvValor) }}</dt>
                  <dd class="tabular-nums text-gray-700 dark:text-gray-300">
                    {{ formatMoney(totalesDetalle.igv) }}
                  </dd>
                </div>
                <div
                  class="mt-3 flex items-baseline justify-between gap-3 border-t border-gray-200 pt-3 dark:border-gray-700"
                >
                  <dt class="font-semibold text-gray-800 dark:text-white/90">Total</dt>
                  <dd class="text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
                    {{ formatMoney(totalesDetalle.total) }}
                  </dd>
                </div>
              </dl>
            </div>
          </DetailSectionCard>
        </template>
        <!-- EDIT -->
        <template v-else>
          <DetailSectionCard
            title="Datos de la compra"
            description="Proveedor, comprobante y almacén no se modifican; para corregirlos anula y vuelve a registrar."
            :icon="ICONS.receipt"
            :full-width="true"
          >
            <template #actions>
              <AppSwitch
                v-model="declararSunat"
                label="Declarar SUNAT"
                :help="DECLARAR_SUNAT_HELP"
                :disabled="saving"
              />
            </template>

            <div
              class="grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] dark:bg-white/3"
            >
              <div class="min-w-0">
                <p class="text-xs text-gray-500 dark:text-gray-400">Proveedor</p>
                <p class="truncate text-base font-semibold text-gray-800 dark:text-white/90">
                  {{ cabecera?.proveedor ?? '—' }}
                </p>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">Comprobante</p>
                <p class="font-medium tabular-nums text-gray-800 dark:text-white/90">
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
              <AppInput
                id="compra-porcentaje-igv"
                v-model="porcentajeIgvInput"
                label="% IGV"
                type="number"
                min="0"
                max="100"
                step="0.01"
                inputmode="decimal"
                :help="`Base ${formatMoney(totalesEdicion.valorVenta)} · ${etiquetaIgv(porcentajeIgvValor)} ${formatMoney(totalesEdicion.igv)}. Se recalcula al guardar.`"
                :error="porcentajeIgvError"
                :disabled="saving"
              />
            </div>

            <div class="border-t border-gray-100 pt-5 dark:border-gray-800">
              <p class="compra-subtitulo">Pago</p>
              <CompraPagoResumen
                :modalidad="etiquetaModalidadPago"
                :detalle="detallePago"
                :estado="estadoPago"
                :icono="esContado ? ICONS.banknote : ICONS.calendarRange"
                :total="formatMoney(totalParaCuotas)"
                :disabled="saving"
                @editar="pagoModalOpen = true"
              />
            </div>
            <AppTextarea v-model="glosa" label="Glosa / observaciones" placeholder="Opcional" :disabled="saving" />
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
                <table class="compra-detalle-table w-full min-w-[1040px] table-fixed text-sm">
                  <thead class="bg-gray-50 dark:bg-white/5">
                    <tr>
                      <th class="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Producto
                      </th>
                      <th class="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Almacén
                      </th>
                      <th class="w-32 px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Cant.
                      </th>
                      <th class="w-56 px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Monto (IGV)
                      </th>
                      <th class="w-48 px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
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
                          <div class="compra-precio">
                            <button
                              type="button"
                              :title="
                                esModoImporte(claveModoEdit(det.id))
                                  ? 'Usar precio unitario'
                                  : 'Usar importe total de la línea'
                              "
                              class="compra-precio-modo inline-flex items-center gap-1 rounded text-[11px] font-medium text-brand-600 transition hover:text-brand-700 disabled:opacity-40 dark:text-brand-400 dark:hover:text-brand-300"
                              :disabled="saving || lineaGuardando === det.id"
                              @click="
                                alternarModoPrecio(claveModoEdit(det.id), () =>
                                  Number(lineasDraft[det.id]?.cantidad ?? det.cantidad),
                                )
                              "
                            >
                              {{ etiquetaMonto(claveModoEdit(det.id)) }}
                              <AppIcon :name="ICONS.arrowLeftRight" :size="11" />
                            </button>
                            <MoneyInput
                              v-model="lineasDraft[det.id].precio"
                              :max-decimals="decimalesPrecio(claveModoEdit(det.id))"
                              :max-integer-digits="enterosPrecio(claveModoEdit(det.id))"
                              placeholder="0.00"
                              :disabled="saving || lineaGuardando === det.id"
                              :state="precioEditError(det.id) ? 'error' : 'default'"
                              @blur="onBlurPrecioEdit(det.id)"
                            />
                            <p
                              v-if="precioUnitarioDerivadoTexto(claveModoEdit(det.id), Number(lineasDraft[det.id]?.cantidad ?? det.cantidad))"
                              class="compra-precio-hint text-[11px] text-gray-500 dark:text-gray-400"
                            >
                              {{
                                precioUnitarioDerivadoTexto(
                                  claveModoEdit(det.id),
                                  Number(lineasDraft[det.id]?.cantidad ?? det.cantidad),
                                )
                              }}
                            </p>
                          </div>
                        </template>
                        <span v-else class="tabular-nums">
                          {{
                            det.precio_unitario != null
                              ? formatPrecioUnitario(det.precio_unitario, codigoMoneda)
                              : '—'
                          }}
                        </span>
                      </td>
                      <td
                        class="px-3 py-2.5 text-right tabular-nums font-medium break-all text-gray-800 dark:text-white/90"
                      >
                        {{ formatMoney(importeLineaExistiente(det)) }}
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

      <!-- Barra fija: el total y la acción principal siguen a la vista en formularios largos. -->
      <div
        class="sticky bottom-0 z-10 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-theme-md backdrop-blur sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-gray-900/95"
      >
        <div v-if="!isEdit" class="flex items-baseline gap-2 text-sm">
          <span class="text-gray-500 dark:text-gray-400">
            {{ lineas.length }} {{ lineas.length === 1 ? 'ítem' : 'ítems' }} · Total
          </span>
          <span class="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
            {{ formatMoney(totalesDetalle.total) }}
          </span>
        </div>
        <div class="flex gap-3 sm:ml-auto">
          <button
            type="button"
            class="flex flex-1 justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/3 sm:flex-none"
            :disabled="saving"
            @click="emit('cancel')"
          >
            Cancelar
          </button>
          <button
            type="submit"
            data-tutorial="compra-guardar"
            class="flex flex-1 justify-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none"
            :disabled="saving || (isEdit && loadingDetail)"
          >
            {{ saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar compra' }}
          </button>
        </div>
      </div>
    </form>

    <!--
      El pago se edita aquí pero vive en el formulario (sin borrador): cerrar el
      modal conserva lo elegido y se envía con la compra al guardar.
    -->
    <AppModal
      v-model="pagoModalOpen"
      title="Pago de la compra"
      :subtitle="`Total a pagar: ${formatMoney(isEdit ? totalParaCuotas : totalesDetalle.total)}`"
      size="lg"
    >
      <div class="space-y-5">
        <div>
          <AppSelectSearch
            v-model="idCondicionPago"
            label="Modalidad de pago"
            :placeholder="isEdit ? 'Seleccionar' : 'Contado'"
            :help="CONDICION_PAGO_HELP"
            :options="condicionPagoOptions"
            :loading="condicionesQuery.isFetching.value"
            :disabled="saving"
          />
          <div
            class="mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
            :class="
              esContado
                ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400'
                : 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
            "
          >
            <AppIcon
              :name="esContado ? ICONS.banknote : ICONS.calendarRange"
              :size="14"
              class="mt-0.5 shrink-0"
            />
            <span>{{ resumenModalidadPago }}</span>
          </div>
        </div>

        <CompraPagoPreview
          v-if="esPlanCuotas || esCreditoPago"
          :modo="esPlanCuotas ? 'cuotas' : 'credito'"
          v-model:cuotas="cuotasPlan"
          v-model:fecha-vencimiento="fechaVencimientoCredito"
          v-model:dia-mes-pago="diaMesPagoEditable"
          :total="totalParaCuotas"
          :dias-credito="Number(condicionPagoSeleccionada?.dias_credito ?? 0)"
          :disabled="saving"
        />
        <div v-else class="border-t border-gray-100 pt-5 dark:border-gray-800">
          <p class="compra-subtitulo">¿Con qué se pagó?</p>
          <MedioPagoCuentaField
            v-model:id-medio-pago="pagoContado.idMedioPago"
            v-model:id-cuenta-bancaria="pagoContado.idCuentaBancaria"
            v-model:numero-operacion="pagoContado.numeroOperacion"
            :medio-requerido="medioPagoRequerido"
            :disabled="saving"
            :mostrar-errores="submitCount > 0"
            mostrar-siempre-numero-operacion
            excluir-credito
          />
          <p class="mt-3 flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <AppIcon :name="ICONS.info" :size="13" class="mt-0.5 shrink-0" />
            <span>{{ avisoPagoContado }}</span>
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <button
            type="button"
            class="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
            @click="pagoModalOpen = false"
          >
            Listo
          </button>
        </div>
      </template>
    </AppModal>

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
import { debeLimpiarRecargaPorProveedor } from '@/modules/compras/utils/proveedorRecarga'
import {
  PORCENTAJE_IGV_DEFAULT,
  etiquetaIgv,
  parsePorcentajeIgv,
  tasaIgvDesdePorcentaje,
} from '@/modules/compras/utils/porcentajeIgv'
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
import CompraPagoResumen from '@/modules/compras/components/CompraPagoResumen.vue'
import MedioPagoCuentaField from '@/modules/finanzas/components/MedioPagoCuentaField.vue'
import { useMediosPagoQuery } from '@/modules/finanzas/composables/useMediosPagoQuery'
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
  AppDatePicker,
  AppHelpTip,
  AppModal,
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
  formatPrecioUnitario,
  mensajeErrorMontoMoneda,
  parseMoneyInput,
  precioUnitarioDesdeImporte,
  roundMoney,
  roundPrecioUnitario,
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
  authStore.hasPermission(PermisoBanderas.CATALOGOS_EDITAR),
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

const { defineField, handleSubmit, resetForm, errors, submitCount } = useForm({
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
  'Contado: indica con qué pagaste; el pago sale de la caja de la sucursal en la fecha de la compra (no lo registres además como gasto de caja). Crédito o cuotas: verás un preview editable y al guardar se crea la cuenta por pagar; cada pago que registres sobre ella sale de la caja de la sucursal.'

const lineas = reactive<CompraLineaForm[]>([])
const lineasExistentes = computed(() => compraData.value?.detalle ?? [])

const lineaEliminando = ref<number | null>(null)
const lineaGuardando = ref<number | null>(null)
const lineasDraft = reactive<Record<number, { cantidad: number; precio: string }>>({})
const precioNuevoInputs = reactive<Record<string, string>>({})

/**
 * Cómo se captura el monto de cada línea.
 *
 * - UNITARIO: se escribe el precio unitario (lo de siempre).
 * - IMPORTE: se escribe el importe total de la línea tal como figura en la
 *   factura y el P. unitario se deriva (importe / cantidad) con 6 decimales,
 *   que es lo que admite `com_comprobante_compra_detalle.precio_unitario`.
 *
 * El monto capturado vive siempre en `precioNuevoInputs` / `lineasDraft.precio`:
 * lo que cambia es la etiqueta y cómo se interpreta. Así el campo vacío por
 * defecto mantiene el comportamiento actual.
 */
type ModoPrecioLinea = 'UNITARIO' | 'IMPORTE'
const modoPrecioLinea = reactive<Record<string, ModoPrecioLinea>>({})

/** Clave de modo compartida por líneas nuevas (`lin.key`) y existentes (`edit-<id>`). */
function claveModoNueva(key: string) {
  return key
}
function claveModoEdit(id: number) {
  return `edit-${id}`
}

function modoPrecioDe(clave: string): ModoPrecioLinea {
  return modoPrecioLinea[clave] ?? 'UNITARIO'
}

function esModoImporte(clave: string): boolean {
  return modoPrecioDe(clave) === 'IMPORTE'
}

/**
 * Alterna UNITARIO <-> IMPORTE conservando el monto: al pasar a IMPORTE se
 * multiplica el P. unitario por la cantidad, y al volver se divide el importe.
 * Si no hay monto capturado se cambia solo la etiqueta.
 */
function alternarModoPrecio(clave: string, cantidad: () => number) {
  const actual = modoPrecioDe(clave)
  const destino: ModoPrecioLinea = actual === 'UNITARIO' ? 'IMPORTE' : 'UNITARIO'

  modoPrecioLinea[clave] = destino
  if (actual === 'UNITARIO') {
    const unitario = parsePrecioLinea(getPrecioInput(clave))
    if (unitario != null && unitario > 0) setPrecioInput(clave, unitario * cantidad())
  } else {
    const importe = parsePrecioLinea(getPrecioInput(clave))
    const derivado = precioUnitarioDesdeImporte(importe, cantidad())
    if (derivado != null && derivado > 0) setPrecioInput(clave, derivado)
  }

  modoPrecioLinea[clave] = destino
}

/** Lectura/escritura del monto capturado según la línea (nueva o existente). */
function getPrecioInput(clave: string): string {
  if (clave.startsWith('edit-')) return lineasDraft[Number(clave.slice(5))]?.precio ?? ''
  return precioNuevoInputs[clave] ?? ''
}

function setPrecioInput(clave: string, value: number) {
  const texto = formatearPrecioInput(value, clave)
  if (clave.startsWith('edit-')) {
    const draft = lineasDraft[Number(clave.slice(5))]
    if (draft) draft.precio = texto
    return
  }
  precioNuevoInputs[clave] = texto
}

/** Etiqueta de la columna/celda de monto según el modo de la línea. */
function etiquetaMonto(clave: string): string {
  return esModoImporte(clave) ? 'Importe total (IGV)' : 'P. unit. (IGV)'
}

function decimalesPrecio(clave: string): number {
  return esModoImporte(clave) ? 2 : 6
}

/**
 * Tope de importe de una línea y del comprobante: `importe` y `total_importe`
 * son `numeric(12,4)`, así que admiten hasta 8 dígitos enteros.
 */
const MAX_IMPORTE_COMPRA = 99_999_999.9999

/** Enteros admitidos: `precio_unitario numeric(12,6)` → 6; importe `numeric(12,4)` → 8. */
function enterosPrecio(clave: string): number {
  return esModoImporte(clave) ? 8 : 6
}

function precioLineaOpts(clave: string) {
  return {
    min: 0,
    allowZero: true,
    maxDecimals: decimalesPrecio(clave),
    maxEnteros: enterosPrecio(clave),
  }
}

function errorImporteExcedido(importe: number): string {
  return importe > MAX_IMPORTE_COMPRA
    ? `El importe no puede superar ${formatMoney(MAX_IMPORTE_COMPRA)}`
    : ''
}

function formatearPrecioInput(value: number, clave: string): string {
  return esModoImporte(clave) ? roundMoney(value).toFixed(2) : montoPrecioAString(value)
}

function montoPrecioAString(value: number | string | null | undefined): string {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n) || n <= 0) return ''
  return roundPrecioUnitario(n).toFixed(6).replace(/(\.\d{2}\d*?)0+$/, '$1')
}

function parsePrecioLinea(raw: string | undefined): number | null {
  const texto = String(raw ?? '').trim()
  if (!texto) return null
  return parseMoneyInput(texto)
}

function esPrecioLineaValido(raw: string | undefined, clave: string): boolean {
  const texto = String(raw ?? '').trim()
  if (!texto) return true
  return esMontoMonedaValido(texto, precioLineaOpts(clave))
}

function precioNuevoError(key: string): string {
  const msg = mensajeErrorMontoMoneda(precioNuevoInputs[key] ?? '', precioLineaOpts(claveModoNueva(key)))
  if (msg) return msg
  const lin = lineas.find((l) => l.key === key)
  return lin ? errorImporteExcedido(importeLinea(lin)) : ''
}

function precioEditError(id: number): string {
  return mensajeErrorMontoMoneda(lineasDraft[id]?.precio ?? '', precioLineaOpts(claveModoEdit(id))) ?? ''
}

function onBlurPrecioNuevo(key: string) {
  const msg = mensajeErrorMontoMoneda(precioNuevoInputs[key] ?? '', precioLineaOpts(claveModoNueva(key)))
  if (msg) return
  const n = parseMoneyInput(precioNuevoInputs[key])
  if (n != null) precioNuevoInputs[key] = formatearPrecioInput(n, claveModoNueva(key))
}

function onBlurPrecioEdit(id: number) {
  const draft = lineasDraft[id]
  if (!draft) return
  const msg = mensajeErrorMontoMoneda(draft.precio, precioLineaOpts(claveModoEdit(id)))
  if (msg) return
  const n = parseMoneyInput(draft.precio)
  if (n != null) draft.precio = formatearPrecioInput(n, claveModoEdit(id))
}

function quitarLineaNuevaPorKey(key: string) {
  const index = lineas.findIndex((lin) => lin.key === key)
  if (index >= 0) lineas.splice(index, 1)
  delete precioNuevoInputs[key]
  delete modoPrecioLinea[claveModoNueva(key)]
}

/**
 * Importe de la línea. En modo IMPORTE es el monto capturado; en modo UNITARIO
 * es el P. unitario por la cantidad.
 */
function importeLinea(lin: CompraLineaForm) {
  const capturado = parsePrecioLinea(precioNuevoInputs[lin.key]) ?? 0
  if (esModoImporte(claveModoNueva(lin.key))) return capturado
  return capturado * Number(lin.cantidad)
}

/**
 * Importe mostrado en una línea ya guardada. Usa el draft si la cantidad cambió;
 * si no hay monto capturado todavía, cae al P. unitario guardado.
 */
function importeLineaExistiente(det: CompraDetalle): number {
  const draft = lineasDraft[det.id]
  const cantidad = Number(draft?.cantidad ?? det.cantidad)
  const capturado = draft ? parsePrecioLinea(draft.precio) : null
  const base = capturado ?? (Number(det.precio_unitario) || 0)
  if (esModoImporte(claveModoEdit(det.id))) {
    return capturado != null ? capturado : base * cantidad
  }
  return base * cantidad
}

/** Texto del P. unitario derivado, para mostrarlo bajo el importe capturado. */
function precioUnitarioDerivadoTexto(clave: string, cantidad: number): string {
  if (!esModoImporte(clave)) return ''
  const derivado = precioUnitarioDesdeImporte(parsePrecioLinea(getPrecioInput(clave)), cantidad)
  if (derivado == null || derivado <= 0) return ''
  return `≈ ${formatPrecioUnitario(derivado, codigoMoneda.value)} / unidad`
}

function validarPreciosLineas(mostrarToast = true): boolean {
  for (const lin of lineas) {
    const clave = claveModoNueva(lin.key)
    if (!esPrecioLineaValido(precioNuevoInputs[lin.key], claveModoNueva(lin.key))) {
      if (mostrarToast) {
        toastWarning(
          esModoImporte(clave)
            ? `Importe inválido en ${lin.productoLabel}: hasta 8 enteros y 2 decimales`
            : `Precio unitario inválido en ${lin.productoLabel}: hasta 6 enteros y 6 decimales`,
        )
      }
      return false
    }

    const excedido = errorImporteExcedido(importeLinea(lin))
    if (excedido) {
      if (mostrarToast) toastWarning(`${lin.productoLabel}: ${excedido}`)
      return false
    }

    // En modo IMPORTE el P. unitario sale de importe / cantidad: sin cantidad
    // positiva no hay nada que derivar y el backend guardaría un precio inventado.
    if (esModoImporte(clave) && parsePrecioLinea(precioNuevoInputs[lin.key]) != null) {
      if (precioUnitarioDesdeImporte(precioNuevoInputs[lin.key], Number(lin.cantidad)) == null) {
        if (mostrarToast) {
          toastWarning(`Indica la cantidad de ${lin.productoLabel} para calcular el importe`)
        }
        return false
      }
    }
  }

  const totalExcedido = errorImporteExcedido(totalLineas.value)
  if (totalExcedido) {
    if (mostrarToast) toastWarning(`Total de la compra: ${totalExcedido}`)
    return false
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
  const base: SelectOption[] = [
    ...(proveedoresQuery.data.value?.data ?? []),
    ...(clienteProveedoresQuery.data.value?.data ?? []),
  ].map((c) => ({ value: c.id, label: getClienteOptionLabel(c) }))
  const recarga = recargaPlantaDetalleQuery.data.value
  // El proveedor de la orden puede no estar en la primera página del buscador.
  if (
    recarga?.id === idRecargaPlantaNum.value &&
    recarga.id_proveedor &&
    recarga.nombre_proveedor &&
    !base.some((opt) => Number(opt.value) === Number(recarga.id_proveedor))
  ) {
    base.unshift({ value: recarga.id_proveedor, label: recarga.nombre_proveedor })
  }
  if (
    proveedorCreadoOption.value &&
    !base.some((opt) => String(opt.value) === String(proveedorCreadoOption.value!.value))
  ) {
    base.unshift(proveedorCreadoOption.value)
  }
  return base
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
    ? 'Gases de la orden y extras'
    : 'Detalle de productos',
)
const descripcionDetalleProductos = computed(() =>
  desdeRecargaExterna.value && idRecargaPlantaNum.value
    ? 'Indica cuánto cargó la planta por cada gas y su precio.'
    : 'Opcional: puedes registrar la compra sin líneas y agregarlas después.',
)

/** Unidad, categoría, presentación y marca en una sola línea secundaria. */
function metaLinea(lin: CompraLineaForm): string {
  return [lin.nombreUnidadMedida, lin.nombreCategoria, lin.presentacion, lin.marca]
    .filter(Boolean)
    .join(' · ')
}
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

watch(idProveedor, (id, anterior) => {
  const idNum = id !== '' && id != null ? Number(id) : undefined
  recargaPlantaFilters.value = { ...RECARGA_PLANTA_FILTROS_BASE, idProveedor: idNum }
  if (suppressRecargaPlantaReset.value) return
  const recarga = recargaPlantaDetalleQuery.data.value
  const proveedorOrden =
    recarga?.id === idRecargaPlantaNum.value ? recarga?.id_proveedor : null
  if (!debeLimpiarRecargaPorProveedor(id, anterior, proveedorOrden)) return
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
      delete modoPrecioLinea[lineas[i].key]
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
const almacenOptions = computed(() =>
  (almacenesQuery.data.value?.data ?? []).map((almacen) => ({
    value: almacen.id,
    label: almacen.nombre,
  })),
)

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

// Compra al contado: se paga en el momento, como un gasto de caja pero con
// comprobante. El backend la suma a los pagos a proveedor de la caja de la
// sucursal en la fecha de la compra.
const esContado = computed(() => !esPlanCuotas.value && !esCreditoPago.value)
const resumenModalidadPago = computed(() => {
  if (esPlanCuotas.value) {
    return `Se crea una cuenta por pagar en ${numeroCuotasCondicion.value} cuotas; cada pago se registra después en Finanzas.`
  }
  if (esCreditoPago.value) {
    const dias = Number(condicionPagoSeleccionada.value?.dias_credito ?? 0)
    return `Se crea una cuenta por pagar a ${dias} días; el pago se registra después en Finanzas.`
  }
  return 'Se paga en el momento: queda registrado como pago a proveedor en la fecha de la compra.'
})
const pagoContado = reactive({
  idMedioPago: null as number | null,
  idCuentaBancaria: null as number | null,
  numeroOperacion: '',
})
const pagoModalOpen = ref(false)
// Al editar, una compra al contado registrada antes de guardar el medio puede
// seguir sin él; solo se exige al pasar de crédito a contado.
const medioPagoRequerido = computed(
  () => esContado.value && (!isEdit.value || Boolean(compraData.value?.cuenta_por_pagar)),
)
const mediosPagoQuery = useMediosPagoQuery()
const medioPagoContado = computed(
  () => (mediosPagoQuery.data.value ?? []).find((m) => m.id === pagoContado.idMedioPago) ?? null,
)
// Mismas reglas que MedioPagoCuentaField, pero calculadas aquí: el campo vive
// en un modal que no está montado al guardar.
const pagoContadoCompleto = computed(() => {
  const medio = medioPagoContado.value
  if (!medio) return !medioPagoRequerido.value
  if (medio.requiereCuentaBancaria && !pagoContado.idCuentaBancaria) return false
  if (medio.requiereNumeroOperacion && !pagoContado.numeroOperacion.trim()) return false
  return true
})
const etiquetaModalidadPago = computed(
  () =>
    condicionPagoOptions.value.find((o) => Number(o.value) === Number(idCondicionPago.value))
      ?.label ?? 'Contado',
)
const detallePago = computed(() => {
  if (esPlanCuotas.value) {
    const primera = cuotasPlan.value[0]?.fechaPago
    return `${cuotasPlan.value.length} cuotas${primera ? ` · la primera vence el ${formatListDate(primera)}` : ''}`
  }
  if (esCreditoPago.value) {
    return fechaVencimientoCredito.value
      ? `Vence el ${formatListDate(fechaVencimientoCredito.value)}`
      : 'Sin fecha de vencimiento'
  }
  const medio = medioPagoContado.value
  if (!medio) {
    return medioPagoRequerido.value ? 'Falta indicar con qué se pagó' : 'Sin medio de pago registrado'
  }
  if (!pagoContadoCompleto.value) return `${medio.nombre} · faltan datos del pago`
  const cuenta = medio.cuentas.find((c) => c.id === pagoContado.idCuentaBancaria)
  const operacion = pagoContado.numeroOperacion.trim()
  return [medio.nombre, cuenta?.alias ?? cuenta?.banco, operacion ? `Op. ${operacion}` : null]
    .filter(Boolean)
    .join(' · ')
})
const estadoPago = computed<'ok' | 'pendiente' | 'error'>(() => {
  if (!esContado.value || pagoContadoCompleto.value) return 'ok'
  return submitCount.value > 0 ? 'error' : 'pendiente'
})
const avisoPagoContado = computed(() => {
  const medio = medioPagoContado.value
  if (!medio) return 'Indica con qué se pagó. No lo registres además como gasto de caja: se duplicaría la salida.'
  const fechaPago = fechaParaCuotas.value ? formatListDate(fechaParaCuotas.value) : 'la fecha de la compra'
  if (!medio.afectaCaja) {
    return `Se registra como pago a proveedor del ${fechaPago} por ${medio.nombre}; no cambia el efectivo del arqueo.`
  }
  const sucursal = isEdit.value
    ? cabecera.value?.sucursal
    : sucursalOptions.value.find((o) => Number(o.value) === Number(idSucursal.value))?.label
  return sucursal
    ? `Sale de la caja de ${sucursal} del ${fechaPago}: esa caja debe estar abierta.`
    : 'Pagada con un medio que afecta caja: selecciona la sucursal de cuya caja sale el pago.'
})
const payloadPagoContado = () =>
  esContado.value && pagoContado.idMedioPago
    ? {
        idMedioPago: pagoContado.idMedioPago,
        idCuentaBancaria: pagoContado.idCuentaBancaria ?? undefined,
        numeroOperacion: pagoContado.numeroOperacion.trim() || undefined,
      }
    : {}
const totalLineas = computed(() => lineas.reduce((acc, lin) => acc + importeLinea(lin), 0))
// % de IGV de la compra (18 por defecto; 0 es válido). Al editar se carga el guardado.
const porcentajeIgvInput = ref<string | number | null>(PORCENTAJE_IGV_DEFAULT)
const porcentajeIgvCargado = ref<number>(PORCENTAJE_IGV_DEFAULT)
const porcentajeIgvParse = computed(() => parsePorcentajeIgv(porcentajeIgvInput.value))
const porcentajeIgvValor = computed(() =>
  porcentajeIgvParse.value.ok ? porcentajeIgvParse.value.valor : PORCENTAJE_IGV_DEFAULT,
)
const porcentajeIgvError = computed(() =>
  porcentajeIgvParse.value.ok ? undefined : porcentajeIgvParse.value.error,
)
const tasaIgv = computed(() => tasaIgvDesdePorcentaje(porcentajeIgvValor.value))
const totalesDetalle = computed(() => calcularTotalesDesdeImporte(totalLineas.value, tasaIgv.value))
// Alta: el % solo se ve con líneas; sin ellas vuelve a 18 para que un valor oculto no bloquee el guardado.
watch(
  () => lineas.length,
  (n) => {
    if (!isEdit.value && n === 0) porcentajeIgvInput.value = PORCENTAJE_IGV_DEFAULT
  },
)
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
/** Edición: base e IGV del total vigente con el % capturado (vista previa). */
const totalesEdicion = computed(() =>
  calcularTotalesDesdeImporte(totalParaCuotas.value, tasaIgv.value),
)
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
  // A 6 decimales: el P. unitario guardado puede venir derivado del importe y
  // traer decimales que un roundMoney a 2 perdería, marcando la línea como
  // modificada aunque no se haya tocado nada.
  const precioOrig = det.precio_unitario == null ? 0 : roundPrecioUnitario(det.precio_unitario)
  const precioDraft = precioUnitarioDraft(det)
  return Number(draft.cantidad) !== Number(det.cantidad) || precioDraft !== precioOrig
}

/** P. unitario que se enviaría al guardar la línea, sea capturado o derivado. */
function precioUnitarioDraft(det: CompraDetalle): number {
  const draft = lineasDraft[det.id]
  if (!draft) return 0
  const capturado = parsePrecioLinea(draft.precio) ?? 0
  if (!esModoImporte(claveModoEdit(det.id))) return roundPrecioUnitario(capturado)
  return precioUnitarioDesdeImporte(capturado, Number(draft.cantidad)) ?? 0
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

  const esImporte = esModoImporte(claveModoEdit(det.id))
  if (!esPrecioLineaValido(draft.precio, claveModoEdit(det.id))) {
    toastWarning(
      esImporte
        ? 'Importe inválido: hasta 8 enteros y 2 decimales'
        : 'Precio unitario inválido: hasta 6 enteros y 6 decimales',
    )
    return
  }

  const excedido = errorImporteExcedido(importeLineaExistiente(det))
  if (excedido) {
    toastWarning(excedido)
    return
  }

  if (esImporte && parsePrecioLinea(draft.precio) != null) {
    if (precioUnitarioDesdeImporte(draft.precio, cantidad) == null) {
      toastWarning('Indica una cantidad mayor a cero para calcular el precio unitario')
      return
    }
  }

  const precio = esImporte
    ? precioUnitarioDesdeImporte(draft.precio, cantidad) ?? 0
    : roundPrecioUnitario(parsePrecioLinea(draft.precio) ?? 0)

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
  for (const key of Object.keys(modoPrecioLinea)) {
    delete modoPrecioLinea[key]
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
  for (const key of Object.keys(modoPrecioLinea)) {
    delete modoPrecioLinea[key]
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
    pagoContado.idMedioPago = data.cabecera.id_medio_pago ?? null
    pagoContado.idCuentaBancaria = data.cabecera.id_cuenta_bancaria ?? null
    pagoContado.numeroOperacion = data.cabecera.numero_operacion ?? ''
    const igvGuardado = parsePorcentajeIgv(data.cabecera.porcentaje_igv)
    porcentajeIgvCargado.value = igvGuardado.ok ? igvGuardado.valor : PORCENTAJE_IGV_DEFAULT
    porcentajeIgvInput.value = porcentajeIgvCargado.value
  },
)

const onSubmit = handleSubmit(async (values) => {
  const userId = authStore.user?.id
  if (!userId) return

  const toOptionalNumber = (value: string | number | undefined) =>
    value !== '' && value != null ? Number(value) : undefined

  if (esContado.value && !pagoContadoCompleto.value) {
    pagoModalOpen.value = true
    return
  }

  const igv = porcentajeIgvParse.value
  if (!igv.ok) {
    toastWarning(igv.error)
    return
  }

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
        ...payloadPagoContado(),
        porcentajeIgv: igv.valor !== porcentajeIgvCargado.value ? igv.valor : undefined,
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
    const capturado = parsePrecioLinea(precioNuevoInputs[l.key])
    // En modo IMPORTE el P. unitario sale del importe capturado con 6 decimales,
    // que es lo que admite numeric(12,6) y hace que el importe de la línea
    // vuelva a ser exactamente el de la factura.
    const precioUnitario = esModoImporte(claveModoNueva(l.key))
      ? (precioUnitarioDesdeImporte(capturado, Number(l.cantidad)) ?? 0)
      : roundPrecioUnitario(capturado ?? 0)

    return {
      idProducto: l.idProducto,
      cantidad: Number(l.cantidad),
      precioUnitario: capturado != null && capturado > 0 ? precioUnitario : undefined,
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
    ...payloadPagoContado(),
    porcentajeIgv: igv.valor,
    detalles,
  })
  emit('saved', created.cabecera.id)
})
</script>

<style scoped>
/* Keep long amounts inside their column without squeezing the editable fields. */
.compra-detalle-table td {
  overflow-wrap: anywhere;
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
}

.compra-totales > div {
  min-width: 0;
  overflow-wrap: anywhere;
}

/* Etiqueta-toggle arriba y ayuda abajo flotan para que el input quede alineado con la cantidad. */
.compra-precio {
  position: relative;
}

.compra-precio-modo {
  position: absolute;
  bottom: calc(100% + 0.25rem);
  left: 0;
  white-space: nowrap;
}

.compra-precio-hint {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  white-space: nowrap;
}

/* Rótulo de subgrupo dentro de una tarjeta. */
.compra-subtitulo {
  margin-bottom: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-gray-500);
}

:global(.dark) .compra-subtitulo {
  color: var(--color-gray-400);
}
</style>
