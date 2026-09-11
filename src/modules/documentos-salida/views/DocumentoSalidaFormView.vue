<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div
      v-if="!documentoId"
      class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]"
    >
      <h3 class="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
        Nuevo documento de salida
      </h3>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppSelect
          v-model="form.codigoTipoOrden"
          label="Tipo de orden"
          required
          :options="tipoOrdenOptions"
        />
        <AppSelect v-model="form.idSucursal" label="Sucursal" required :options="sucursalOptions" />
        <AppSelect
          v-model="form.idAlmacen"
          :label="isTraslado ? 'Almacén de origen' : 'Almacén'"
          required
          :options="almacenOptions"
        />
        <!--
          Solo en traslado: es el dato con el que el movimiento descuenta de un
          almacén y suma en el otro. Sin él la orden no se puede generar.
        -->
        <AppSelect
          v-if="isTraslado"
          v-model="form.idAlmacenDestino"
          label="Almacén de destino"
          required
          :options="almacenDestinoOptions"
          :error="errorAlmacenDestino"
        />
        <!-- La fecha del documento es la de emisión: siempre hoy, no se elige. -->
        <AppInput :model-value="form.fecha" label="Fecha" disabled />
        <AppDatePicker v-model="form.fechaTraslado" label="Fecha de traslado" />

        <ClienteSelectField
          v-if="form.codigoTipoOrden !== 'RECARGA_PLANTA_EXTERNA'"
          v-model="form.idCliente"
          label="Cliente"
          searchable
        />
        <ClienteSelectField
          v-if="form.codigoTipoOrden === 'RECARGA_PLANTA_EXTERNA'"
          v-model="form.idProveedor"
          label="Proveedor (planta)"
          solo-proveedores
          searchable
        />
        <ClienteSelectField
          v-model="form.idDestinatario"
          label="Destinatario (opcional)"
          searchable
        />

        <!--
          Peso y bultos se piden acá y no al convertir a guía: son datos del
          despacho, y la GRE los reutiliza en vez de volver a pedirlos.
        -->
        <AppInput
          v-model.number="form.pesoBruto"
          type="number"
          min="0"
          step="0.01"
          label="Peso bruto (kg)"
          placeholder="Ej. 82.5"
        />
        <AppInput
          v-model.number="form.numeroBultos"
          type="number"
          min="0"
          step="1"
          label="N° de bultos"
          placeholder="Ej. 3"
        />

      </div>

      <div class="mt-6 border-t border-gray-100 pt-5 dark:border-gray-800">
        <div class="mb-3 flex items-center gap-2">
          <div
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400"
          >
            <AppIcon :name="ICONS.shoppingCart" :size="15" />
          </div>
          <h4 class="text-sm font-bold tracking-tight text-gray-800 dark:text-white/90">Detalle</h4>
          <span class="text-xs text-gray-400">
            {{ lineasBorrador.length }} ítem{{ lineasBorrador.length === 1 ? '' : 's' }}
          </span>
        </div>

        <DocSalidaDetalleEditor
          :id-almacen="form.idAlmacen === '' ? null : Number(form.idAlmacen)"
          :lineas="lineasBorradorDetalle"
          :permitir-otros-productos="!isRecargaPlanta"
          :disabled="createMutation.isPending.value || guardandoLineas"
          vacio-balones="Sin balones. Se guardan junto con el documento."
          vacio-productos="Sin productos adicionales. Se guardan junto con el documento."
          @agregar-balon="onAgregarLineaBorrador"
          @set-producto="onSetProductoBorrador"
          @quitar="onQuitarLineaBorrador"
        />
      </div>

      <div class="mt-6 border-t border-gray-100 pt-5 dark:border-gray-800">
        <AppTextarea
          v-model="form.observaciones"
          label="Observaciones"
          :rows="2"
          placeholder="Ej. Envío prioritario — revisar presión de balones"
        />
      </div>

      <div class="mt-5 flex justify-end gap-2">
        <router-link
          :to="{ name: 'admin-documentos-salida' }"
          class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
        >
          Cancelar
        </router-link>
        <button
          type="button"
          class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-70"
          :disabled="!canSubmitHeader || createMutation.isPending.value"
          @click="submitHeader"
        >
          {{ textoBotonCrear }}
        </button>
      </div>
    </div>

    <!-- Documento ya creado -->
    <div v-else-if="documento" class="space-y-5">
      <!-- Cabecera -->
      <div
        class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]"
      >
        <div
          class="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/75 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400"
            >
              <AppIcon :name="ICONS.fileText" :size="20" />
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2.5">
                <h2 class="text-lg font-bold tracking-tight text-gray-900 dark:text-white/90">
                  {{ documento.numero }}
                </h2>
                <AppBadge size="sm" :color="estadoCicloColor(documento.nombre_estado_ciclo)">
                  {{ documento.nombre_estado_ciclo }}
                </AppBadge>
                <AppBadge
                  v-if="documento.nombre_estado_sunat"
                  size="sm"
                  :color="estadoSunatColor(documento.nombre_estado_sunat)"
                >
                  SUNAT: {{ documento.nombre_estado_sunat }}
                </AppBadge>
              </div>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Tipo:
                <span class="font-medium text-gray-700 dark:text-gray-300">{{
                  formatTipoOrden(documento.nombre_tipo_orden)
                }}</span>
              </p>
            </div>
          </div>

          <div v-if="documento.detalle_desde_venta" class="flex items-center gap-2 text-xs">
            <span class="text-gray-400">Venta ref:</span>
            <router-link
              :to="{ name: 'admin-ventas-comprobantes', query: { id: String(documento.id_venta) } }"
              class="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 font-semibold text-brand-600 shadow-theme-xs transition-colors hover:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-brand-400"
            >
              <AppIcon :name="ICONS.receipt" :size="12" />
              {{ documento.serie_venta }}-{{ documento.numero_venta }}
            </router-link>
          </div>
        </div>

        <div class="space-y-6 p-6">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div
              class="space-y-3 rounded-lg border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
            >
              <div
                class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                <AppIcon :name="ICONS.mapPin" :size="14" />
                <span>Ubicación y emisión</span>
              </div>
              <div class="space-y-2 text-xs">
                <div>
                  <span class="block text-[11px] text-gray-400">Sucursal</span>
                  <span class="font-semibold text-gray-800 dark:text-white/90">{{
                    documento.nombre_sucursal ?? '—'
                  }}</span>
                </div>
                <div>
                  <span class="block text-[11px] text-gray-400">Almacén de origen</span>
                  <span class="font-semibold text-gray-800 dark:text-white/90">{{
                    documento.nombre_almacen ?? '—'
                  }}</span>
                </div>
                <div v-if="documento.nombre_almacen_destino">
                  <span class="block text-[11px] text-gray-400">Almacén de destino</span>
                  <span class="font-semibold text-gray-800 dark:text-white/90">{{
                    documento.nombre_almacen_destino
                  }}</span>
                </div>
                <div>
                  <span class="block text-[11px] text-gray-400">Fecha de emisión</span>
                  <span
                    class="mt-0.5 flex items-center gap-1.5 font-semibold text-gray-800 dark:text-white/90"
                  >
                    <AppIcon :name="ICONS.calendar" :size="13" class="text-gray-400" />
                    {{ documento.fecha }}
                  </span>
                </div>
              </div>
            </div>

            <div
              class="space-y-3 rounded-lg border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
            >
              <div
                class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                <AppIcon :name="ICONS.userCheck" :size="14" />
                <span>Cliente y destinatario</span>
              </div>
              <div class="space-y-2 text-xs">
                <div v-if="documento.nombre_cliente">
                  <span class="block text-[11px] text-gray-400">Cliente</span>
                  <span class="font-semibold text-gray-800 dark:text-white/90">{{
                    documento.nombre_cliente
                  }}</span>
                </div>
                <!--
                  En recarga/retorno de planta externa la carga va (o vuelve) del
                  proveedor: él ES el destinatario del documento, no un tercero.
                -->
                <div v-if="documento.nombre_proveedor">
                  <span class="block text-[11px] text-gray-400">
                    {{ isRecargaPlanta ? 'Destinatario (planta externa)' : 'Proveedor' }}
                  </span>
                  <span class="font-semibold text-gray-800 dark:text-white/90">{{
                    documento.nombre_proveedor
                  }}</span>
                </div>
                <div v-if="documento.nombre_destinatario">
                  <span class="block text-[11px] text-gray-400">Destinatario</span>
                  <span class="font-semibold text-gray-800 dark:text-white/90">{{
                    documento.nombre_destinatario
                  }}</span>
                </div>
                <p
                  v-if="
                    !documento.nombre_cliente &&
                    !documento.nombre_proveedor &&
                    !documento.nombre_destinatario
                  "
                  class="text-gray-400"
                >
                  Sin cliente/proveedor asociado
                </p>
              </div>
            </div>

            <div
              class="space-y-3 rounded-lg border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
            >
              <div
                class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                <AppIcon :name="ICONS.fileText" :size="14" />
                <span>Detalle de operación</span>
              </div>
              <div class="space-y-2 text-xs">
                <div v-if="documento.detalle_desde_venta">
                  <span class="block text-[11px] text-gray-400"
                    >Comprobante de venta vinculado</span
                  >
                  <router-link
                    :to="{
                      name: 'admin-ventas-comprobantes',
                      query: { id: String(documento.id_venta) },
                    }"
                    class="mt-0.5 inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {{ documento.serie_venta }}-{{ documento.numero_venta }}
                    <AppIcon :name="ICONS.externalLink" :size="11" class="text-gray-400" />
                  </router-link>
                </div>
                <div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="block text-[11px] text-gray-400">Observaciones</span>
                    <button
                      v-if="puedeEditarObservaciones && !editandoObservaciones"
                      type="button"
                      class="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400"
                      @click="abrirObservaciones"
                    >
                      <AppIcon :name="ICONS.pencil" :size="11" />
                      {{ documento.observaciones ? 'Editar' : 'Agregar' }}
                    </button>
                  </div>

                  <template v-if="editandoObservaciones">
                    <AppTextarea
                      v-model="observacionesBorrador"
                      :rows="3"
                      class="mt-1"
                      placeholder="Ej. Envío prioritario — revisar presión de balones"
                    />
                    <div class="mt-1.5 flex justify-end gap-2">
                      <button
                        type="button"
                        class="rounded-lg border border-gray-300 px-2.5 py-1 text-[11px] font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
                        @click="editandoObservaciones = false"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        class="rounded-lg bg-brand-500 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-brand-600 disabled:opacity-70"
                        :disabled="actualizarDocMutation.isPending.value"
                        @click="onGuardarObservaciones"
                      >
                        Guardar
                      </button>
                    </div>
                  </template>

                  <p
                    v-else-if="documento.observaciones"
                    class="mt-1 rounded border border-gray-200 bg-white p-2 leading-relaxed text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {{ documento.observaciones }}
                  </p>
                  <p v-else class="mt-1 text-gray-400">Sin observaciones</p>
                </div>
              </div>
            </div>
          </div>

          <!--
            Con el documento ya generado o emitido casi todo lo que queda son
            hechos consumados. Se muestran como badges: leer un estado no debería
            costar lo mismo que buscar la acción que todavía se puede ejecutar.
          -->
          <div
            v-if="hitosDelDocumento.length"
            class="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 dark:border-gray-800"
          >
            <AppBadge
              v-for="hito in hitosDelDocumento"
              :key="hito.texto"
              size="sm"
              variant="light"
              :color="hito.color"
            >
              {{ hito.texto }}
            </AppBadge>
          </div>

          <div
            class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800"
          >
            <div class="flex flex-wrap items-center gap-2.5">
              <button
                v-if="puedeGenerar"
                type="button"
                class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-70"
                :disabled="generarMutation.isPending.value"
                @click="onGenerar"
              >
                <AppIcon :name="ICONS.check" :size="14" />
                Generar
              </button>
              <!--
                El camino natural: estás viendo la orden que volvió de planta y
                registras su factura desde acá, con proveedor, almacén y
                cilindros ya resueltos por el id de la orden.
              -->
              <RouterLink
                v-if="puedeRegistrarCompra"
                :to="{ name: 'admin-compras-nuevo', query: compraDesdeOrdenQuery }"
                class="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
              >
                <AppIcon :name="ICONS.receipt" :size="14" />
                Registrar como compra
              </RouterLink>
              <button
                v-if="puedeAsociarLote"
                type="button"
                class="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                @click="loteModalOpen = true"
              >
                <AppIcon :name="ICONS.clipboardCheck" :size="14" />
                Registrar lote y protocolo
              </button>
              <button
                v-if="puedeConvertirGre"
                type="button"
                class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-theme-xs transition hover:bg-brand-600"
                @click="greModalOpen = true"
              >
                <AppIcon :name="ICONS.truck" :size="14" />
                {{ documento.serie ? 'Editar datos GRE' : 'Convertir a guía de remisión' }}
              </button>
              <button
                v-if="puedeEmitir"
                type="button"
                class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 disabled:opacity-70 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                :disabled="emitirMutation.isPending.value"
                @click="onEmitir"
              >
                Emitir a SUNAT
              </button>
              <!--
                El reparto se programa desde aqui y no desde el comprobante: lo
                que sale a la calle es la orden, con su direccion de entrega y
                sus lineas ya resueltas (venta + cilindros en prestamo). La
                actividad queda ligada por id_doc_salida y la venta la sigue
                viendo por JOIN a traves de esta orden.
              -->
              <button
                v-if="puedeAgregarReparto"
                type="button"
                class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-theme-xs transition hover:bg-brand-600"
                @click="abrirReparto"
              >
                <AppIcon :name="ICONS.truck" :size="14" />
                Agregar a reparto
              </button>
              <button
                v-if="documento.ticket_sunat && !documento.emitido_sunat"
                type="button"
                class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 disabled:opacity-70 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                :disabled="consultarMutation.isPending.value"
                @click="onConsultarEstado"
              >
                Consultar estado
              </button>
              <button
                v-if="puedeRegistrarRetorno"
                type="button"
                class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                @click="finalizarModalOpen = true"
              >
                Registrar retorno
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                @click="onDescargarPdf"
              >
                <AppIcon :name="ICONS.download" :size="14" class="text-gray-500" />
                Descargar PDF
              </button>
            </div>
            <button
              v-if="puedeAnular"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-error-200 bg-error-50/40 px-3.5 py-2 text-xs font-semibold text-error-600 shadow-theme-xs transition hover:bg-error-50 dark:border-error-700 dark:text-error-400"
              @click="anularModalOpen = true"
            >
              <AppIcon :name="ICONS.ban" :size="14" />
              Anular
            </button>
          </div>
        </div>
      </div>

      <!-- Dirección de entrega y geolocalización -->
      <div
        class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]"
      >
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/75 px-6 py-3.5 dark:border-gray-800 dark:bg-white/[0.02]"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400"
            >
              <AppIcon :name="ICONS.mapPin" :size="15" />
            </div>
            <div>
              <h3
                class="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-white/90"
              >
                Dirección de entrega y geolocalización
              </h3>
              <p class="text-[11px] text-gray-400">
                Información geográfica y coordenadas GPS para despacho
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <a
              v-if="documento.latitud && documento.longitud"
              :href="googleMapsUrl"
              target="_blank"
              rel="noreferrer"
              class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-theme-xs transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400"
            >
              <AppIcon :name="ICONS.mapPin" :size="13" />
              Ver en Google Maps
              <AppIcon :name="ICONS.externalLink" :size="11" />
            </a>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              @click="direccionModalOpen = true"
            >
              <AppIcon :name="ICONS.pencil" :size="13" />
              {{ documento.direccion_entrega ? 'Editar' : 'Agregar dirección' }}
            </button>
          </div>
        </div>

        <div v-if="documento.direccion_entrega" class="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
          <div
            class="space-y-2 rounded-lg border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
          >
            <div
              class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              <AppIcon :name="ICONS.truck" :size="14" />
              <span>Destino y dirección</span>
            </div>
            <div class="space-y-1.5 text-xs">
              <span class="block text-[11px] text-gray-400">Dirección de entrega</span>
              <p class="font-semibold leading-snug text-gray-800 dark:text-white/90">
                {{ documento.direccion_entrega }}
              </p>
              <template v-if="documento.referencia_entrega">
                <span class="block pt-1 text-[11px] text-gray-400">Referencia de entrega</span>
                <p
                  class="rounded border border-gray-200 bg-white p-2 text-[11px] leading-relaxed text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {{ documento.referencia_entrega }}
                </p>
              </template>
            </div>
          </div>

          <div
            class="space-y-2 rounded-lg border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
          >
            <div
              class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              <AppIcon :name="ICONS.locateFixed" :size="14" />
              <span>Coordenadas GPS</span>
            </div>
            <div v-if="documento.latitud && documento.longitud" class="space-y-2 text-xs">
              <span class="block text-[11px] text-gray-400">Latitud y longitud</span>
              <div
                class="flex items-center gap-2 rounded border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800"
              >
                <code class="flex-1 font-mono text-xs font-bold text-gray-800 dark:text-white/90">
                  {{ documento.latitud.toFixed(6) }}, {{ documento.longitud.toFixed(6) }}
                </code>
                <button
                  type="button"
                  class="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300"
                  title="Copiar coordenadas"
                  @click="copiarCoordenadas"
                >
                  Copiar
                </button>
              </div>
              <div
                v-if="documento.nombre_distrito_entrega"
                class="flex justify-between text-[11px]"
              >
                <span class="text-gray-400">Distrito:</span>
                <span class="font-medium text-gray-700 dark:text-gray-300">{{
                  documento.nombre_distrito_entrega
                }}</span>
              </div>
            </div>
            <p v-else class="text-xs text-gray-400">Sin coordenadas registradas</p>
          </div>

          <div
            class="space-y-2 rounded-lg border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
          >
            <div
              class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              <AppIcon :name="ICONS.warehouse" :size="14" />
              <span>Almacén de despacho</span>
            </div>
            <div class="space-y-1.5 text-xs">
              <span class="block text-[11px] text-gray-400">Punto de salida / origen</span>
              <p class="font-semibold text-gray-800 dark:text-white/90">
                {{ documento.nombre_almacen ?? '—' }}
              </p>
            </div>
          </div>
        </div>
        <div v-else class="p-6 text-center text-xs text-gray-400">
          Este documento todavía no tiene una dirección de entrega registrada.
        </div>
      </div>

      <DatosTrasladoSection :documento="documento" :editable="puedeEditarDatos" />

      <!-- Detalle -->
      <div
        class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]"
      >
        <div
          class="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800"
        >
          <div class="flex items-center gap-2">
            <div
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400"
            >
              <AppIcon :name="ICONS.shoppingCart" :size="15" />
            </div>
            <h3 class="text-sm font-bold tracking-tight text-gray-800 dark:text-white/90">
              {{ documento.detalle_desde_venta ? 'Detalle (tomado de la venta)' : 'Detalle' }}
            </h3>
          </div>
          <span
            class="inline-flex items-center gap-1.5 rounded-full border border-gray-200/60 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-300"
          >
            <AppIcon :name="ICONS.layers" :size="12" class="text-gray-400" />
            {{ documento.detalle.length }} ítem{{
              documento.detalle.length === 1 ? '' : 's'
            }}
            registrado{{ documento.detalle.length === 1 ? '' : 's' }}
          </span>
        </div>

        <div
          v-if="documento.venta_anulada"
          class="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-6 py-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
        >
          <AppIcon :name="ICONS.alertTriangle" :size="14" class="mt-0.5 shrink-0" />
          <p>
            La venta
            <router-link
              :to="{ name: 'admin-ventas-comprobantes', query: { id: String(documento.id_venta) } }"
              class="font-semibold underline hover:no-underline"
            >
              {{ documento.serie_venta }}-{{ documento.numero_venta }}
            </router-link>
            que originó este documento fue anulada. El detalle de abajo es el que tuvo la venta
            antes de anularse (solo informativo); el documento quedó anulado automáticamente y no
            movió inventario propio.
          </p>
        </div>

        <div class="px-6 py-5">
          <DocSalidaDetalleEditor
            :id-almacen="documento.id_almacen"
            :lineas="lineasDocumentoDetalle"
            :permitir-otros-productos="!isRecargaPlanta"
            :readonly="!puedeEditarDetalle"
            :disabled="detalleOcupado"
            :vacio-productos="
              documento.detalle_desde_venta
                ? 'La venta no tiene productos.'
                : 'Sin productos adicionales.'
            "
            :vacio-balones="
              documento.detalle_desde_venta ? 'La venta no tiene balones.' : 'Sin balones'
            "
            @agregar-balon="onAgregarLinea"
            @set-producto="onSetProductoDocumento"
            @quitar="onQuitarLineaDocumento"
          />

          <!--
            La duda recurrente: en BORRADOR el detalle no toca inventario. El
            stock y el estado de los cilindros se mueven al pulsar "Generar".
          -->
          <p
            v-if="puedeEditarDetalle && documento.detalle.length"
            class="mt-4 flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-400"
          >
            <AppIcon :name="ICONS.alertCircle" :size="14" class="mt-0.5 shrink-0 text-gray-400" />
            <span>
              En BORRADOR nada se mueve todavía. Al pulsar
              <strong class="font-semibold">Generar</strong> se descuenta el stock de los
              productos y los cilindros salen del almacén.
            </span>
          </p>
        </div>
      </div>

      <!-- Referencias SUNAT -->
      <div
        v-if="documento.referencias.length"
        class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]"
      >
        <h3 class="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">
          Documentos de referencia
        </h3>
        <ul class="text-sm text-gray-600 dark:text-gray-400">
          <li v-for="ref in documento.referencias" :key="ref.id">
            {{ ref.nombre_tipo_comprobante }} {{ ref.serie }}-{{ ref.numero }}
          </li>
        </ul>
      </div>

      <!-- Auditoría -->
      <div
        class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]"
      >
        <div
          class="flex items-center justify-between gap-2 border-b border-gray-100 px-6 py-3.5 dark:border-gray-800"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400"
            >
              <AppIcon :name="ICONS.shield" :size="15" />
            </div>
            <h3 class="text-sm font-bold tracking-tight text-gray-800 dark:text-white/90">
              Auditoría del registro
            </h3>
          </div>
          <span class="flex items-center gap-1 text-[11px] font-medium text-gray-400">
            <AppIcon :name="ICONS.clock" :size="12" />
            Trazabilidad de cambios
          </span>
        </div>
        <div class="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
          <div
            class="flex items-start gap-3.5 rounded-lg border border-gray-100 bg-gray-50/50 p-3.5 dark:border-gray-800 dark:bg-white/[0.02]"
          >
            <div
              class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400"
            >
              <AppIcon :name="ICONS.plus" :size="16" />
            </div>
            <div class="min-w-0 flex-1 space-y-1.5 text-xs">
              <div class="flex items-center justify-between">
                <span
                  class="text-[11px] font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
                  >Registro inicial</span
                >
                <span
                  class="rounded border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {{ formatFechaHora(documento.fecha_creacion) }}
                </span>
              </div>
              <div class="flex items-center gap-2 pt-0.5">
                <div
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white"
                >
                  {{ inicialesUsuario(documento.nombre_usuario_creacion) }}
                </div>
                <span class="text-xs text-gray-500">Usuario:</span>
                <span class="text-xs font-medium text-gray-800 dark:text-white/90">{{
                  documento.nombre_usuario_creacion ?? '—'
                }}</span>
              </div>
            </div>
          </div>

          <div
            class="flex items-start gap-3.5 rounded-lg border border-gray-100 bg-gray-50/50 p-3.5 dark:border-gray-800 dark:bg-white/[0.02]"
          >
            <div
              class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400"
            >
              <AppIcon :name="ICONS.pencil" :size="15" />
            </div>
            <div class="min-w-0 flex-1 space-y-1.5 text-xs">
              <div class="flex items-center justify-between">
                <span
                  class="text-[11px] font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
                  >Última modificación</span
                >
                <span
                  class="rounded border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {{
                    documento.fecha_modificacion
                      ? formatFechaHora(documento.fecha_modificacion)
                      : '—'
                  }}
                </span>
              </div>
              <div class="flex items-center gap-2 pt-0.5">
                <div
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white"
                >
                  {{ inicialesUsuario(documento.nombre_usuario_creacion) }}
                </div>
                <span class="text-xs text-gray-500">Usuario:</span>
                <span class="text-xs font-medium text-gray-800 dark:text-white/90">{{
                  documento.nombre_usuario_creacion ?? '—'
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <LoteProtocoloFormModal
      v-model="loteModalOpen"
      mode="create"
      :balones-preset="balonesPreset"
      :id-producto-gas-preset="gasUnicoDelDocumento?.id ?? null"
      :id-doc-salida="documento?.id ?? null"
    />

    <!-- Modal: Dirección de entrega -->
    <DireccionEntregaModal
      v-if="documento"
      v-model="direccionModalOpen"
      :id-doc-salida="documento.id"
      :id-cliente="documento.id_cliente"
    />

    <!-- Modal: Convertir a GRE -->
    <ConvertirGreModal v-if="documento" v-model="greModalOpen" :documento="documento" />

    <!-- Modal: Finalizar recarga -->
    <FinalizarRecargaModal v-model="finalizarModalOpen" :documento="documento" />

    <!-- Modal: Anular -->
    <AppModal v-model="anularModalOpen" title="Anular documento" size="sm">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Esto revierte el inventario que este documento haya movido por su cuenta (no aplica a lo que
        ya movió la venta de origen).
      </p>
      <AppTextarea v-model="anularMotivo" label="Motivo (opcional)" :rows="2" class="mt-3" />
      <template #footer>
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
          @click="anularModalOpen = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:opacity-70"
          :disabled="anularMutation.isPending.value"
          @click="onAnular"
        >
          Anular documento
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import ClienteSelectField from '@/modules/clientes/components/ClienteSelectField.vue'
import LoteProtocoloFormModal from '@/modules/balones/lotes-protocolo/components/LoteProtocoloFormModal.vue'
import { useDocSalidaAcciones } from '../composables/useDocSalidaAcciones'
import DatosTrasladoSection from '../components/DatosTrasladoSection.vue'
import FinalizarRecargaModal from '../components/FinalizarRecargaModal.vue'
import DireccionEntregaModal from '../components/DireccionEntregaModal.vue'
import ConvertirGreModal from '../components/ConvertirGreModal.vue'
import { useSucursalesQuery } from '@/modules/configuracion/sucursales/composables/useSucursalesQuery'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import DocSalidaDetalleEditor from '@/modules/documentos-salida/components/DocSalidaDetalleEditor.vue'
import { useDocumentoSalidaQuery } from '../composables/useDocumentosSalidaQuery'
import {
  useActualizarDetalleDocSalidaMutation,
  useActualizarDocSalidaMutation,
  useAgregarDetalleDocSalidaMutation,
  useAnularDocSalidaMutation,
  useConsultarEstadoDocSalidaMutation,
  useCreateDocumentoSalidaMutation,
  useEliminarDetalleDocSalidaMutation,
  useEmitirSunatDocSalidaMutation,
  useGenerarDocSalidaMutation,
} from '../composables/useDocumentoSalidaMutations'
import { documentosSalidaService } from '../services/documentos-salida.service'
import type {
  CodigoTipoOrdenSalida,
  DocSalidaLineaBorrador,
  DocSalidaDetalleLinea,
  DocSalidaProductoCantidad,
} from '../interfaces/documento-salida.interface'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import {
  AppBadge,
  AppDatePicker,
  AppInput,
  AppModal,
  AppSelect,
  AppTextarea,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { toastApiError, toastSuccess, toastWarning } from '@/shared/composables/useToast'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const documentoId = computed(() => {
  const raw = route.params.id
  const n = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(n) && n > 0 ? n : null
})

const idUsuarioAuditoria = computed(() => authStore.user?.id)

const breadcrumbItems = [
  { label: 'Documentos de salida', path: '/admin/inventario/documentos-salida' },
  { label: documentoId.value ? 'Detalle' : 'Nuevo' },
]
const pageTitle = documentoId.value ? 'Documento de salida' : 'Nuevo documento de salida'

// ---- Catálogos ----
const sucursalesQuery = useSucursalesQuery(ref({ pagina: 1, limite: 100 }))
const almacenesFilters = ref({ pagina: 1, limite: 200, buscar: undefined as string | undefined })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

const sucursalOptions = computed(
  () => sucursalesQuery.data.value?.data?.map((s) => ({ value: s.id, label: s.nombre })) ?? [],
)
const almacenOptions = computed(() => {
  const lista = almacenesQuery.data.value?.data ?? []
  const idSucursal = form.idSucursal
  const filtrados =
    idSucursal !== '' && idSucursal != null
      ? lista.filter((a) => Number(a.id_sucursal) === Number(idSucursal))
      : lista
  return filtrados.map((a) => ({ value: a.id, label: a.nombre }))
})

// Los cuatro que existen en gen_lista_opciones (TipoOrdenSalida). ORDEN_SALIDA_VENTA
// no se ofrece acá: esa orden nace de la venta, no se arma a mano. El retorno de
// planta tampoco es un tipo: se registra con "Finalizar recarga" sobre la orden
// de envío.
const TIPO_ORDEN_OPCIONES: { value: CodigoTipoOrdenSalida; label: string }[] = [
  { value: 'ORDEN_SALIDA_INTERNA', label: 'Orden interna (sin venta)' },
  { value: 'TRASLADO', label: 'Traslado entre almacenes' },
  { value: 'RECARGA_PLANTA_EXTERNA', label: 'Envío a planta externa (recarga)' },
]
const tipoOrdenOptions = TIPO_ORDEN_OPCIONES

const TIPO_LABELS: Record<string, string> = {
  ORDEN_SALIDA_VENTA: 'Orden de venta',
  ORDEN_SALIDA_INTERNA: 'Orden interna',
  RECARGA_PLANTA_EXTERNA: 'Recarga planta',
  TRASLADO: 'Traslado',
}
function formatTipoOrden(codigo: string) {
  return TIPO_LABELS[codigo] ?? codigo
}
function estadoCicloColor(estado: string) {
  if (estado === 'ANULADA') return 'error'
  if (estado === 'EMITIDA_SUNAT') return 'success'
  if (estado === 'GENERADA') return 'primary'
  return 'warning'
}
function estadoSunatColor(estado: string) {
  if (estado === 'ACEPTADO') return 'success'
  if (estado === 'RECHAZADO') return 'error'
  return 'warning'
}

// ---- Crear cabecera ----
/** Fecha local en formato YYYY-MM-DD (no UTC: en Lima toISOString adelanta un día). */
function hoyISO() {
  const ahora = new Date()
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

const form = reactive<{
  codigoTipoOrden: CodigoTipoOrdenSalida
  idSucursal: number | ''
  idAlmacen: number | ''
  idAlmacenDestino: number | ''
  idCliente: number | ''
  idProveedor: number | ''
  idDestinatario: number | ''
  fecha: string
  fechaTraslado: string
  pesoBruto: number | ''
  numeroBultos: number | ''
  observaciones: string
}>({
  codigoTipoOrden: 'ORDEN_SALIDA_INTERNA',
  idSucursal: '',
  idAlmacen: '',
  idAlmacenDestino: '',
  idCliente: '',
  idProveedor: '',
  idDestinatario: '',
  fecha: hoyISO(),
  fechaTraslado: '',
  pesoBruto: '',
  numeroBultos: '',
  observaciones: '',
})

const isTraslado = computed(() => form.codigoTipoOrden === 'TRASLADO')

watch(
  () => form.idSucursal,
  (suc) => {
    if (suc === '' || suc == null) return
    const origen = almacenesQuery.data.value?.data?.find((a) => a.id === Number(form.idAlmacen))
    if (origen && Number(origen.id_sucursal) !== Number(suc)) {
      form.idAlmacen = ''
    }
  },
)

// El destino puede estar en otra sucursal (traslado entre sedes), así que el
// listado no se acota por sucursal — solo se excluye el propio origen.
const almacenDestinoOptions = computed(() =>
  almacenOptions.value.filter((opcion) => opcion.value !== Number(form.idAlmacen)),
)

const errorAlmacenDestino = computed(() => {
  if (!isTraslado.value || form.idAlmacenDestino === '') return undefined
  return Number(form.idAlmacenDestino) === Number(form.idAlmacen)
    ? 'Debe ser distinto al almacén de origen'
    : undefined
})

const canSubmitHeader = computed(() => {
  if (!form.codigoTipoOrden || !form.idSucursal || !form.idAlmacen) return false
  if (isTraslado.value) {
    return form.idAlmacenDestino !== '' && !errorAlmacenDestino.value
  }
  return true
})

// Cambiar de tipo deja de lado un destino que ya no aplica: si no, una orden
// interna se crearía arrastrando el almacén que se eligió cuando era traslado.
watch(isTraslado, (traslado) => {
  if (!traslado) form.idAlmacenDestino = ''
})

const createMutation = useCreateDocumentoSalidaMutation()

// ---- Líneas en borrador (documento todavía no creado) ----
// Viven en memoria porque doc_salida_detalle necesita un id_doc_salida, y ese
// id no existe hasta que se guarda la cabecera. Al crear se persisten en orden.
const lineasBorrador = ref<DocSalidaLineaBorrador[]>([])

// Al cambiar almacén en un documento nuevo, el stock y los cilindros disponibles
// dejan de aplicar: se limpia el detalle en borrador para no mezclar orígenes.
watch(
  () => form.idAlmacen,
  () => {
    if (documentoId.value) return
    if (!lineasBorrador.value.length) return
    lineasBorrador.value = []
  },
)
const guardandoLineas = ref(false)

/** Las líneas en borrador, en la forma que consume el editor. */
const lineasBorradorDetalle = computed<DocSalidaDetalleLinea[]>(() =>
  lineasBorrador.value.map((linea, index) => ({
    key: String(index),
    tipo: linea.idBalon ? 'BALON' : 'PRODUCTO',
    idBalon: linea.idBalon ?? null,
    idProducto: linea.idProducto ?? null,
    cantidad: linea.cantidad,
    glosa: linea.glosa,
    codigoBalon: linea.codigoBalon,
    idTipoBalon: linea.idTipoBalon,
    nombreTipoBalon: linea.nombreTipoBalon,
    nombreAlmacenBalon: linea.nombreAlmacenBalon,
    idProductoGas: linea.idProductoGas,
    nombreProductoGas: linea.nombreProductoGas,
    capacidadBalon: linea.capacidadBalon,
    unidadCapacidadBalon: linea.unidadCapacidadBalon,
    nombreProducto: linea.nombreProducto,
    codigoProducto: linea.codigoProducto,
    nombreUnidadMedida: linea.nombreUnidadMedida,
    removible: true,
  })),
)

function onAgregarLineaBorrador(linea: DocSalidaLineaBorrador) {
  lineasBorrador.value = [...lineasBorrador.value, linea]
}

/**
 * "El producto X debe quedar en cantidad N": el editor no sabe si esa línea ya
 * existe, así que acá se reemplaza la que hubiera y se descarta cuando la
 * cantidad queda en cero.
 */
function onSetProductoBorrador(producto: DocSalidaProductoCantidad) {
  const resto = lineasBorrador.value.filter(
    (linea) => linea.idBalon != null || linea.idProducto !== producto.idProducto,
  )

  if (producto.cantidad > 0) {
    resto.push({
      idProducto: producto.idProducto,
      cantidad: producto.cantidad,
      nombreProducto: producto.nombreProducto,
      codigoProducto: producto.codigoProducto,
      nombreUnidadMedida: producto.nombreUnidadMedida,
    })
  }

  lineasBorrador.value = resto
}

function onQuitarLineaBorrador(key: string) {
  const index = Number(key)
  lineasBorrador.value = lineasBorrador.value.filter((_, i) => i !== index)
}

const textoBotonCrear = computed(() => {
  if (guardandoLineas.value) return 'Guardando líneas...'
  if (createMutation.isPending.value) return 'Creando...'
  return lineasBorrador.value.length ? 'Crear documento con detalle' : 'Crear documento'
})

async function submitHeader() {
  if (!canSubmitHeader.value) return
  try {
    const creado = await createMutation.mutateAsync({
      codigoTipoOrden: form.codigoTipoOrden,
      idSucursal: Number(form.idSucursal),
      idAlmacen: Number(form.idAlmacen),
      idAlmacenDestino: form.idAlmacenDestino ? Number(form.idAlmacenDestino) : undefined,
      idCliente: form.idCliente ? Number(form.idCliente) : undefined,
      idProveedor: form.idProveedor ? Number(form.idProveedor) : undefined,
      idDestinatario: form.idDestinatario ? Number(form.idDestinatario) : undefined,
      fecha: form.fecha || undefined,
      fechaTraslado: form.fechaTraslado || undefined,
      pesoBruto: form.pesoBruto === '' ? undefined : Number(form.pesoBruto),
      numeroBultos: form.numeroBultos === '' ? undefined : Number(form.numeroBultos),
      observaciones: form.observaciones || undefined,
      idUsuarioAuditoria: idUsuarioAuditoria.value,
    })

    // El documento ya existe aunque falle alguna línea: se navega igual y el
    // usuario termina de armarlo en la pantalla de edición, sin perder lo hecho.
    if (lineasBorrador.value.length) {
      guardandoLineas.value = true
      try {
        for (const linea of lineasBorrador.value) {
          await agregarDetalleMutation.mutateAsync({
            id: creado.id,
            payload: {
              idProducto: linea.idProducto,
              idBalon: linea.idBalon,
              cantidad: linea.cantidad,
              glosa: linea.glosa,
              idUsuarioAuditoria: idUsuarioAuditoria.value,
            },
          })
        }
        lineasBorrador.value = []
      } catch (error) {
        toastApiError(error, 'El documento se creó, pero no se pudieron guardar todas las líneas')
      } finally {
        guardandoLineas.value = false
      }
    }

    // `direccion: '1'` lo recoge el watcher de abajo y abre el modal de dirección
    // de entrega apenas carga el documento: es el dato que más se olvidaba.
    void router.replace({
      name: 'admin-documentos-salida-editar',
      params: { id: creado.id },
      query: { direccion: '1' },
    })
  } catch (error) {
    toastApiError(error, 'No se pudo crear el documento')
  }
}

// ---- Documento existente ----
const documentoQuery = useDocumentoSalidaQuery(documentoId)
const documento = computed(() => documentoQuery.data.value)

/**
 * Estados que ya no admiten acción: se leen como badges en vez de ocupar sitio
 * entre los botones. La barra de acciones queda solo con lo que aún se puede hacer.
 */
/**
 * La factura del proveedor se registra desde la orden que la origina. Solo tiene
 * sentido en planta externa, una vez generada (antes no hay nada que facturar) y
 * mientras no exista ya una compra vinculada.
 */
const puedeRegistrarCompra = computed(
  () =>
    isRecargaPlanta.value &&
    documento.value?.nombre_estado_ciclo !== 'BORRADOR' &&
    documento.value?.nombre_estado_ciclo !== 'ANULADA' &&
    !documento.value?.id_comprobante_compra &&
    authStore.hasPermission(PermisoBanderas.COMPRAS_CREAR),
)

/**
 * Proveedor y almacén viajan en la URL además del id: la compra los deduce de
 * la orden igual, pero llevarlos evita que el selector de órdenes arranque
 * deshabilitado ("selecciona el proveedor primero") mientras carga el detalle.
 */
const compraDesdeOrdenQuery = computed(() => {
  const doc = documento.value
  return {
    idRecargaPlanta: String(doc?.id ?? ''),
    ...(doc?.id_proveedor ? { idProveedor: String(doc.id_proveedor) } : {}),
    ...(doc?.id_almacen ? { idAlmacen: String(doc.id_almacen) } : {}),
  }
})

const hitosDelDocumento = computed(() => {
  const doc = documento.value
  if (!doc) return []

  const hitos: { texto: string; color: 'success' | 'warning' | 'neutral' | 'error' }[] = []

  if (doc.nombre_estado_ciclo === 'GENERADA' || doc.nombre_estado_ciclo === 'EMITIDA_SUNAT') {
    hitos.push({ texto: 'Inventario movido', color: 'success' })
  }
  if (doc.nombre_estado_ciclo === 'ANULADA') {
    hitos.push({ texto: 'Anulada', color: 'error' })
  }
  if (doc.serie && doc.numero_sunat) {
    hitos.push({ texto: `Guía ${doc.serie}-${doc.numero_sunat}`, color: 'neutral' })
  }
  if (doc.emitido_sunat) {
    hitos.push({ texto: 'Emitida a SUNAT', color: 'success' })
  } else if (doc.ticket_sunat) {
    hitos.push({ texto: 'Ticket SUNAT pendiente', color: 'warning' })
  }
  // El hito es el retorno físico (los cilindros entraron), no la fecha: una
  // orden podía quedar con fecha de llegada y los envases todavía en planta.
  if (doc.retorno_fisico) {
    hitos.push({
      texto: doc.fecha_llegada_almacen
        ? `Retorno registrado ${doc.fecha_llegada_almacen}`
        : 'Retorno registrado',
      color: 'success',
    })
  }
  if (doc.id_comprobante_compra) {
    hitos.push({ texto: 'Facturada en compras', color: 'neutral' })
  }

  return hitos
})

const {
  puedeGenerar,
  puedeEditarDatos,
  puedeRegistrarRetorno,
  puedeConvertirGre,
  puedeEmitir,
  puedeAnular,
  puedeAsociarLote: puedeRegistrarLote,
} = useDocSalidaAcciones(documento)

const isRecargaPlanta = computed(
  () =>
    form.codigoTipoOrden === 'RECARGA_PLANTA_EXTERNA' ||
    documento.value?.nombre_tipo_orden === 'RECARGA_PLANTA_EXTERNA',
)

const puedeEditarDetalle = computed(
  () =>
    authStore.hasPermission(PermisoBanderas.DOCUMENTOS_SALIDA_EDITAR) &&
    documento.value?.nombre_estado_ciclo === 'BORRADOR' &&
    !documento.value?.detalle_desde_venta,
)



// ---- Detalle del documento ya creado ----
// La clave lleva el origen porque el detalle une dos tablas: los ítems de la
// venta y los cilindros del préstamo, cuyos ids se pueden repetir entre sí.
/** El detalle ya guardado, en la forma que consume el editor. */
const lineasDocumentoDetalle = computed<DocSalidaDetalleLinea[]>(() =>
  (documento.value?.detalle ?? []).map((linea) => ({
    key: `${linea.origen_detalle}-${linea.id}`,
    tipo: linea.id_balon ? 'BALON' : 'PRODUCTO',
    idBalon: linea.id_balon,
    idProducto: linea.id_producto,
    cantidad: Number(linea.cantidad),
    glosa: linea.glosa,
    codigoBalon: linea.codigo_balon,
    idTipoBalon: linea.id_tipo_balon,
    nombreTipoBalon: linea.nombre_tipo_balon,
    nombreAlmacenBalon: linea.nombre_almacen_balon,
    idProductoGas: linea.id_producto_gas_balon,
    nombreProductoGas: linea.nombre_producto_gas_balon,
    capacidadBalon: linea.capacidad_balon,
    unidadCapacidadBalon: linea.unidad_capacidad_balon,
    nombreProducto: linea.nombre_producto ?? linea.descripcion,
    codigoProducto: linea.codigo_producto,
    nombreUnidadMedida: linea.nombre_unidad_medida,
    // Las líneas que vienen de la venta o del préstamo no se editan aquí.
    removible: linea.origen_detalle === 'PROPIO',
  })),
)

const agregarDetalleMutation = useAgregarDetalleDocSalidaMutation()
async function onAgregarLinea(linea: DocSalidaLineaBorrador) {
  if (!documento.value) return
  await agregarDetalleMutation.mutateAsync({
    id: documento.value.id,
    payload: {
      idProducto: linea.idProducto,
      idBalon: linea.idBalon,
      cantidad: linea.cantidad,
      glosa: linea.glosa,
      idUsuarioAuditoria: idUsuarioAuditoria.value,
    },
  })
}

const actualizarDetalleMutation = useActualizarDetalleDocSalidaMutation()
const eliminarDetalleMutation = useEliminarDetalleDocSalidaMutation()

/**
 * Misma semántica que en borrador, resuelta contra la BD: la línea del producto
 * se crea si no existía, se corrige si cambió y se quita cuando la cantidad
 * vuelve a cero.
 */
async function onSetProductoDocumento(producto: DocSalidaProductoCantidad) {
  const doc = documento.value
  if (!doc) return

  const existente = doc.detalle.find(
    (linea) => linea.id_balon == null && linea.id_producto === producto.idProducto,
  )

  if (!existente) {
    if (producto.cantidad <= 0) return
    await agregarDetalleMutation.mutateAsync({
      id: doc.id,
      payload: {
        idProducto: producto.idProducto,
        cantidad: producto.cantidad,
        idUsuarioAuditoria: idUsuarioAuditoria.value,
      },
    })
    return
  }

  if (producto.cantidad <= 0) {
    await eliminarDetalleMutation.mutateAsync({
      detalleId: existente.id,
      idDocSalida: doc.id,
      idUsuarioAuditoria: idUsuarioAuditoria.value,
    })
    return
  }

  await actualizarDetalleMutation.mutateAsync({
    detalleId: existente.id,
    idDocSalida: doc.id,
    payload: { cantidad: producto.cantidad, idUsuarioAuditoria: idUsuarioAuditoria.value },
  })
}

const detalleOcupado = computed(
  () =>
    agregarDetalleMutation.isPending.value ||
    actualizarDetalleMutation.isPending.value ||
    eliminarDetalleMutation.isPending.value,
)
async function onQuitarLineaDocumento(key: string) {
  if (!documento.value) return
  const detalleId = Number(key.split('-').pop())
  if (!Number.isFinite(detalleId)) return
  await eliminarDetalleMutation.mutateAsync({
    detalleId,
    idDocSalida: documento.value.id,
    idUsuarioAuditoria: idUsuarioAuditoria.value,
  })
}

// ---- Observaciones ----
// Se escriben al crear, pero una nota mal puesta quedaba fija: acá se corrigen
// mientras el documento no esté anulado ni emitido.
const actualizarDocMutation = useActualizarDocSalidaMutation()
const editandoObservaciones = ref(false)
const observacionesBorrador = ref('')

const puedeEditarObservaciones = computed(
  () =>
    Boolean(documento.value) &&
    documento.value?.nombre_estado_ciclo !== 'ANULADA' &&
    !documento.value?.emitido_sunat,
)

function abrirObservaciones() {
  observacionesBorrador.value = documento.value?.observaciones ?? ''
  editandoObservaciones.value = true
}

async function onGuardarObservaciones() {
  if (!documento.value) return
  await actualizarDocMutation.mutateAsync({
    id: documento.value.id,
    payload: {
      observaciones: observacionesBorrador.value.trim(),
      idUsuarioAuditoria: idUsuarioAuditoria.value,
    },
  })
  editandoObservaciones.value = false
}

// ---- Generar / anular ----
const generarMutation = useGenerarDocSalidaMutation()

/** Hay cilindros con gas derivado pero ninguna línea de gas con cantidad > 0. */
function gasSinCantidadEnDetalle(): boolean {
  const detalle = documento.value?.detalle ?? []
  const cilindros = detalle.filter((linea) => linea.id_balon != null)
  if (!cilindros.length) return false

  const idsGas = new Set(
    cilindros
      .map((linea) => linea.id_producto_gas_balon)
      .filter((id): id is number => id != null),
  )
  if (!idsGas.size) return false

  return [...idsGas].every((idGas) => {
    const cantidad = detalle
      .filter((linea) => linea.id_producto === idGas)
      .reduce((sum, linea) => sum + Number(linea.cantidad ?? 0), 0)
    return cantidad <= 0
  })
}

async function onGenerar() {
  if (!documento.value) return
  if (gasSinCantidadEnDetalle()) {
    toastWarning(
      'Hay cilindros en el detalle pero todas las líneas de gas tienen cantidad 0. Indica la cantidad de gas antes de generar.',
    )
    return
  }
  await generarMutation.mutateAsync({
    id: documento.value.id,
    idUsuarioAuditoria: idUsuarioAuditoria.value,
  })
}

const anularModalOpen = ref(false)
const anularMotivo = ref('')
const anularMutation = useAnularDocSalidaMutation()
async function onAnular() {
  if (!documento.value) return
  await anularMutation.mutateAsync({
    id: documento.value.id,
    payload: {
      motivo: anularMotivo.value || undefined,
      idUsuarioAuditoria: idUsuarioAuditoria.value,
    },
  })
  anularModalOpen.value = false
  anularMotivo.value = ''
}

// ---- Reparto (actividad) ----
const puedeAgregarReparto = computed(() => {
  const doc = documento.value
  if (!doc) return false

  const estado = doc.nombre_estado_ciclo
  // Solo órdenes ya generadas (o emitidas a SUNAT); no borrador ni anulada.
  if (estado !== 'GENERADA' && estado !== 'EMITIDA_SUNAT') return false

  const tieneClienteODestinatario = Boolean(doc.id_cliente ?? doc.id_destinatario)
  if (!tieneClienteODestinatario) return false

  // En venta conviene tener dirección de entrega antes de programar el reparto.
  if (doc.nombre_tipo_orden === 'ORDEN_SALIDA_VENTA') {
    const tieneDireccion = Boolean(
      doc.id_direccion_cliente ||
        doc.direccion_entrega?.trim() ||
        doc.direccion_llegada?.trim(),
    )
    if (!tieneDireccion) return false
  }

  return true
})

function abrirReparto() {
  const doc = documento.value
  if (!doc) return
  void router.push({
    name: 'admin-operativa-actividades-nueva',
    query: {
      lockTipoReparto: '1',
      fecha: hoyISO(),
      idDocSalida: String(doc.id),
      titulo: `Reparto ${doc.numero}`,
      ...(doc.id_destinatario ?? doc.id_cliente
        ? { clienteId: String(doc.id_destinatario ?? doc.id_cliente) }
        : {}),
      ...((doc.nombre_destinatario ?? doc.nombre_cliente)
        ? { clienteLabel: doc.nombre_destinatario ?? doc.nombre_cliente ?? undefined }
        : {}),
    },
  })
}

// ---- Convertir a GRE (modal propio, ver ConvertirGreModal.vue) ----
const greModalOpen = ref(false)

const emitirMutation = useEmitirSunatDocSalidaMutation()
async function onEmitir() {
  if (!documento.value) return
  await emitirMutation.mutateAsync({
    id: documento.value.id,
    idUsuarioAuditoria: idUsuarioAuditoria.value,
  })
}

const consultarMutation = useConsultarEstadoDocSalidaMutation()
async function onConsultarEstado() {
  if (!documento.value) return
  await consultarMutation.mutateAsync({
    id: documento.value.id,
    idUsuarioAuditoria: idUsuarioAuditoria.value,
  })
}

// ---- Finalizar recarga (retorno de planta) ----
const finalizarModalOpen = ref(false)

// ---- Lote y protocolo (ficha ICP) ----
const loteModalOpen = ref(false)

const balonesDelDocumento = computed(
  () => (documento.value?.detalle ?? []).filter((linea) => linea.id_balon != null),
)

/** Los cilindros de la orden en la forma que espera el formulario de ficha. */
const balonesPreset = computed(() =>
  balonesDelDocumento.value.map((linea) => ({
    idBalon: linea.id_balon as number,
    codigoBalon: linea.codigo_balon ?? '',
    nombreTipoBalon: linea.nombre_tipo_balon,
    numeroSerie: linea.numero_serie_balon,
  })),
)

/**
 * Una ficha de lote y protocolo cubre un solo gas, así que solo tiene sentido
 * asociarla cuando todos los cilindros de la orden son del mismo. En la práctica
 * es el caso del oxígeno medicinal, que es el que exige la ficha de la planta.
 */
const gasUnicoDelDocumento = computed(() => {
  const balones = balonesDelDocumento.value
  if (!balones.length) return null

  const primero = balones[0].id_producto_gas_balon
  if (primero == null) return null
  if (balones.some((balon) => balon.id_producto_gas_balon !== primero)) return null

  return { id: primero, nombre: balones[0].nombre_producto_gas_balon ?? null }
})

// Además de la regla común, en el detalle se exige que los cilindros compartan
// gas: es acá donde se conoce el detalle completo del documento.
const puedeAsociarLote = computed(
  () => puedeRegistrarLote.value && gasUnicoDelDocumento.value != null,
)

// ---- Dirección de entrega ----
const direccionModalOpen = ref(false)

// Si venimos de "Crear orden de salida" desde una venta, abrir el modal de
// dirección automáticamente (apunte: la dirección de entrega es un dato
// importante que hoy se pierde si nadie la pide explícitamente).
watch(
  () => [documento.value?.id, route.query.direccion] as const,
  ([, wantsDireccion]) => {
    if (documento.value && wantsDireccion === '1') {
      direccionModalOpen.value = true
      const { direccion: _direccion, ...rest } = route.query
      void router.replace({ query: rest })
    }
  },
  { immediate: true },
)

const googleMapsUrl = computed(() => {
  if (!documento.value?.latitud || !documento.value?.longitud) return ''
  return `https://maps.google.com/?q=${documento.value.latitud},${documento.value.longitud}`
})

async function copiarCoordenadas() {
  if (!documento.value?.latitud || !documento.value?.longitud) return
  const texto = `${documento.value.latitud}, ${documento.value.longitud}`
  try {
    await navigator.clipboard.writeText(texto)
    toastSuccess('Coordenadas copiadas')
  } catch {
    toastApiError(null, 'No se pudo copiar')
  }
}

function inicialesUsuario(nombre?: string | null) {
  if (!nombre?.trim()) return '—'
  const partes = nombre.trim().split(/\s+/)
  return partes
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

function formatFechaHora(iso: string) {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  return fecha.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ---- PDF ----
async function onDescargarPdf() {
  if (!documento.value) return
  try {
    const blob = await documentosSalidaService.obtenerPdf(documento.value.id)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    toastSuccess('PDF generado')
  } catch (error) {
    toastApiError(error, 'No se pudo generar el PDF')
  }
}
</script>
