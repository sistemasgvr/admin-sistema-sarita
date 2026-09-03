<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div v-if="!documentoId" class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
      <h3 class="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">Nuevo documento de salida</h3>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppSelect
          v-model="form.codigoTipoOrden"
          label="Tipo de orden"
          required
          :options="tipoOrdenOptions"
        />
        <AppSelect
          v-model="form.idSucursal"
          label="Sucursal"
          required
          :options="sucursalOptions"
        />
        <AppSelect v-model="form.idAlmacen" label="Almacén" required :options="almacenOptions" />
        <AppDatePicker v-model="form.fecha" label="Fecha" />
        <AppDatePicker v-model="form.fechaTraslado" label="Fecha de traslado" />

        <ClienteSelectField
          v-if="form.codigoTipoOrden !== 'RECARGA_PLANTA_EXTERNA' && form.codigoTipoOrden !== 'RETORNO_PLANTA_EXTERNA'"
          v-model="form.idCliente"
          label="Cliente"
          searchable
        />
        <ClienteSelectField
          v-if="form.codigoTipoOrden === 'RECARGA_PLANTA_EXTERNA' || form.codigoTipoOrden === 'RETORNO_PLANTA_EXTERNA'"
          v-model="form.idProveedor"
          label="Proveedor (planta)"
          solo-proveedores
          searchable
        />
        <ClienteSelectField v-model="form.idDestinatario" label="Destinatario (opcional)" searchable />

        <div class="sm:col-span-2">
          <AppTextarea v-model="form.observaciones" label="Observaciones" :rows="2" />
        </div>
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
          {{ createMutation.isPending.value ? 'Creando...' : 'Crear documento' }}
        </button>
      </div>
    </div>

    <!-- Documento ya creado -->
    <div v-else-if="documento" class="space-y-5">
      <!-- Cabecera -->
      <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/75 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400">
              <AppIcon :name="ICONS.fileText" :size="20" />
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2.5">
                <h2 class="text-lg font-bold tracking-tight text-gray-900 dark:text-white/90">{{ documento.numero }}</h2>
                <AppBadge size="sm" :color="estadoCicloColor(documento.nombre_estado_ciclo)">
                  {{ documento.nombre_estado_ciclo }}
                </AppBadge>
                <AppBadge v-if="documento.nombre_estado_sunat" size="sm" :color="estadoSunatColor(documento.nombre_estado_sunat)">
                  SUNAT: {{ documento.nombre_estado_sunat }}
                </AppBadge>
              </div>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Tipo: <span class="font-medium text-gray-700 dark:text-gray-300">{{ formatTipoOrden(documento.nombre_tipo_orden) }}</span>
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
            <div class="space-y-3 rounded-lg border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <AppIcon :name="ICONS.mapPin" :size="14" />
                <span>Ubicación y emisión</span>
              </div>
              <div class="space-y-2 text-xs">
                <div>
                  <span class="block text-[11px] text-gray-400">Sucursal</span>
                  <span class="font-semibold text-gray-800 dark:text-white/90">{{ documento.nombre_sucursal ?? '—' }}</span>
                </div>
                <div>
                  <span class="block text-[11px] text-gray-400">Almacén de origen</span>
                  <span class="font-semibold text-gray-800 dark:text-white/90">{{ documento.nombre_almacen ?? '—' }}</span>
                </div>
                <div>
                  <span class="block text-[11px] text-gray-400">Fecha de emisión</span>
                  <span class="mt-0.5 flex items-center gap-1.5 font-semibold text-gray-800 dark:text-white/90">
                    <AppIcon :name="ICONS.calendar" :size="13" class="text-gray-400" />
                    {{ documento.fecha }}
                  </span>
                </div>
              </div>
            </div>

            <div class="space-y-3 rounded-lg border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <AppIcon :name="ICONS.userCheck" :size="14" />
                <span>Cliente y destinatario</span>
              </div>
              <div class="space-y-2 text-xs">
                <div v-if="documento.nombre_cliente">
                  <span class="block text-[11px] text-gray-400">Cliente</span>
                  <span class="font-semibold text-gray-800 dark:text-white/90">{{ documento.nombre_cliente }}</span>
                </div>
                <div v-if="documento.nombre_proveedor">
                  <span class="block text-[11px] text-gray-400">Proveedor</span>
                  <span class="font-semibold text-gray-800 dark:text-white/90">{{ documento.nombre_proveedor }}</span>
                </div>
                <div v-if="documento.nombre_destinatario">
                  <span class="block text-[11px] text-gray-400">Destinatario</span>
                  <span class="font-semibold text-gray-800 dark:text-white/90">{{ documento.nombre_destinatario }}</span>
                </div>
                <p v-if="!documento.nombre_cliente && !documento.nombre_proveedor && !documento.nombre_destinatario" class="text-gray-400">
                  Sin cliente/proveedor asociado
                </p>
              </div>
            </div>

            <div class="space-y-3 rounded-lg border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <AppIcon :name="ICONS.fileText" :size="14" />
                <span>Detalle de operación</span>
              </div>
              <div class="space-y-2 text-xs">
                <div v-if="documento.detalle_desde_venta">
                  <span class="block text-[11px] text-gray-400">Comprobante de venta vinculado</span>
                  <router-link
                    :to="{ name: 'admin-ventas-comprobantes', query: { id: String(documento.id_venta) } }"
                    class="mt-0.5 inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {{ documento.serie_venta }}-{{ documento.numero_venta }}
                    <AppIcon :name="ICONS.externalLink" :size="11" class="text-gray-400" />
                  </router-link>
                </div>
                <div v-if="documento.observaciones">
                  <span class="block text-[11px] text-gray-400">Observaciones</span>
                  <p class="mt-1 rounded border border-gray-200 bg-white p-2 leading-relaxed text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {{ documento.observaciones }}
                  </p>
                </div>
                <p v-if="!documento.detalle_desde_venta && !documento.observaciones" class="text-gray-400">Sin observaciones</p>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <div class="flex flex-wrap items-center gap-2.5">
              <button
                v-if="documento.nombre_estado_ciclo === 'BORRADOR'"
                type="button"
                class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-70"
                :disabled="generarMutation.isPending.value"
                @click="onGenerar"
              >
                <AppIcon :name="ICONS.check" :size="14" />
                Generar
              </button>
              <button
                v-if="canConvertirGre"
                type="button"
                class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-theme-xs transition hover:bg-brand-600"
                @click="greModalOpen = true"
              >
                <AppIcon :name="ICONS.truck" :size="14" />
                {{ documento.serie ? 'Editar datos GRE' : 'Convertir a guía de remisión' }}
              </button>
              <button
                v-if="documento.serie && !documento.emitido_sunat"
                type="button"
                class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 disabled:opacity-70 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                :disabled="emitirMutation.isPending.value"
                @click="onEmitir"
              >
                Emitir a SUNAT
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
                v-if="isRecargaPlanta && documento.nombre_estado_ciclo !== 'ANULADA'"
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
              v-if="documento.nombre_estado_ciclo !== 'ANULADA' && !documento.emitido_sunat"
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
      <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/75 px-6 py-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
          <div class="flex items-center gap-2.5">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400">
             <AppIcon :name="ICONS.mapPin" :size="20" />
            </div>
            <div>
              <spam class="text-xl font-bold text-gray-800 dark:text-white/90">
                Dirección de entrega y geolocalización
              </spam>
              <p class="text-[11px] text-gray-400">Información geográfica y coordenadas GPS para despacho</p>
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
          <div class="space-y-2 rounded-lg border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <AppIcon :name="ICONS.truck" :size="14" />
              <span>Destino y dirección</span>
            </div>
            <div class="space-y-1.5 text-xs">
              <span class="block text-[11px] text-gray-400">Dirección de entrega</span>
              <p class="font-semibold leading-snug text-gray-800 dark:text-white/90">{{ documento.direccion_entrega }}</p>
              <template v-if="documento.referencia_entrega">
                <span class="block pt-1 text-[11px] text-gray-400">Referencia de entrega</span>
                <p class="rounded border border-gray-200 bg-white p-2 text-[11px] leading-relaxed text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {{ documento.referencia_entrega }}
                </p>
              </template>
            </div>
          </div>

          <div class="space-y-2 rounded-lg border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <AppIcon :name="ICONS.locateFixed" :size="14" />
              <span>Coordenadas GPS</span>
            </div>
            <div v-if="documento.latitud && documento.longitud" class="space-y-2 text-xs">
              <span class="block text-[11px] text-gray-400">Latitud y longitud</span>
              <div class="flex items-center gap-2 rounded border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
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
              <div v-if="documento.nombre_distrito_entrega" class="flex justify-between text-[11px]">
                <span class="text-gray-400">Distrito:</span>
                <span class="font-medium text-gray-700 dark:text-gray-300">{{ documento.nombre_distrito_entrega }}</span>
              </div>
            </div>
            <p v-else class="text-xs text-gray-400">Sin coordenadas registradas</p>
          </div>

          <div class="space-y-2 rounded-lg border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <AppIcon :name="ICONS.warehouse" :size="14" />
              <span>Almacén de despacho</span>
            </div>
            <div class="space-y-1.5 text-xs">
              <span class="block text-[11px] text-gray-400">Punto de salida / origen</span>
              <p class="font-semibold text-gray-800 dark:text-white/90">{{ documento.nombre_almacen ?? '—' }}</p>
            </div>
          </div>
        </div>
        <div v-else class="p-6 text-center text-xs text-gray-400">
          Este documento todavía no tiene una dirección de entrega registrada.
        </div>
      </div>

      <!-- Detalle -->
      <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
        <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <div class="flex items-center gap-2">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400">
              <AppIcon :name="ICONS.shoppingCart" :size="20" />
            </div>
            <h3 class="text-sl font-bold tracking-tight text-gray-800 dark:text-white/90">
              {{ documento.detalle_desde_venta ? 'Detalle (tomado de la venta)' : 'Detalle' }}
            </h3>
          </div>
          <span class="inline-flex items-center gap-1.5 rounded-full border border-gray-200/60 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-300">
            <AppIcon :name="ICONS.layers" :size="12" class="text-gray-400" />
            {{ documento.detalle.length }} ítem{{ documento.detalle.length === 1 ? '' : 's' }} registrado{{ documento.detalle.length === 1 ? '' : 's' }}
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-gray-600 dark:text-gray-400">
            <thead class="border-b border-gray-200 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-400">
              <tr>
                <th class="w-14 px-6 py-3.5 text-center">#</th>
                <th class="px-6 py-3.5">Producto / Balón</th>
                <th class="w-44 px-6 py-3.5 text-right">Cantidad / Unidad</th>
                <th v-if="puedeEditarDetalle" class="px-6 py-3.5"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="linea in documento.detalle" :key="linea.id" class="transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
                <td class="px-6 py-4 text-center font-medium text-gray-400">{{ linea.item }}</td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <span class="font-semibold text-gray-800 dark:text-white/90">
                      {{ linea.glosa || linea.descripcion || linea.nombre_producto || linea.codigo_balon || '—' }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="inline-flex items-center justify-end gap-1.5">
                    <span class="rounded bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-800 dark:bg-white/10 dark:text-white/90">
                      {{ linea.cantidad }}
                    </span>
                    <span class="text-xs text-gray-400">{{ linea.nombre_unidad_medida ?? '—' }}</span>
                  </div>
                </td>
                <td v-if="puedeEditarDetalle" class="px-6 py-4 text-right">
                  <button
                    type="button"
                    class="text-error-600 hover:underline dark:text-error-400"
                    @click="onEliminarDetalle(linea.id)"
                  >
                    Quitar
                  </button>
                </td>
              </tr>
              <tr v-if="!documento.detalle.length">
                <td :colspan="puedeEditarDetalle ? 4 : 3" class="py-8 text-center text-gray-400">Sin líneas</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="puedeEditarDetalle" class="border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          <div class="mb-2 flex gap-2 text-sm">
            <button
              type="button"
              class="rounded-lg px-2 py-1"
              :class="lineaModo === 'PRODUCTO' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10' : 'text-gray-500'"
              @click="lineaModo = 'PRODUCTO'"
            >
              Producto
            </button>
            <button
              type="button"
              class="rounded-lg px-2 py-1"
              :class="lineaModo === 'BALON' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10' : 'text-gray-500'"
              @click="lineaModo = 'BALON'"
            >
              Balón
            </button>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <ProductoSelectField
              v-if="lineaModo === 'PRODUCTO'"
              v-model="nuevaLinea.idProducto"
              label=""
              placeholder="Producto"
              class="sm:col-span-2"
            />
            <AppSelectSearch
              v-else
              v-model="nuevaLinea.idBalon"
              v-model:search="balonSearch"
              remote
              placeholder="Buscar balón por código..."
              :options="balonOptions"
              :loading="balonesQuery.isFetching.value"
              class="sm:col-span-2"
            />
            <AppInput v-model.number="nuevaLinea.cantidad" type="number" min="0.0001" step="0.0001" placeholder="Cantidad" />
            <AppInput v-model="nuevaLinea.glosa" placeholder="Glosa (opcional)" />
          </div>
          <button
            type="button"
            class="mt-3 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-70"
            :disabled="!puedeAgregarLinea || agregarDetalleMutation.isPending.value"
            @click="onAgregarLinea"
          >
            Agregar línea
          </button>
        </div>
      </div>

      <!-- Referencias SUNAT -->
      <div v-if="documento.referencias.length" class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
        <h3 class="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">Documentos de referencia</h3>
        <ul class="text-sm text-gray-600 dark:text-gray-400">
          <li v-for="ref in documento.referencias" :key="ref.id">
            {{ ref.nombre_tipo_comprobante }} {{ ref.serie }}-{{ ref.numero }}
          </li>
        </ul>
      </div>

      <!-- Auditoría -->
      <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
        <div class="flex items-center gap-2 border-b border-gray-100 px-6 py-3.5 dark:border-gray-800">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400">
             <AppIcon :name="ICONS.shield" :size="15" />
          </div>
          <div class="flex items-center text-l font-bold tracking-tight text-gray-800 dark:text-white/90">
            <span>Auditoría del registro</span>
          </div>
          <span class="flex items-center gap-1 text-[11px] font-medium text-gray-400">
            <AppIcon :name="ICONS.clock" :size="12" />
            Trazabilidad de cambios
          </span>
        </div>
        <div class="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
          <div class="flex items-start gap-3.5 rounded-lg border border-gray-100 bg-gray-50/50 p-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
            <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
              <AppIcon :name="ICONS.plus" :size="16" />
            </div>
            <div class="min-w-0 flex-1 space-y-1.5 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Registro inicial</span>
                <span class="rounded border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {{ formatFechaHora(documento.fecha_creacion) }}
                </span>
              </div>
              <div class="flex items-center gap-2 pt-0.5">
                <div class="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">
                  {{ inicialesUsuario(documento.nombre_usuario_creacion) }}
                </div>
                <span class="text-xs text-gray-500">Usuario:</span>
                <span class="text-xs font-medium text-gray-800 dark:text-white/90">{{ documento.nombre_usuario_creacion ?? '—' }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-start gap-3.5 rounded-lg border border-gray-100 bg-gray-50/50 p-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
            <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400">
              <AppIcon :name="ICONS.pencil" :size="15" />
            </div>
            <div class="min-w-0 flex-1 space-y-1.5 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Última modificación</span>
                <span class="rounded border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {{ documento.fecha_modificacion ? formatFechaHora(documento.fecha_modificacion) : '—' }}
                </span>
              </div>
              <div class="flex items-center gap-2 pt-0.5">
                <div class="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">
                  {{ inicialesUsuario(documento.nombre_usuario_creacion) }}
                </div>
                <span class="text-xs text-gray-500">Usuario:</span>
                <span class="text-xs font-medium text-gray-800 dark:text-white/90">{{ documento.nombre_usuario_creacion ?? '—' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Dirección de entrega -->
    <DireccionEntregaModal
      v-if="documento"
      v-model="direccionModalOpen"
      :id-doc-salida="documento.id"
      :id-cliente="documento.id_cliente"
    />

    <!-- Modal: Convertir a GRE -->
    <AppModal v-model="greModalOpen" title="Convertir a guía de remisión" size="lg">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AppInput v-model="greForm.serie" label="Serie (4 caracteres)" required maxlength="4" placeholder="T001" />
        <AppSelect v-model="greForm.idTipoGuiaRemision" label="Tipo de guía" :options="tipoGuiaOptions" />
        <AppSelect v-model="greForm.idMotivoTraslado" label="Motivo de traslado" :options="motivoTrasladoOptions" />
        <AppSelect v-model="greForm.idModalidadTraslado" label="Modalidad" :options="modalidadTrasladoOptions" />
        <AppInput v-model="greForm.direccionOrigen" label="Dirección origen" />
        <AppInput v-model.number="greForm.idDistritoOrigen" type="number" label="ID distrito origen" />
        <AppInput v-model="greForm.direccionLlegada" label="Dirección llegada" />
        <AppInput v-model.number="greForm.idDistritoLlegada" type="number" label="ID distrito llegada" />
        <AppInput v-model.number="greForm.idTransportista" type="number" label="ID cliente transportista (público)" />
        <AppInput v-model.number="greForm.idChofer" type="number" label="ID chofer (privado)" />
        <AppInput v-model.number="greForm.idVehiculo" type="number" label="ID vehículo (privado)" />
        <AppInput v-model.number="greForm.pesoBruto" type="number" step="0.0001" label="Peso bruto (kg)" />
        <AppInput v-model.number="greForm.numeroBultos" type="number" label="N° bultos" />
      </div>
      <p class="mt-3 text-xs text-gray-500">
        Los IDs de distrito, transportista, chofer y vehículo se toman de Configuración; esta pantalla no incluye
        todavía los buscadores dedicados de la guía de remisión clásica.
      </p>
      <template #footer>
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
          @click="greModalOpen = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-70"
          :disabled="!greForm.serie || convertirGreMutation.isPending.value"
          @click="onConvertirGre"
        >
          Guardar
        </button>
      </template>
    </AppModal>

    <!-- Modal: Finalizar recarga -->
    <AppModal v-model="finalizarModalOpen" title="Registrar retorno de recarga" size="md">
      <div class="grid grid-cols-1 gap-4">
        <AppDatePicker v-model="finalizarForm.fechaLlegadaAlmacen" label="Fecha de llegada al almacén" required />
        <AppSelect v-model="finalizarForm.idAlmacen" label="Almacén de retorno" required :options="almacenOptions" />
        <AppInput v-model="finalizarForm.lote" label="N° de lote" />
        <AppDatePicker v-model="finalizarForm.fechaVencimientoLote" label="Vencimiento del lote" />
        <AppDatePicker v-model="finalizarForm.fechaPruebaHidrostatica" label="Prueba hidrostática" />
        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input v-model="finalizarForm.guardarBalonesAlmacen" type="checkbox" class="h-4 w-4" />
          Actualizar custodia de los balones (EN_ALMACEN) y registrar entrada de gas
        </label>
      </div>
      <template #footer>
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
          @click="finalizarModalOpen = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-70"
          :disabled="!finalizarForm.fechaLlegadaAlmacen || !finalizarForm.idAlmacen || finalizarMutation.isPending.value"
          @click="onFinalizarRecarga"
        >
          Guardar
        </button>
      </template>
    </AppModal>

    <!-- Modal: Anular -->
    <AppModal v-model="anularModalOpen" title="Anular documento" size="sm">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Esto revierte el inventario que este documento haya movido por su cuenta (no aplica a lo que ya movió la
        venta de origen).
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
import ProductoSelectField from '@/modules/productos/articulos/components/ProductoSelectField.vue'
import DireccionEntregaModal from '../components/DireccionEntregaModal.vue'
import { useSucursalesQuery } from '@/modules/configuracion/sucursales/composables/useSucursalesQuery'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useBalonesQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import {
  useDocumentoSalidaCatalogosQuery,
  useDocumentoSalidaQuery,
} from '../composables/useDocumentosSalidaQuery'
import {
  useAgregarDetalleDocSalidaMutation,
  useAnularDocSalidaMutation,
  useConsultarEstadoDocSalidaMutation,
  useConvertirAGreMutation,
  useCreateDocumentoSalidaMutation,
  useEliminarDetalleDocSalidaMutation,
  useEmitirSunatDocSalidaMutation,
  useFinalizarRecargaMutation,
  useGenerarDocSalidaMutation,
} from '../composables/useDocumentoSalidaMutations'
import { documentosSalidaService } from '../services/documentos-salida.service'
import type { CodigoTipoOrdenSalida } from '../interfaces/documento-salida.interface'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import {
  AppBadge,
  AppDatePicker,
  AppInput,
  AppModal,
  AppSelect,
  AppSelectSearch,
  AppTextarea,
} from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

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
  { label: 'Documentos de salida', path: '/admin/documentos-salida' },
  { label: documentoId.value ? 'Detalle' : 'Nuevo' },
]
const pageTitle = documentoId.value ? 'Documento de salida' : 'Nuevo documento de salida'

// ---- Catálogos ----
const catalogosQuery = useDocumentoSalidaCatalogosQuery()
const sucursalesQuery = useSucursalesQuery(ref({ pagina: 1, limite: 100 }))
const almacenesFilters = ref({ pagina: 1, limite: 200, buscar: undefined as string | undefined })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

const sucursalOptions = computed(
  () => sucursalesQuery.data.value?.data?.map((s) => ({ value: s.id, label: s.nombre })) ?? [],
)
const almacenOptions = computed(
  () => almacenesQuery.data.value?.data?.map((a) => ({ value: a.id, label: a.nombre })) ?? [],
)
const tipoGuiaOptions = computed(
  () => catalogosQuery.data.value?.tiposGuia.map((o) => ({ value: o.id, label: o.descripcion ?? o.nombre })) ?? [],
)
const motivoTrasladoOptions = computed(
  () =>
    catalogosQuery.data.value?.motivosTraslado.map((o) => ({ value: o.id, label: o.nombre.replace(/_/g, ' ') })) ?? [],
)
const modalidadTrasladoOptions = computed(
  () => catalogosQuery.data.value?.modalidadesTraslado.map((o) => ({ value: o.id, label: o.nombre })) ?? [],
)

const TIPO_ORDEN_OPCIONES: { value: CodigoTipoOrdenSalida; label: string }[] = [
  { value: 'ORDEN_SALIDA_INTERNA', label: 'Orden interna (sin venta)' },
  { value: 'TRASLADO', label: 'Traslado entre almacenes' },
  { value: 'RECARGA_PLANTA_EXTERNA', label: 'Envío a planta externa (recarga)' },
  { value: 'RETORNO_PLANTA_EXTERNA', label: 'Retorno desde planta externa' },
]
const tipoOrdenOptions = TIPO_ORDEN_OPCIONES

const TIPO_LABELS: Record<string, string> = {
  ORDEN_SALIDA_VENTA: 'Orden de venta',
  ORDEN_SALIDA_INTERNA: 'Orden interna',
  RECARGA_PLANTA_EXTERNA: 'Recarga planta',
  RETORNO_PLANTA_EXTERNA: 'Retorno planta',
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
const form = reactive<{
  codigoTipoOrden: CodigoTipoOrdenSalida
  idSucursal: number | ''
  idAlmacen: number | ''
  idCliente: number | ''
  idProveedor: number | ''
  idDestinatario: number | ''
  fecha: string
  fechaTraslado: string
  observaciones: string
}>({
  codigoTipoOrden: 'ORDEN_SALIDA_INTERNA',
  idSucursal: '',
  idAlmacen: '',
  idCliente: '',
  idProveedor: '',
  idDestinatario: '',
  fecha: '',
  fechaTraslado: '',
  observaciones: '',
})

const canSubmitHeader = computed(() => Boolean(form.codigoTipoOrden && form.idSucursal && form.idAlmacen))

const createMutation = useCreateDocumentoSalidaMutation()

async function submitHeader() {
  if (!canSubmitHeader.value) return
  try {
    const creado = await createMutation.mutateAsync({
      codigoTipoOrden: form.codigoTipoOrden,
      idSucursal: Number(form.idSucursal),
      idAlmacen: Number(form.idAlmacen),
      idCliente: form.idCliente ? Number(form.idCliente) : undefined,
      idProveedor: form.idProveedor ? Number(form.idProveedor) : undefined,
      idDestinatario: form.idDestinatario ? Number(form.idDestinatario) : undefined,
      fecha: form.fecha || undefined,
      fechaTraslado: form.fechaTraslado || undefined,
      observaciones: form.observaciones || undefined,
      idUsuarioAuditoria: idUsuarioAuditoria.value,
    })
    void router.replace({ name: 'admin-documentos-salida-editar', params: { id: creado.id } })
  } catch (error) {
    toastApiError(error, 'No se pudo crear el documento')
  }
}

// ---- Documento existente ----
const documentoQuery = useDocumentoSalidaQuery(documentoId)
const documento = computed(() => documentoQuery.data.value)

const isRecargaPlanta = computed(
  () =>
    documento.value?.nombre_tipo_orden === 'RECARGA_PLANTA_EXTERNA' ||
    documento.value?.nombre_tipo_orden === 'RETORNO_PLANTA_EXTERNA',
)

const puedeEditarDetalle = computed(
  () => documento.value?.nombre_estado_ciclo === 'BORRADOR' && !documento.value?.detalle_desde_venta,
)

const canConvertirGre = computed(
  () =>
    documento.value != null &&
    documento.value.nombre_estado_ciclo !== 'BORRADOR' &&
    documento.value.nombre_estado_ciclo !== 'ANULADA' &&
    !documento.value.emitido_sunat,
)

// ---- Agregar/quitar línea ----
const lineaModo = ref<'PRODUCTO' | 'BALON'>('PRODUCTO')
const nuevaLinea = reactive<{ idProducto: number | ''; idBalon: number | ''; cantidad: number | ''; glosa: string }>({
  idProducto: '',
  idBalon: '',
  cantidad: '',
  glosa: '',
})
const balonSearch = ref('')
const balonesFiltros = ref({ pagina: 1, limite: 20, buscar: undefined as string | undefined })
const balonesQuery = useBalonesQuery(balonesFiltros)
watch(balonSearch, (term) => {
  balonesFiltros.value = { ...balonesFiltros.value, buscar: term.trim() || undefined }
})
const balonOptions = computed(
  () => balonesQuery.data.value?.data?.map((b) => ({ value: b.id, label: b.codigo_balon })) ?? [],
)

const puedeAgregarLinea = computed(() => {
  if (!nuevaLinea.cantidad || Number(nuevaLinea.cantidad) <= 0) return false
  return lineaModo.value === 'PRODUCTO' ? Boolean(nuevaLinea.idProducto) : Boolean(nuevaLinea.idBalon)
})

const agregarDetalleMutation = useAgregarDetalleDocSalidaMutation()
async function onAgregarLinea() {
  if (!documento.value || !puedeAgregarLinea.value) return
  await agregarDetalleMutation.mutateAsync({
    id: documento.value.id,
    payload: {
      idProducto: lineaModo.value === 'PRODUCTO' ? Number(nuevaLinea.idProducto) : undefined,
      idBalon: lineaModo.value === 'BALON' ? Number(nuevaLinea.idBalon) : undefined,
      cantidad: Number(nuevaLinea.cantidad),
      glosa: nuevaLinea.glosa || undefined,
      idUsuarioAuditoria: idUsuarioAuditoria.value,
    },
  })
  nuevaLinea.idProducto = ''
  nuevaLinea.idBalon = ''
  nuevaLinea.cantidad = ''
  nuevaLinea.glosa = ''
}

const eliminarDetalleMutation = useEliminarDetalleDocSalidaMutation()
async function onEliminarDetalle(detalleId: number) {
  if (!documento.value) return
  await eliminarDetalleMutation.mutateAsync({
    detalleId,
    idDocSalida: documento.value.id,
    idUsuarioAuditoria: idUsuarioAuditoria.value,
  })
}

// ---- Generar / anular ----
const generarMutation = useGenerarDocSalidaMutation()
async function onGenerar() {
  if (!documento.value) return
  await generarMutation.mutateAsync({ id: documento.value.id, idUsuarioAuditoria: idUsuarioAuditoria.value })
}

const anularModalOpen = ref(false)
const anularMotivo = ref('')
const anularMutation = useAnularDocSalidaMutation()
async function onAnular() {
  if (!documento.value) return
  await anularMutation.mutateAsync({
    id: documento.value.id,
    payload: { motivo: anularMotivo.value || undefined, idUsuarioAuditoria: idUsuarioAuditoria.value },
  })
  anularModalOpen.value = false
  anularMotivo.value = ''
}

// ---- Convertir a GRE / emitir / consultar ----
const greModalOpen = ref(false)
const greForm = reactive({
  serie: '',
  idTipoGuiaRemision: '' as number | '',
  idMotivoTraslado: '' as number | '',
  idModalidadTraslado: '' as number | '',
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

watch(greModalOpen, (open) => {
  if (open && documento.value) {
    greForm.serie = documento.value.serie ?? ''
    greForm.idMotivoTraslado = documento.value.id_motivo_traslado ?? ''
    greForm.idModalidadTraslado = documento.value.id_modalidad_traslado ?? ''
    greForm.direccionOrigen = documento.value.direccion_origen ?? ''
    greForm.direccionLlegada = documento.value.direccion_llegada ?? ''
    greForm.pesoBruto = documento.value.peso_bruto ?? undefined
    greForm.numeroBultos = documento.value.numero_bultos ?? undefined
  }
})

const convertirGreMutation = useConvertirAGreMutation()
async function onConvertirGre() {
  if (!documento.value || !greForm.serie) return
  try {
    await convertirGreMutation.mutateAsync({
      id: documento.value.id,
      payload: {
        serie: greForm.serie.toUpperCase(),
        idTipoGuiaRemision: greForm.idTipoGuiaRemision ? Number(greForm.idTipoGuiaRemision) : undefined,
        idMotivoTraslado: greForm.idMotivoTraslado ? Number(greForm.idMotivoTraslado) : undefined,
        idModalidadTraslado: greForm.idModalidadTraslado ? Number(greForm.idModalidadTraslado) : undefined,
        direccionOrigen: greForm.direccionOrigen || undefined,
        idDistritoOrigen: greForm.idDistritoOrigen,
        direccionLlegada: greForm.direccionLlegada || undefined,
        idDistritoLlegada: greForm.idDistritoLlegada,
        idTransportista: greForm.idTransportista,
        idChofer: greForm.idChofer,
        idVehiculo: greForm.idVehiculo,
        pesoBruto: greForm.pesoBruto,
        numeroBultos: greForm.numeroBultos,
        idUsuarioAuditoria: idUsuarioAuditoria.value,
      },
    })
    greModalOpen.value = false
  } catch (error) {
    toastApiError(error, 'No se pudo completar la guía')
  }
}

const emitirMutation = useEmitirSunatDocSalidaMutation()
async function onEmitir() {
  if (!documento.value) return
  await emitirMutation.mutateAsync({ id: documento.value.id, idUsuarioAuditoria: idUsuarioAuditoria.value })
}

const consultarMutation = useConsultarEstadoDocSalidaMutation()
async function onConsultarEstado() {
  if (!documento.value) return
  await consultarMutation.mutateAsync({ id: documento.value.id, idUsuarioAuditoria: idUsuarioAuditoria.value })
}

// ---- Finalizar recarga (retorno de planta) ----
const finalizarModalOpen = ref(false)
const finalizarForm = reactive({
  fechaLlegadaAlmacen: '',
  idAlmacen: '' as number | '',
  lote: '',
  fechaVencimientoLote: '',
  fechaPruebaHidrostatica: '',
  guardarBalonesAlmacen: true,
})
watch(finalizarModalOpen, (open) => {
  if (open && documento.value) {
    finalizarForm.idAlmacen = documento.value.id_almacen
  }
})
const finalizarMutation = useFinalizarRecargaMutation()
async function onFinalizarRecarga() {
  if (!documento.value || !finalizarForm.fechaLlegadaAlmacen || !finalizarForm.idAlmacen) return
  await finalizarMutation.mutateAsync({
    id: documento.value.id,
    payload: {
      fechaLlegadaAlmacen: finalizarForm.fechaLlegadaAlmacen,
      idAlmacen: Number(finalizarForm.idAlmacen),
      lote: finalizarForm.lote || undefined,
      fechaVencimientoLote: finalizarForm.fechaVencimientoLote || undefined,
      fechaPruebaHidrostatica: finalizarForm.fechaPruebaHidrostatica || undefined,
      guardarBalonesAlmacen: finalizarForm.guardarBalonesAlmacen,
      idUsuarioAuditoria: idUsuarioAuditoria.value,
    },
  })
  finalizarModalOpen.value = false
}

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
