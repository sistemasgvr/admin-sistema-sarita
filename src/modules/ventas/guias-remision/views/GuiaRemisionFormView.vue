<template>
  <div>
    <PageBreadcrumb :page-title="pageTitle" :items="breadcrumbItems" />

    <div class="mb-5 flex flex-wrap items-center gap-2">
      <RouterLink
        :to="volverLink"
        class="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
      >
        <AppIcon :name="ICONS.chevronLeft" :size="16" />
        {{ volverLabel }}
      </RouterLink>
      <AppHelpTip :text="pageHelpText" />
    </div>

    <div
      v-if="isEdit && loadingGuia"
      class="rounded-2xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"
    >
      Cargando guía...
    </div>

    <form
      v-else
      id="guia-remision-form"
      class="space-y-5 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6"
      autocomplete="off"
      @submit.prevent="onSubmit"
    >
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AppSelect
          v-model="idTipoGuiaRemision"
          label="Tipo"
          placeholder="09 Remitente"
          required
          :options="tipoGuiaOptions"
          :disabled="saving || isEdit || catalogosQuery.isLoading.value"
          :error="errors.idTipoGuiaRemision"
        />
        <AppInput
          v-model="serie"
          label="Serie"
          placeholder="T001"
          required
          :disabled="saving || isEdit"
          :error="errors.serie"
        />
        <AppInput v-model="numero" label="Número" placeholder="Automático" disabled />
        <AppInput v-model="fecha" label="Fecha" type="date" required :disabled="saving" :error="errors.fecha" />
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AppInput
          v-model="fechaTraslado"
          label="Fecha traslado"
          type="date"
          required
          :disabled="saving"
          :error="errors.fechaTraslado"
        />
        <AppSelect
          v-model="idMotivoTraslado"
          label="Motivo"
          placeholder="Venta, traslado..."
          required
          :options="motivoOptions"
          :disabled="saving"
          :error="errors.idMotivoTraslado"
        />
        <AppSelect
          v-model="idModalidadTraslado"
          label="Modalidad"
          placeholder="Público / Privado"
          required
          :options="modalidadOptions"
          :disabled="saving"
          :error="errors.idModalidadTraslado"
        />
        <AppSelect
          v-model="idUnidadMedida"
          label="Und. peso"
          placeholder="KGM"
          :options="unidadPesoOptions"
          :disabled="saving"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AppSelect
          v-model="idSucursal"
          label="Sucursal"
          placeholder="Selecciona"
          required
          :options="sucursalOptions"
          :disabled="saving || sucursalesQuery.isLoading.value"
          :error="errors.idSucursal"
        />
        <AlmacenSelectField
          v-model="idAlmacen"
          label="Almacén"
          placeholder="Selecciona"
          required
          :options="almacenOptions"
          :disabled="saving"
          :error="errors.idAlmacen"
          @created="onAlmacenCreated"
        />
        <div class="flex items-end gap-2">
          <div class="min-w-0 flex-1">
            <AppInput
              v-model="pesoBruto"
              label="Peso bruto"
              type="number"
              step="0.01"
              min="0.01"
              required
              :disabled="saving"
              :error="errors.pesoBruto"
              :help="pesoBrutoHelp"
              @update:model-value="onPesoBultosManualEdit"
            />
          </div>
          <button
            type="button"
            class="mb-0 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-white/5"
            :disabled="saving || !pesoBultosCalculado.numeroBultos"
            title="Recalcular peso y bultos desde los ítems"
            @click="aplicarPesoBultosDesdeItems"
          >
            <AppIcon :name="ICONS.refreshCw" :size="16" />
          </button>
        </div>
        <AppInput
          v-model="numeroBultos"
          label="N° bultos"
          type="number"
          min="1"
          :disabled="saving"
          :help="numeroBultosHelp"
          @update:model-value="onPesoBultosManualEdit"
        />
      </div>

      <div v-if="esTipo31">
        <div class="mb-1.5 flex items-center justify-between">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Remitente <span class="text-error-500">*</span>
          </label>
        </div>
        <div
          class="mb-2 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800"
          role="tablist"
        >
          <button
            v-for="opt in modoDestinatarioOptions"
            :key="`remitente-${opt.value}`"
            type="button"
            role="tab"
            :aria-selected="modoRemitente === opt.value"
            :disabled="saving"
            :class="[
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition',
              modoRemitente === opt.value
                ? 'bg-white text-brand-600 shadow-theme-xs dark:bg-gray-900 dark:text-brand-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
            ]"
            @click="cambiarModoRemitente(opt.value)"
          >
            <AppIcon :name="opt.icon" :size="14" />
            {{ opt.label }}
          </button>
        </div>

        <div v-if="modoRemitente === 'cliente'" class="flex items-end gap-2">
          <div class="min-w-0 flex-1">
            <SearchableSelect
              v-model="idRemitente"
              placeholder="Cliente que remite la mercancía..."
              required
              :model-label="remitenteLabel"
              :disabled="saving"
              :error="remitenteError"
              :search-fn="searchClientes"
            />
          </div>
          <button
            v-if="canCreateCliente"
            type="button"
            title="Nuevo remitente"
            class="mb-0 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
            :disabled="saving"
            @click="abrirClienteModal('remitente')"
          >
            <AppIcon :name="ICONS.plus" :size="18" />
          </button>
        </div>

        <div v-else class="grid gap-3 sm:grid-cols-2">
          <AppInput
            v-model="remitenteNombreLibre"
            label="Nombre / razón social"
            placeholder="Nombre del remitente..."
            required
            :disabled="saving"
            :error="remitenteLibreErrorNombre"
          />
          <AppInput
            v-model="remitenteDocumentoLibre"
            label="Documento (DNI / RUC)"
            placeholder="8 u 11 dígitos"
            required
            :disabled="saving"
            :error="remitenteLibreErrorDocumento"
            help="SUNAT exige documento del remitente en GRE transportista (31)."
          />
        </div>
      </div>

      <div>
        <div class="mb-1.5 flex items-center justify-between">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Destinatario <span class="text-error-500">*</span>
          </label>
        </div>
        <div
          class="mb-2 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800"
          role="tablist"
        >
          <button
            v-for="opt in modoDestinatarioOptions"
            :key="opt.value"
            type="button"
            role="tab"
            :aria-selected="modoDestinatario === opt.value"
            :disabled="saving"
            :class="[
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition',
              modoDestinatario === opt.value
                ? 'bg-white text-brand-600 shadow-theme-xs dark:bg-gray-900 dark:text-brand-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
            ]"
            @click="cambiarModoDestinatario(opt.value)"
          >
            <AppIcon :name="opt.icon" :size="14" />
            {{ opt.label }}
          </button>
        </div>

        <div v-if="modoDestinatario === 'cliente'" class="flex items-end gap-2">
          <div class="min-w-0 flex-1">
            <SearchableSelect
              v-model="idDestinatario"
              placeholder="Busca cliente..."
              required
              :model-label="destinatarioLabel"
              :disabled="saving"
              :error="errors.idDestinatario || destinatarioLibreError"
              :search-fn="searchClientes"
            />
          </div>
          <button
            v-if="canCreateCliente"
            type="button"
            title="Nuevo destinatario"
            class="mb-0 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
            :disabled="saving"
            @click="abrirClienteModal('destinatario')"
          >
            <AppIcon :name="ICONS.plus" :size="18" />
          </button>
        </div>

        <div v-else class="grid gap-3 sm:grid-cols-2">
          <AppInput
            v-model="destinatarioNombreLibre"
            label="Nombre / razón social"
            placeholder="Nombre del destinatario..."
            required
            :disabled="saving"
            :error="destinatarioLibreErrorNombre"
          />
          <AppInput
            v-model="destinatarioDocumentoLibre"
            label="Documento (DNI / RUC)"
            placeholder="8 u 11 dígitos"
            required
            :disabled="saving"
            :error="destinatarioLibreErrorDocumento"
            help="SUNAT exige documento del destinatario aunque no esté en el sistema."
          />
        </div>
      </div>

      <ClienteFormModal
        v-model="clienteModalOpen"
        mode="create"
        @saved="onClienteCreado"
      />

      <div class="grid gap-4 lg:grid-cols-2">
        <div class="space-y-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
          <div class="flex items-center gap-1.5">
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">Punto de partida</p>
            <AppHelpTip :text="puntoPartidaHelp" :tone="origenHint ? 'warning' : 'default'" />
          </div>
          <div
            v-if="esTipo31 && modoRemitente === 'cliente'"
            class="flex items-end gap-2"
          >
            <div class="min-w-0 flex-1">
              <AppSelect
                v-model="idDireccionOrigen"
                label="Dirección del remitente"
                :placeholder="
                  idRemitente
                    ? direccionesRemitente.length
                      ? 'Selecciona una dirección'
                      : 'Sin direcciones — se usa ubicación o sucursal'
                    : 'Selecciona remitente primero'
                "
                :options="direccionOrigenOptions"
                :disabled="saving || !idRemitente || cargandoDireccionesOrigen"
              />
            </div>
            <button
              v-if="canCreateDireccion && idRemitente"
              type="button"
              title="Registrar dirección del remitente"
              class="mb-0 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
              :disabled="saving || cargandoDireccionesOrigen"
              @click="direccionOrigenModalOpen = true"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
            </button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-if="puedeUsarUbicacionRemitente"
              type="button"
              class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 text-xs font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
              :disabled="saving || aplicandoOrigenRemitente || cargandoDireccionesOrigen"
              @click="usarUbicacionRemitente"
            >
              <AppIcon
                :name="aplicandoOrigenRemitente ? ICONS.loader : ICONS.mapPin"
                :size="14"
                :class="aplicandoOrigenRemitente ? 'animate-spin' : ''"
              />
              {{ aplicandoOrigenRemitente ? 'Cargando...' : 'Usar ubicación del remitente' }}
            </button>
            <button
              v-if="idSucursal"
              type="button"
              class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 text-xs font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
              :disabled="saving || aplicandoOrigenSucursal"
              @click="usarDireccionSucursal"
            >
              <AppIcon
                :name="aplicandoOrigenSucursal ? ICONS.loader : ICONS.building2"
                :size="14"
                :class="aplicandoOrigenSucursal ? 'animate-spin' : ''"
              />
              {{ aplicandoOrigenSucursal ? 'Cargando...' : 'Usar dirección de sucursal' }}
            </button>
          </div>
          <div class="relative space-y-3">
            <div
              v-if="aplicandoOrigenSucursal || aplicandoOrigenRemitente || cargandoDireccionesOrigen"
              class="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 dark:bg-gray-900/70"
            >
              <div class="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-gray-600 shadow-theme-md dark:bg-gray-800 dark:text-gray-300">
                <AppIcon :name="ICONS.loader" :size="16" class="animate-spin text-brand-500" />
                Actualizando origen...
              </div>
            </div>
          <AppInput
            v-model="direccionOrigen"
            label="Dirección origen"
            placeholder="Av. ..."
            required
            :disabled="saving || aplicandoOrigenSucursal || aplicandoOrigenRemitente || cargandoDireccionesOrigen"
            :error="errors.direccionOrigen"
          />
          <div class="grid gap-3 sm:grid-cols-3">
            <AppSelect
              v-model="idDepartamentoOrigen"
              label="Departamento"
              :options="departamentosOptions"
              :disabled="saving || aplicandoOrigenSucursal || aplicandoOrigenRemitente || cargandoDireccionesOrigen"
            />
            <AppSelect
              v-model="idProvinciaOrigen"
              label="Provincia"
              :options="provinciasOrigenOptions"
              :disabled="saving || !idDepartamentoOrigen || aplicandoOrigenSucursal || aplicandoOrigenRemitente || cargandoDireccionesOrigen"
            />
            <AppSelect
              v-model="idDistritoOrigen"
              label="Distrito"
              required
              :options="distritosOrigenOptions"
              :disabled="saving || !idProvinciaOrigen || aplicandoOrigenSucursal || aplicandoOrigenRemitente || cargandoDireccionesOrigen"
              :error="distritoOrigenError"
            />
          </div>
          </div>
        </div>

        <div class="space-y-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
          <div class="flex items-center gap-1.5">
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">Punto de llegada</p>
            <AppHelpTip
              text="Si el destinatario no tiene direcciones, puedes completarlas manualmente o usar la ubicación del cliente."
            />
          </div>
          <div v-if="modoDestinatario === 'cliente'" class="flex items-end gap-2">
            <div class="min-w-0 flex-1">
              <AppSelect
                v-model="idDireccionLlegada"
                label="Dirección del destinatario"
                :placeholder="
                  idDestinatario
                    ? direccionesDestinatario.length
                      ? 'Selecciona una dirección'
                      : 'Sin direcciones — ingreso manual'
                    : 'Selecciona destinatario primero'
                "
                :options="direccionLlegadaOptions"
                :disabled="saving || !idDestinatario || cargandoDirecciones"
              />
            </div>
            <button
              v-if="canCreateDireccion && idDestinatario"
              type="button"
              title="Registrar dirección del destinatario"
              class="mb-0 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
              :disabled="saving || cargandoDirecciones"
              @click="direccionModalOpen = true"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
            </button>
          </div>
          <p v-else class="text-xs text-gray-500 dark:text-gray-400">
            Completa la dirección de llegada manualmente (destinatario no registrado).
          </p>
          <p v-if="llegadaHint" class="text-xs text-gray-500 dark:text-gray-400">
            {{ llegadaHint }}
          </p>
          <button
            v-if="puedeUsarUbicacionCliente"
            type="button"
            class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 text-xs font-medium text-brand-600 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
            :disabled="saving || aplicandoUbicacionCliente || cargandoDirecciones"
            @click="usarUbicacionCliente"
          >
            <AppIcon
              :name="aplicandoUbicacionCliente ? ICONS.loader : ICONS.mapPin"
              :size="14"
              :class="aplicandoUbicacionCliente ? 'animate-spin' : ''"
            />
            {{ aplicandoUbicacionCliente ? 'Cargando...' : 'Usar ubicación del cliente' }}
          </button>
          <div class="relative space-y-3">
            <div
              v-if="aplicandoUbicacionCliente || cargandoDirecciones"
              class="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 dark:bg-gray-900/70"
            >
              <div class="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-gray-600 shadow-theme-md dark:bg-gray-800 dark:text-gray-300">
                <AppIcon :name="ICONS.loader" :size="16" class="animate-spin text-brand-500" />
                {{ aplicandoUbicacionCliente ? 'Aplicando ubicación del cliente...' : 'Cargando direcciones...' }}
              </div>
            </div>
            <AppInput
              v-model="direccionLlegada"
              label="Dirección llegada"
              placeholder="Escribe o se completa al elegir dirección / ubicación"
              required
              :disabled="saving || aplicandoUbicacionCliente || cargandoDirecciones"
              :error="errors.direccionLlegada"
            />
            <div class="grid gap-3 sm:grid-cols-3">
              <AppSelect
                v-model="idDepartamentoLlegada"
                label="Departamento"
                :options="departamentosOptions"
                :disabled="saving || aplicandoUbicacionCliente || cargandoDirecciones"
              />
              <AppSelect
                v-model="idProvinciaLlegada"
                label="Provincia"
                :options="provinciasLlegadaOptions"
                :disabled="saving || !idDepartamentoLlegada || aplicandoUbicacionCliente || cargandoDirecciones"
              />
              <AppSelect
                v-model="idDistritoLlegada"
                label="Distrito"
                required
                :options="distritosLlegadaOptions"
                :disabled="saving || !idProvinciaLlegada || aplicandoUbicacionCliente || cargandoDirecciones"
                :error="distritoLlegadaError"
              />
            </div>
          </div>
        </div>
      </div>

      <DireccionFormModal
        v-model="direccionModalOpen"
        mode="create"
        :default-cliente-id="idDestinatario ? Number(idDestinatario) : null"
        :default-cliente-label="destinatarioLabel"
        :lock-cliente="true"
        @saved="onDireccionDestinatarioCreada"
      />
      <DireccionFormModal
        v-model="direccionOrigenModalOpen"
        mode="create"
        :default-cliente-id="idRemitente ? Number(idRemitente) : null"
        :default-cliente-label="remitenteLabel"
        :lock-cliente="true"
        @saved="onDireccionRemitenteCreada"
      />

      <div v-if="esPrivado" class="grid gap-3 sm:grid-cols-2">
        <div class="flex items-end gap-2">
          <div class="min-w-0 flex-1">
            <SearchableSelect
              v-model="idChofer"
              label="Chofer"
              placeholder="Flota propia o del destinatario..."
              required
              :model-label="choferLabel"
              :disabled="saving"
              :error="errors.idChofer"
              :search-fn="searchChoferes"
            />
          </div>
          <button
            v-if="canCreateChofer"
            type="button"
            title="Nuevo chofer"
            class="mb-0 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
            :disabled="saving"
            @click="choferModalOpen = true"
          >
            <AppIcon :name="ICONS.plus" :size="18" />
          </button>
        </div>
        <div class="flex items-end gap-2">
          <div class="min-w-0 flex-1">
            <SearchableSelect
              v-model="idVehiculo"
              label="Vehículo"
              placeholder="Flota propia o del destinatario..."
              required
              :model-label="vehiculoLabel"
              :disabled="saving"
              :error="errors.idVehiculo"
              :search-fn="searchVehiculos"
            />
          </div>
          <button
            v-if="canCreateVehiculo"
            type="button"
            title="Nuevo vehículo"
            class="mb-0 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
            :disabled="saving"
            @click="vehiculoModalOpen = true"
          >
            <AppIcon :name="ICONS.plus" :size="18" />
          </button>
        </div>
      </div>

      <div v-else class="flex items-end gap-2">
        <div class="min-w-0 flex-1">
          <SearchableSelect
            v-model="idTransportista"
            label="Transportista (RUC)"
            placeholder="Busca transportista..."
            required
            :model-label="transportistaLabel"
            :disabled="saving"
            :error="errors.idTransportista"
            :search-fn="searchClientes"
          />
        </div>
        <button
          v-if="canCreateCliente"
          type="button"
          title="Nuevo transportista"
          class="mb-0 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:hover:bg-brand-500/20"
          :disabled="saving"
          @click="transportistaModalOpen = true"
        >
          <AppIcon :name="ICONS.plus" :size="18" />
        </button>
      </div>

      <ChoferFormModal
        v-model="choferModalOpen"
        mode="create"
        :default-cliente-id="idDestinatario ? Number(idDestinatario) : null"
        :default-cliente-label="destinatarioLabel"
        @saved="onChoferCreado"
      />
      <VehiculoFormModal
        v-model="vehiculoModalOpen"
        mode="create"
        :default-cliente-id="idDestinatario ? Number(idDestinatario) : null"
        :default-cliente-label="destinatarioLabel"
        @saved="onVehiculoCreado"
      />
      <ClienteFormModal
        v-model="transportistaModalOpen"
        mode="create"
        @saved="onTransportistaCreado"
      />

      <AppInput
        v-model="observaciones"
        label="Observaciones"
        placeholder="Opcional"
        :disabled="saving"
      />

      <div class="space-y-3">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">Ítems</p>
            <AppHelpTip :text="itemsHelpText" />
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
            :disabled="saving"
            @click="agregarLinea"
          >
            <AppIcon :name="ICONS.plus" :size="14" />
            Agregar
          </button>
        </div>

        <p v-if="detallesError" class="text-xs text-error-500">{{ detallesError }}</p>

        <div
          v-for="(linea, index) in lineas"
          :key="linea.key"
          class="space-y-2 rounded-xl border border-gray-100 p-3 dark:border-gray-800"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div
              v-if="!origenRecargaPlanta"
              class="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800"
              role="tablist"
            >
              <button
                v-for="opt in tipoLineaGuiaOptions"
                :key="`${linea.key}-${opt.value}`"
                type="button"
                role="tab"
                :aria-selected="linea.tipo === opt.value"
                :disabled="saving"
                :class="[
                  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition',
                  linea.tipo === opt.value
                    ? 'bg-white text-brand-600 shadow-theme-xs dark:bg-gray-900 dark:text-brand-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                ]"
                @click="cambiarTipoLinea(index, opt.value)"
              >
                <AppIcon :name="opt.icon" :size="14" />
                {{ opt.label }}
              </button>
            </div>
            <p v-else class="text-xs text-gray-500 dark:text-gray-400">Cilindro (salida a planta)</p>
            <button
              type="button"
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-700"
              :disabled="saving || lineas.length <= 1"
              title="Quitar"
              @click="quitarLinea(index)"
            >
              <AppIcon :name="ICONS.trash" :size="14" />
            </button>
          </div>
          <div class="grid gap-2 sm:grid-cols-[1fr_88px_100px] sm:items-end">
            <SearchableSelect
              v-if="linea.tipo === 'cilindro'"
              v-model="linea.idBalon"
              label="Cilindro / serie"
              placeholder="Código o serie del envase..."
              required
              :model-label="linea.balonLabel"
              :disabled="saving"
              :search-fn="searchBalonesForLine(index)"
              @update:model-value="(v) => onBalonSelected(index, v)"
            />
            <SearchableSelect
              v-else-if="linea.tipo === 'producto'"
              v-model="linea.idProducto"
              label="Producto"
              placeholder="Accesorio o mercadería (sin gases)..."
              required
              :model-label="linea.productoLabel"
              :disabled="saving"
              :search-fn="searchProductosCatalogo"
              @update:model-value="(v) => onProductoSelected(index, v)"
            />
            <AppInput
              v-else
              v-model="linea.glosa"
              label="Descripción"
              placeholder="Qué se traslada (ingreso libre)..."
              required
              :disabled="saving"
            />
            <AppInput
              v-model="linea.cantidad"
              label="Cantidad"
              type="number"
              min="0.01"
              step="0.01"
              :disabled="saving"
            />
            <AppInput
              v-model="linea.pesoKg"
              label="Peso kg"
              type="number"
              min="0.01"
              step="0.01"
              :required="lineaRequierePeso(linea)"
              :disabled="saving"
              :error="errorPesoLinea(linea)"
              :help="helpPesoLinea(linea)"
              @update:model-value="onPesoLineaEdit(index)"
            />
          </div>
          <SearchableSelect
            v-if="linea.tipo === 'cilindro' && linea.idBalon && !linea.idProducto"
            v-model="linea.idProducto"
            label="Producto / gas"
            placeholder="Este cilindro no tiene gas asociado..."
            required
            :model-label="linea.productoLabel"
            :disabled="saving"
            :search-fn="searchProductosGas"
            @update:model-value="(v) => onProductoSelected(index, v)"
          />
          <AppInput
            v-if="linea.tipo !== 'libre'"
            v-model="linea.glosa"
            label="Descripción / glosa"
            placeholder="Opcional. Se completa al elegir el ítem."
            :disabled="saving"
          />
        </div>
      </div>

      <div
        class="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 dark:border-gray-800 sm:flex-row sm:justify-end"
      >
        <button
          type="button"
          class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
          :disabled="saving"
          @click="handleClose"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-70 sm:w-auto"
          :disabled="saving || (isEdit && loadingGuia)"
        >
          {{ saving ? 'Guardando...' : isEdit ? 'Actualizar guía' : 'Guardar guía' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import PageBreadcrumb from '@/modules/admin/components/PageBreadcrumb.vue'
import {
  useDepartamentosQuery,
  useDistritosQuery,
  usePaisesQuery,
  useProvinciasQuery,
} from '@/modules/catalogos/composables/useUbigeoQueries'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import ClienteFormModal from '@/modules/clientes/components/ClienteFormModal.vue'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import { getClienteOptionLabel } from '@/modules/clientes/utils/clienteNombre'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import ChoferFormModal from '@/modules/choferes/components/ChoferFormModal.vue'
import { choferesService } from '@/modules/choferes/services/choferes.service'
import type { Chofer } from '@/modules/choferes/interfaces/chofer.interface'
import DireccionFormModal from '@/modules/direcciones/components/DireccionFormModal.vue'
import VehiculoFormModal from '@/modules/vehiculos/components/VehiculoFormModal.vue'
import type { Vehiculo } from '@/modules/vehiculos/interfaces/vehiculo.interface'
import AlmacenSelectField from '@/modules/configuracion/almacenes/components/AlmacenSelectField.vue'
import type { Almacen } from '@/modules/configuracion/almacenes/interfaces/almacen.interface'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useSucursalesQuery } from '@/modules/configuracion/sucursales/composables/useSucursalesQuery'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { balonesService } from '@/modules/balones/cilindros/services/balones.service'
import type { Balon } from '@/modules/balones/cilindros/interfaces/balon.interface'
import { ListaIds } from '@/shared/constants/lista-ids'
import { direccionesService } from '@/modules/direcciones/services/direcciones.service'
import type { Direccion } from '@/modules/direcciones/interfaces/direccion.interface'
import { productosService } from '@/modules/productos/articulos/services/productos.service'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import { filtrarProductosCatalogo } from '@/modules/productos/articulos/utils/productosSistema'
import {
  balonToSelectOption,
} from '@/modules/ventas/comprobantes/composables/usePosBalonSelect'
import {
  buildGuiaDetalleGlosa,
  labelBalonGuia,
} from '@/modules/ventas/guias-remision/utils/buildGuiaDetalleGlosa'
import { calcularPesoBultosGuia, pesoCatalogoBalonKg } from '@/modules/ventas/guias-remision/utils/calcularPesoBultosGuia'
import {
  useCreateGuiaRemisionMutation,
  useUpdateGuiaRemisionMutation,
} from '@/modules/ventas/guias-remision/composables/useGuiaRemisionMutations'
import {
  useGuiaRemisionCatalogosQuery,
  useGuiaRemisionQuery,
} from '@/modules/ventas/guias-remision/composables/useGuiasRemisionQuery'
import { guiasRemisionService } from '@/modules/ventas/guias-remision/services/guias-remision.service'
import { vehiculosService } from '@/modules/vehiculos/services/vehiculos.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppHelpTip, AppInput, AppSelect } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import SearchableSelect from '@/shared/components/form/SearchableSelect.vue'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { toastSuccess, toastWarning } from '@/shared/composables/useToast'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const createMutation = useCreateGuiaRemisionMutation()
const updateMutation = useUpdateGuiaRemisionMutation()
const catalogosQuery = useGuiaRemisionCatalogosQuery()

const guiaId = computed(() => {
  const raw = route.params.id
  if (raw == null || raw === '') return null
  const id = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(id) && id > 0 ? id : null
})

const isEdit = computed(() => Boolean(guiaId.value))

const origenRecargaPlanta = computed(
  () => String(route.query.origen ?? '') === 'recarga-planta',
)

function resolveReturnTo(): string | null {
  const raw = route.query.returnTo
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string' || !value.startsWith('/admin/')) return null
  return value
}

const returnTo = computed(() => resolveReturnTo())
const returnIdParam = computed(() => {
  const raw = route.query.returnIdParam
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' && value.trim() ? value.trim() : 'idGuiaSalida'
})

const volverLink = computed(() =>
  returnTo.value
    ? returnTo.value
    : { name: 'admin-ventas-guias-remision' as const },
)
const volverLabel = computed(() =>
  origenRecargaPlanta.value ? 'Volver a orden de recarga' : 'Volver a guías',
)

const pageTitle = computed(() =>
  isEdit.value
    ? 'Editar guía de remisión'
    : origenRecargaPlanta.value
      ? 'GRE salida vacíos (planta externa)'
      : 'Nueva guía de remisión',
)
const pageHelpText = computed(() => {
  if (isEdit.value) {
    return 'Solo se pueden editar guías no aceptadas por SUNAT. Serie y número no se modifican.'
  }
  if (origenRecargaPlanta.value) {
    return 'Salida de cilindros vacíos EMPRESA a planta. Un cilindro por línea (id_balon). Al guardar vuelves a la orden de recarga.'
  }
  return 'Remitente (09 / T…) o Transportista (31 / V…). Privado usa flota propia. Ítems: cilindro (envase), producto (sin gases) o descripción libre.'
})
const breadcrumbItems = computed(() => [
  { label: 'Ventas', to: '/admin/ventas' },
  { label: 'Guías de remisión', to: '/admin/ventas/guias-remision' },
  { label: isEdit.value ? 'Editar' : origenRecargaPlanta.value ? 'GRE vacíos' : 'Nueva' },
])

const propietarioListaId = ref(ListaIds.PROPIETARIO_BALON)
const contenidoListaId = ref(ListaIds.ESTADO_CONTENIDO_BALON)
const propietarioQuery = useListaOpcionesQuery(propietarioListaId)
const contenidoQuery = useListaOpcionesQuery(contenidoListaId)
const idPropietarioEmpresa = computed(
  () => propietarioQuery.data.value?.find((op) => op.nombre === 'EMPRESA')?.id,
)
const idContenidoVacio = computed(
  () => contenidoQuery.data.value?.find((op) => op.nombre === 'VACIO')?.id,
)

const guiaQuery = useGuiaRemisionQuery(guiaId)
const loadingGuia = computed(() => isEdit.value && guiaQuery.isFetching.value)

const sucursalesFilters = ref({ pagina: 1, limite: 100 })
const almacenesFilters = ref<{ pagina: number; limite: number; idSucursal?: number }>({
  pagina: 1,
  limite: 100,
})
const sucursalesQuery = useSucursalesQuery(sucursalesFilters)
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

const destinatarioLabel = ref<string | null>(null)
const remitenteLabel = ref<string | null>(null)
type ModoPersonaGuia = 'cliente' | 'libre'
const modoDestinatario = ref<ModoPersonaGuia>('cliente')
const destinatarioNombreLibre = ref('')
const destinatarioDocumentoLibre = ref('')
const destinatarioLibreError = ref('')
const destinatarioLibreErrorNombre = ref('')
const destinatarioLibreErrorDocumento = ref('')
const modoRemitente = ref<ModoPersonaGuia>('cliente')
const remitenteNombreLibre = ref('')
const remitenteDocumentoLibre = ref('')
const remitenteLibreErrorNombre = ref('')
const remitenteLibreErrorDocumento = ref('')
const modoDestinatarioOptions = [
  { value: 'cliente' as const, label: 'Cliente', icon: ICONS.users },
  { value: 'libre' as const, label: 'Nombre libre', icon: ICONS.pencil },
]
type TipoLineaGuia = 'cilindro' | 'producto' | 'libre'
const tipoLineaGuiaOptions = [
  { value: 'cilindro' as const, label: 'Cilindro', icon: ICONS.cylinder },
  { value: 'producto' as const, label: 'Producto', icon: ICONS.package },
  { value: 'libre' as const, label: 'Libre', icon: ICONS.pencil },
]
const itemsHelpText = computed(() =>
  origenRecargaPlanta.value
    ? 'Salida a planta: un cilindro vacío EMPRESA por línea.'
    : 'Cilindro = envase físico. Producto = accesorios/mercadería (sin gases ni servicios). Libre = descripción. El gas viaja con el cilindro.',
)

function cambiarModoDestinatario(modo: ModoPersonaGuia) {
  if (modoDestinatario.value === modo) return
  modoDestinatario.value = modo
  destinatarioLibreError.value = ''
  destinatarioLibreErrorNombre.value = ''
  destinatarioLibreErrorDocumento.value = ''
  if (modo === 'cliente') {
    destinatarioNombreLibre.value = ''
    destinatarioDocumentoLibre.value = ''
  } else {
    idDestinatario.value = undefined
    destinatarioLabel.value = null
    idDireccionLlegada.value = ''
    direccionesDestinatario.value = []
    clienteUbicacionCache.value = null
  }
}

function validarDestinatarioForm(): boolean {
  destinatarioLibreError.value = ''
  destinatarioLibreErrorNombre.value = ''
  destinatarioLibreErrorDocumento.value = ''
  if (modoDestinatario.value === 'cliente') {
    if (!idDestinatario.value) {
      destinatarioLibreError.value = 'Destinatario obligatorio'
      toastWarning('Selecciona el destinatario')
      return false
    }
    return true
  }
  const nombre = destinatarioNombreLibre.value.trim()
  const doc = destinatarioDocumentoLibre.value.replace(/\D/g, '')
  let ok = true
  if (nombre.length < 2) {
    destinatarioLibreErrorNombre.value = 'Ingresa el nombre o razón social'
    ok = false
  }
  if (doc.length !== 8 && doc.length !== 11) {
    destinatarioLibreErrorDocumento.value = 'Documento: DNI (8) o RUC (11)'
    ok = false
  }
  if (!ok) toastWarning('Completa nombre y documento del destinatario')
  else destinatarioDocumentoLibre.value = doc
  return ok
}

function cambiarModoRemitente(modo: ModoPersonaGuia) {
  if (modoRemitente.value === modo) return
  modoRemitente.value = modo
  remitenteError.value = ''
  remitenteLibreErrorNombre.value = ''
  remitenteLibreErrorDocumento.value = ''
  if (modo === 'cliente') {
    remitenteNombreLibre.value = ''
    remitenteDocumentoLibre.value = ''
  } else {
    idRemitente.value = ''
    remitenteLabel.value = null
    idDireccionOrigen.value = ''
    direccionesRemitente.value = []
    remitenteUbicacionCache.value = null
    origenHint.value =
      'Remitente con nombre libre: completa el origen o usa la dirección de la sucursal.'
  }
}

function validarRemitenteForm(): boolean {
  remitenteError.value = ''
  remitenteLibreErrorNombre.value = ''
  remitenteLibreErrorDocumento.value = ''
  if (modoRemitente.value === 'cliente') {
    if (!idRemitente.value) {
      remitenteError.value = 'Remitente obligatorio para GRE transportista (31)'
      toastWarning('Selecciona el remitente de la mercancía')
      return false
    }
    return true
  }
  const nombre = remitenteNombreLibre.value.trim()
  const doc = remitenteDocumentoLibre.value.replace(/\D/g, '')
  let ok = true
  if (nombre.length < 2) {
    remitenteLibreErrorNombre.value = 'Ingresa el nombre o razón social'
    ok = false
  }
  if (doc.length !== 8 && doc.length !== 11) {
    remitenteLibreErrorDocumento.value = 'Documento: DNI (8) o RUC (11)'
    ok = false
  }
  if (!ok) toastWarning('Completa nombre y documento del remitente')
  else remitenteDocumentoLibre.value = doc
  return ok
}

const clienteModalOpen = ref(false)
type ClienteModalTarget = 'destinatario' | 'remitente'
const clienteModalTarget = ref<ClienteModalTarget>('destinatario')
const transportistaModalOpen = ref(false)
const choferModalOpen = ref(false)
const vehiculoModalOpen = ref(false)
const direccionModalOpen = ref(false)
const direccionOrigenModalOpen = ref(false)
const canCreateCliente = computed(() =>
  authStore.hasPermission(PermisoBanderas.CLIENTES_CREAR),
)
const canCreateChofer = computed(() =>
  authStore.hasPermission(PermisoBanderas.CHOFERES_CREAR),
)
const canCreateVehiculo = computed(() =>
  authStore.hasPermission(PermisoBanderas.VEHICULOS_CREAR),
)
const canCreateDireccion = computed(() =>
  authStore.hasPermission(PermisoBanderas.DIRECCIONES_CREAR),
)
const llegadaHint = ref('')
const origenHint = ref('')
const puntoPartidaHelp = computed(() => {
  const parts: string[] = []
  if (esTipo31.value) {
    parts.push(
      'En GRE transportista el origen suele ser la dirección del remitente. Al seleccionarlo se carga automáticamente; también puedes usar la sucursal o editarla.',
    )
    if (modoRemitente.value === 'cliente' && remitenteLabel.value) {
      parts.push(`Origen según remitente: ${remitenteLabel.value}.`)
    } else if (sucursalSeleccionadaNombre.value) {
      parts.push(`Origen según sucursal: ${sucursalSeleccionadaNombre.value}.`)
    }
  } else {
    parts.push(
      'Con varias sucursales, elige la que despacha: el origen se carga con su dirección y ubigeo. Si el bien sale de otro punto físico, edítalo aquí. Cada sucursal debe tener ubigeo en Configuración.',
    )
    if (sucursalSeleccionadaNombre.value) {
      parts.push(`Origen según sucursal: ${sucursalSeleccionadaNombre.value}.`)
    }
  }
  if (origenHint.value) parts.push(origenHint.value)
  return parts.join(' ')
})
const clienteUbicacionCache = ref<Cliente | null>(null)
const remitenteUbicacionCache = ref<Cliente | null>(null)
const aplicandoUbicacionCliente = ref(false)
const aplicandoOrigenSucursal = ref(false)
const aplicandoOrigenRemitente = ref(false)
const puedeUsarUbicacionCliente = computed(() => {
  const c = clienteUbicacionCache.value
  if (!c || !idDestinatario.value) return false
  return Boolean(c.direccion?.trim() || c.id_distrito || c.id_departamento)
})
const puedeUsarUbicacionRemitente = computed(() => {
  const c = remitenteUbicacionCache.value
  if (!c || !idRemitente.value) return false
  return Boolean(c.direccion?.trim() || c.id_distrito || c.id_departamento)
})
const idRemitente = ref<number | ''>('')
const remitenteError = ref('')
const choferLabel = ref<string | null>(null)
const vehiculoLabel = ref<string | null>(null)
const transportistaLabel = ref<string | null>(null)
const detallesError = ref('')
const distritoOrigenError = ref('')
const distritoLlegadaError = ref('')
const direccionLlegadaSelectError = ref('')
const cargandoDirecciones = ref(false)
const cargandoDireccionesOrigen = ref(false)
const idDireccionLlegada = ref<number | ''>('')
const idDireccionOrigen = ref<number | ''>('')
const direccionesDestinatario = ref<Direccion[]>([])
const direccionesRemitente = ref<Direccion[]>([])
const productosCache = new Map<number, { idUnidadMedida?: number; nombre: string; codigo: string }>()
const balonesCache = new Map<number, Balon>()
/** Contador: evita que llamadas anidadas liberen el suppress y borren el distrito. */
const ubigeoSuppressDepth = ref(0)
const suppressDestinatarioReset = ref(false)
const suppressRemitenteReset = ref(false)
const applyingDireccionLlegada = ref(false)
const applyingDireccionOrigen = ref(false)
/** Labels temporales para que AppSelect muestre provincia/distrito antes de que llegue el query. */
const llegadaProvinciaFallback = ref<SelectOption | null>(null)
const llegadaDistritoFallback = ref<SelectOption | null>(null)
const origenProvinciaFallback = ref<SelectOption | null>(null)
const origenDistritoFallback = ref<SelectOption | null>(null)

function beginUbigeoSuppress() {
  ubigeoSuppressDepth.value += 1
}

function endUbigeoSuppress() {
  ubigeoSuppressDepth.value = Math.max(0, ubigeoSuppressDepth.value - 1)
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/** Espera a que el id esté en las opciones (query cargado), no solo en el fallback UI. */
async function waitForSelectOption(
  getOptions: () => SelectOption[],
  targetId: number | null | undefined,
  timeoutMs = 6000,
) {
  if (targetId == null) return
  const target = Number(targetId)
  if (!Number.isFinite(target)) return

  await nextTick()
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (getOptions().some((o) => Number(o.value) === target)) return
    await sleep(40)
  }
}

function withFallbackOption(
  options: SelectOption[],
  fallback: SelectOption | null,
): SelectOption[] {
  if (!fallback) return options
  if (options.some((o) => Number(o.value) === Number(fallback.value))) return options
  return [fallback, ...options]
}

type LineaForm = {
  key: string
  tipo: TipoLineaGuia
  idBalon: number | ''
  balonLabel: string | null
  idProducto: number | ''
  productoLabel: string | null
  cantidad: number
  /** Peso bruto del ítem en kg (catálogo o captura manual). */
  pesoKg: number | ''
  idUnidadMedida?: number
  descripcion?: string
  glosa?: string
}

function lineaVacia(tipo: TipoLineaGuia = 'cilindro'): LineaForm {
  return {
    key: crypto.randomUUID(),
    tipo: origenRecargaPlanta.value ? 'cilindro' : tipo,
    idBalon: '',
    balonLabel: null,
    idProducto: '',
    productoLabel: null,
    cantidad: 1,
    pesoKg: '',
    glosa: '',
  }
}

const lineas = reactive<LineaForm[]>([lineaVacia()])

/** Si true, no sobrescribe peso/bultos al cambiar ítems (edición manual o carga de guía). */
const pesoBultosManual = ref(false)

const pesoBultosCalculado = computed(() =>
  calcularPesoBultosGuia(
    lineas
      .filter((l) => lineaTieneContenido(l))
      .map((l) => ({
        idBalon: l.idBalon,
        cantidad: l.cantidad,
        pesoKg: l.pesoKg === '' ? null : Number(l.pesoKg),
      })),
    balonesCache,
  ),
)

const pesoBrutoHelp = computed(() => {
  const c = pesoBultosCalculado.value
  const base =
    'SUNAT: peso bruto total (KGM). Se acumula desde el peso de cada ítem. Si el cilindro no tiene tara en catálogo, ingresa el peso en la línea.'
  if (!c.numeroBultos) return base
  const partes: string[] = [`Acumulado: ${c.pesoBrutoKg || '—'} kg`]
  if (c.conTaraCatalogo) partes.push(`${c.conTaraCatalogo} desde catálogo`)
  if (c.conPesoManual) partes.push(`${c.conPesoManual} capturados`)
  if (c.sinPeso) partes.push(`${c.sinPeso} sin peso`)
  return `${base} ${partes.join(' · ')}.`
})

const numeroBultosHelp = computed(() => {
  const n = pesoBultosCalculado.value.numeroBultos
  const base =
    'SUNAT: número de bultos. Cilindro = 1 bulto; producto o libre usa la cantidad.'
  return n ? `${base} Sugerido ahora: ${n}.` : base
})

function lineaTieneContenido(linea: LineaForm): boolean {
  if (linea.tipo === 'cilindro') return Boolean(linea.idBalon)
  if (linea.tipo === 'producto') return Boolean(linea.idProducto)
  return Boolean(linea.glosa?.trim())
}

function lineaRequierePeso(linea: LineaForm): boolean {
  if (!lineaTieneContenido(linea)) return false
  const peso = Number(linea.pesoKg)
  return !(Number.isFinite(peso) && peso > 0)
}

function errorPesoLinea(linea: LineaForm): string | undefined {
  if (!lineaRequierePeso(linea)) return undefined
  if (linea.idBalon) {
    const balon = balonesCache.get(Number(linea.idBalon))
    if (pesoCatalogoBalonKg(balon) == null) {
      return 'Ingresa el peso (no hay tara en BD)'
    }
  }
  return 'Ingresa el peso en kg'
}

function helpPesoLinea(linea: LineaForm): string {
  if (linea.idBalon) {
    const balon = balonesCache.get(Number(linea.idBalon))
    const catalogo = pesoCatalogoBalonKg(balon)
    if (catalogo != null) {
      return `Tara de catálogo: ${catalogo} kg. Puedes ajustarla si el peso bruto real es distinto.`
    }
    return 'Este cilindro no tiene tara en el tipo de balón. Ingresa el peso bruto en kg para acumularlo en la guía.'
  }
  return 'Peso bruto del ítem en kg. Se suma al total de la guía.'
}

function cambiarTipoLinea(index: number, tipo: TipoLineaGuia) {
  const linea = lineas[index]
  if (!linea || linea.tipo === tipo) return
  linea.tipo = tipo
  linea.idBalon = ''
  linea.balonLabel = null
  linea.idProducto = ''
  linea.productoLabel = null
  linea.glosa = ''
  linea.descripcion = undefined
  linea.idUnidadMedida = undefined
  linea.pesoKg = ''
  if (tipo === 'cilindro') linea.cantidad = 1
  if (!pesoBultosManual.value) aplicarPesoBultosDesdeItems()
}

function inferTipoLinea(detalle: {
  id_balon?: number | null
  id_producto?: number | null
}): TipoLineaGuia {
  if (detalle.id_balon) return 'cilindro'
  if (detalle.id_producto) return 'producto'
  return 'libre'
}

function onPesoLineaEdit(_index: number) {
  if (!pesoBultosManual.value) {
    aplicarPesoBultosDesdeItems()
  }
}

function aplicarPesoBultosDesdeItems() {
  const c = pesoBultosCalculado.value
  pesoBultosManual.value = false
  if (c.pesoBrutoKg > 0) pesoBruto.value = c.pesoBrutoKg
  if (c.numeroBultos > 0) numeroBultos.value = c.numeroBultos
}

function onPesoBultosManualEdit() {
  pesoBultosManual.value = true
}

watch(
  pesoBultosCalculado,
  (c) => {
    if (pesoBultosManual.value || isEdit.value) return
    if (c.pesoBrutoKg > 0) pesoBruto.value = c.pesoBrutoKg
    if (c.numeroBultos > 0) numeroBultos.value = c.numeroBultos
  },
  { deep: true },
)

const idPais = ref<number | ''>('')
const idDepartamentoOrigen = ref<number | ''>('')
const idProvinciaOrigen = ref<number | ''>('')
const idDistritoOrigen = ref<number | ''>('')
const idDepartamentoLlegada = ref<number | ''>('')
const idProvinciaLlegada = ref<number | ''>('')
const idDistritoLlegada = ref<number | ''>('')

const paisesQuery = usePaisesQuery()
const departamentosQuery = useDepartamentosQuery(idPais)
const provinciasOrigenQuery = useProvinciasQuery(idDepartamentoOrigen)
const distritosOrigenQuery = useDistritosQuery(idProvinciaOrigen)
const provinciasLlegadaQuery = useProvinciasQuery(idDepartamentoLlegada)
const distritosLlegadaQuery = useDistritosQuery(idProvinciaLlegada)

const departamentosOptions = computed(() => toSelectOptions(departamentosQuery.data.value))
const provinciasOrigenOptions = computed(() =>
  withFallbackOption(toSelectOptions(provinciasOrigenQuery.data.value), origenProvinciaFallback.value),
)
const distritosOrigenOptions = computed(() =>
  withFallbackOption(toSelectOptions(distritosOrigenQuery.data.value), origenDistritoFallback.value),
)
const provinciasLlegadaOptions = computed(() =>
  withFallbackOption(toSelectOptions(provinciasLlegadaQuery.data.value), llegadaProvinciaFallback.value),
)
const distritosLlegadaOptions = computed(() =>
  withFallbackOption(toSelectOptions(distritosLlegadaQuery.data.value), llegadaDistritoFallback.value),
)
const direccionLlegadaOptions = computed(() =>
  direccionesDestinatario.value.map((d) => ({
    value: d.id,
    label: `${d.direccion}${d.nombre_distrito ? ` · ${d.nombre_distrito}` : ''}${
      d.es_principal ? ' (principal)' : ''
    }`,
  })),
)
const direccionOrigenOptions = computed(() =>
  direccionesRemitente.value.map((d) => ({
    value: d.id,
    label: `${d.direccion}${d.nombre_distrito ? ` · ${d.nombre_distrito}` : ''}${
      d.es_principal ? ' (principal)' : ''
    }`,
  })),
)

const tipoGuiaOptions = computed(() =>
  (catalogosQuery.data.value?.tiposGuia ?? []).map((t) => ({
    value: t.id,
    label: `${(t.nombre ?? '').replace(/_/g, ' ')} (${t.descripcion ?? ''})`,
    codigo: t.descripcion ?? '',
  })),
)
const motivoOptions = computed(() =>
  (catalogosQuery.data.value?.motivosTraslado ?? []).map((t) => ({
    value: t.id,
    label: `${(t.nombre ?? '').replace(/_/g, ' ')} (${t.descripcion ?? ''})`,
  })),
)
const modalidadOptions = computed(() =>
  (catalogosQuery.data.value?.modalidadesTraslado ?? []).map((t) => ({
    value: t.id,
    label: `${(t.nombre ?? '').replace(/_/g, ' ')} (${t.descripcion ?? ''})`,
    codigo: t.descripcion ?? '',
  })),
)
const unidadPesoOptions = computed(() => {
  const units = catalogosQuery.data.value?.unidadesMedida ?? []
  // SUNAT GRE exige código KGM; KG y KGM se mapean igual al XML, no mostrar ambos.
  const kgm = units.find((u) => (u.nombre ?? '').toUpperCase() === 'KGM')
  if (kgm) return toSelectOptions([kgm])
  const kg = units.find(
    (u) =>
      (u.nombre ?? '').toUpperCase() === 'KG' ||
      (u.descripcion ?? '').toUpperCase().includes('KILO'),
  )
  return kg ? toSelectOptions([kg]) : []
})
const sucursalOptions = computed(() =>
  (sucursalesQuery.data.value?.data ?? []).map((s) => ({ value: s.id, label: s.nombre })),
)
const almacenOptions = computed(() =>
  (almacenesQuery.data.value?.data ?? []).map((a) => ({ value: a.id, label: a.nombre })),
)

const { defineField, handleSubmit, resetForm, errors, setValues, values } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idTipoGuiaRemision: yup.number().required('Tipo obligatorio'),
      serie: yup.string().required('Serie obligatoria').max(10),
      fecha: yup.string().required('Fecha obligatoria'),
      fechaTraslado: yup.string().required('Fecha de traslado obligatoria'),
      idMotivoTraslado: yup.number().required('Motivo obligatorio'),
      idModalidadTraslado: yup.number().required('Modalidad obligatoria'),
      idUnidadMedida: yup.number().optional().nullable(),
      idSucursal: yup.number().required('Sucursal obligatoria'),
      idAlmacen: yup.number().required('Almacén obligatorio'),
      pesoBruto: yup.number().typeError('Peso inválido').min(0.01, 'Peso > 0').required(),
      numeroBultos: yup.number().optional().nullable(),
      idDestinatario: yup.number().optional().nullable(),
      direccionOrigen: yup.string().required('Dirección origen obligatoria'),
      direccionLlegada: yup.string().required('Dirección llegada obligatoria'),
      idChofer: yup.number().optional().nullable(),
      idVehiculo: yup.number().optional().nullable(),
      idTransportista: yup.number().optional().nullable(),
      observaciones: yup.string().optional().nullable(),
    }),
  ),
  initialValues: {
    idTipoGuiaRemision: undefined as number | undefined,
    serie: 'T001',
    fecha: new Date().toISOString().slice(0, 10),
    fechaTraslado: new Date().toISOString().slice(0, 10),
    idMotivoTraslado: undefined as number | undefined,
    idModalidadTraslado: undefined as number | undefined,
    idUnidadMedida: undefined as number | undefined,
    idSucursal: undefined as number | undefined,
    idAlmacen: undefined as number | undefined,
    pesoBruto: undefined as number | undefined,
    numeroBultos: undefined as number | undefined,
    idDestinatario: undefined as number | undefined,
    direccionOrigen: '',
    direccionLlegada: '',
    idChofer: undefined as number | undefined,
    idVehiculo: undefined as number | undefined,
    idTransportista: undefined as number | undefined,
    observaciones: '',
  },
})

const [idTipoGuiaRemision] = defineField('idTipoGuiaRemision')
const [serie] = defineField('serie')
const [fecha] = defineField('fecha')
const [fechaTraslado] = defineField('fechaTraslado')
const [idMotivoTraslado] = defineField('idMotivoTraslado')
const [idModalidadTraslado] = defineField('idModalidadTraslado')
const [idUnidadMedida] = defineField('idUnidadMedida')
const [idSucursal] = defineField('idSucursal')
const [idAlmacen] = defineField('idAlmacen')
const [pesoBruto] = defineField('pesoBruto')
const [numeroBultos] = defineField('numeroBultos')
const [idDestinatario] = defineField('idDestinatario')
const [direccionOrigen] = defineField('direccionOrigen')
const [direccionLlegada] = defineField('direccionLlegada')
const [idChofer] = defineField('idChofer')
const [idVehiculo] = defineField('idVehiculo')
const [idTransportista] = defineField('idTransportista')
const [observaciones] = defineField('observaciones')

const sucursalSeleccionada = computed(() => {
  const id = idSucursal.value
  if (!id) return null
  return (sucursalesQuery.data.value?.data ?? []).find((s) => s.id === Number(id)) ?? null
})
const sucursalSeleccionadaNombre = computed(() => sucursalSeleccionada.value?.nombre?.trim() || '')

const numero = ref('')
const saving = computed(
  () => createMutation.isPending.value || updateMutation.isPending.value,
)

const codigoModalidad = computed(() => {
  const opt = modalidadOptions.value.find((o) => o.value === values.idModalidadTraslado)
  return opt?.codigo ?? ''
})
const esPrivado = computed(() => codigoModalidad.value === '02' || !codigoModalidad.value)
const codigoTipoGuia = computed(() => {
  const opt = tipoGuiaOptions.value.find((t) => t.value === values.idTipoGuiaRemision)
  return opt?.codigo ?? ''
})
const esTipo31 = computed(() => codigoTipoGuia.value === '31')

watch(
  paisesQuery.data,
  (paises) => {
    if (!idPais.value && paises?.length) {
      idPais.value = paises[0].id
    }
  },
  { immediate: true },
)

watch(idDepartamentoOrigen, () => {
  if (ubigeoSuppressDepth.value > 0) return
  origenProvinciaFallback.value = null
  origenDistritoFallback.value = null
  idProvinciaOrigen.value = ''
  idDistritoOrigen.value = ''
})
watch(idProvinciaOrigen, () => {
  if (ubigeoSuppressDepth.value > 0) return
  origenDistritoFallback.value = null
  idDistritoOrigen.value = ''
})
watch(idDepartamentoLlegada, () => {
  if (ubigeoSuppressDepth.value > 0) return
  llegadaProvinciaFallback.value = null
  llegadaDistritoFallback.value = null
  idProvinciaLlegada.value = ''
  idDistritoLlegada.value = ''
})
watch(idProvinciaLlegada, () => {
  if (ubigeoSuppressDepth.value > 0) return
  llegadaDistritoFallback.value = null
  idDistritoLlegada.value = ''
})

watch(idTipoGuiaRemision, (id) => {
  if (isEdit.value) return
  const tipo = tipoGuiaOptions.value.find((t) => t.value === id)
  if (!tipo) return
  if (tipo.codigo === '09' && !String(serie.value ?? '').toUpperCase().startsWith('T')) {
    serie.value = 'T001'
  }
  if (tipo.codigo === '31' && !String(serie.value ?? '').toUpperCase().startsWith('V')) {
    serie.value = 'V001'
  }
  if (tipo.codigo !== '31') {
    idRemitente.value = ''
    remitenteLabel.value = null
    remitenteError.value = ''
    modoRemitente.value = 'cliente'
    remitenteNombreLibre.value = ''
    remitenteDocumentoLibre.value = ''
    remitenteLibreErrorNombre.value = ''
    remitenteLibreErrorDocumento.value = ''
  }
})

watch(
  () => [serie.value, isEdit.value] as const,
  async ([s, edit]) => {
    if (edit || !s?.trim()) {
      if (!edit) numero.value = ''
      return
    }
    try {
      const result = await guiasRemisionService.obtenerSiguienteNumero(String(s).trim())
      numero.value = result.numero
    } catch {
      numero.value = ''
    }
  },
)

function applyCatalogDefaults() {
  const cats = catalogosQuery.data.value
  if (!cats || isEdit.value) return

  if (!values.idTipoGuiaRemision) {
    const rem = cats.tiposGuia.find((t) => t.descripcion === '09')
    if (rem) idTipoGuiaRemision.value = rem.id
  }
  if (!values.idModalidadTraslado) {
    const priv = cats.modalidadesTraslado.find((t) => t.descripcion === '02')
    if (priv) idModalidadTraslado.value = priv.id
  }
  if (!values.idMotivoTraslado) {
    const motivoPreferido = origenRecargaPlanta.value
      ? cats.motivosTraslado.find((t) => t.descripcion === '13' || t.nombre === 'OTROS')
      : cats.motivosTraslado.find((t) => t.descripcion === '01')
    if (motivoPreferido) idMotivoTraslado.value = motivoPreferido.id
  }
  if (
    origenRecargaPlanta.value &&
    !String(values.observaciones ?? '').trim()
  ) {
    observaciones.value =
      'Salida de cilindros vacíos EMPRESA a planta externa para recarga'
  }
  if (!values.idUnidadMedida) {
    const units = cats.unidadesMedida
    const kgm =
      units.find((u) => (u.nombre ?? '').toUpperCase() === 'KGM') ??
      units.find((u) => (u.nombre ?? '').toUpperCase() === 'KG') ??
      units.find((u) => (u.descripcion ?? '').toUpperCase().includes('KILO'))
    if (kgm) idUnidadMedida.value = kgm.id
  }
}

function applySucursalAlmacenDefaults() {
  if (isEdit.value) return

  const sucursales = sucursalesQuery.data.value?.data ?? []
  if (!values.idSucursal && sucursales.length) {
    idSucursal.value = sucursales[0].id
  }

  const almacenes = almacenesQuery.data.value?.data ?? []
  if (!values.idAlmacen && almacenes.length) {
    const principal = almacenes.find((a) =>
      (a.nombre ?? '').toLowerCase().includes('principal'),
    )
    idAlmacen.value = principal?.id ?? almacenes[0].id
  }
}

watch(
  () => catalogosQuery.data.value,
  () => applyCatalogDefaults(),
  { immediate: true },
)

watch(
  () => [sucursalesQuery.data.value?.data, almacenesQuery.data.value?.data, isEdit.value] as const,
  () => {
    if (!isEdit.value) applySucursalAlmacenDefaults()
  },
  { immediate: true },
)

watch(idSucursal, async (id, prev) => {
  almacenesFilters.value = {
    pagina: 1,
    limite: 100,
    idSucursal: id ? Number(id) : undefined,
  }

  if (ubigeoSuppressDepth.value > 0 || isEdit.value) return
  if (!id) return

  if (prev != null && id !== prev) {
    idAlmacen.value = undefined
  }

  // GRE 31 con remitente: no pisar su dirección al cambiar sucursal.
  if (esTipo31.value && modoRemitente.value === 'cliente' && idRemitente.value) {
    await nextTick()
    applySucursalAlmacenDefaults()
    return
  }

  const sucursal = (sucursalesQuery.data.value?.data ?? []).find((s) => s.id === Number(id))
  if (sucursal) {
    await applyOrigenDesdeSucursal(sucursal)
  }

  await nextTick()
  applySucursalAlmacenDefaults()
})

watch(idDestinatario, async (id, prev) => {
  if (suppressDestinatarioReset.value) return
  if (id === prev) return

  if (!isEdit.value || prev != null) {
    idChofer.value = undefined
    idVehiculo.value = undefined
    choferLabel.value = null
    vehiculoLabel.value = null
    idDireccionLlegada.value = ''
    direccionLlegada.value = ''
    llegadaProvinciaFallback.value = null
    llegadaDistritoFallback.value = null
    beginUbigeoSuppress()
    idDepartamentoLlegada.value = ''
    idProvinciaLlegada.value = ''
    idDistritoLlegada.value = ''
    endUbigeoSuppress()
  }

  direccionesDestinatario.value = []
  direccionLlegadaSelectError.value = ''
  llegadaHint.value = ''
  clienteUbicacionCache.value = null

  if (!id) {
    destinatarioLabel.value = null
    return
  }

  await loadDireccionesDestinatario(Number(id))
})

watch(idDireccionLlegada, async (id) => {
  if (!id || applyingDireccionLlegada.value) return
  const dir = direccionesDestinatario.value.find((d) => d.id === Number(id))
  if (!dir) return
  await applyDireccionLlegada(dir)
})

watch(idRemitente, async (id, prev) => {
  if (id) remitenteError.value = ''
  if (suppressRemitenteReset.value) return
  if (id === prev) return

  if (!id) {
    direccionesRemitente.value = []
    idDireccionOrigen.value = ''
    remitenteLabel.value = null
    remitenteUbicacionCache.value = null
    return
  }

  await loadDireccionesRemitente(Number(id), { aplicarOrigen: true })
})

watch(idDireccionOrigen, async (id) => {
  if (suppressRemitenteReset.value) return
  if (!id || applyingDireccionOrigen.value) return
  const dir = direccionesRemitente.value.find((d) => d.id === Number(id))
  if (!dir) return
  await applyDireccionOrigen(dir)
})

watch(idDistritoOrigen, () => {
  distritoOrigenError.value = ''
})
watch(idDistritoLlegada, () => {
  distritoLlegadaError.value = ''
})

async function applyOrigenDesdeSucursal(sucursal: {
  direccion?: string | null
  id_departamento?: number | null
  id_provincia?: number | null
  id_distrito?: number | null
  nombre_departamento?: string | null
  nombre_provincia?: string | null
  nombre_distrito?: string | null
}) {
  beginUbigeoSuppress()
  try {
    if (sucursal.direccion?.trim()) {
      direccionOrigen.value = sucursal.direccion.trim()
    }
    origenProvinciaFallback.value =
      sucursal.id_provincia && sucursal.nombre_provincia
        ? { value: sucursal.id_provincia, label: sucursal.nombre_provincia }
        : null
    origenDistritoFallback.value =
      sucursal.id_distrito && sucursal.nombre_distrito
        ? { value: sucursal.id_distrito, label: sucursal.nombre_distrito }
        : null

    idDepartamentoOrigen.value = sucursal.id_departamento ?? ''
    await nextTick()
    await waitForSelectOption(
      () => toSelectOptions(provinciasOrigenQuery.data.value),
      sucursal.id_provincia,
    )
    idProvinciaOrigen.value = sucursal.id_provincia ?? ''
    await nextTick()
    await waitForSelectOption(
      () => toSelectOptions(distritosOrigenQuery.data.value),
      sucursal.id_distrito,
    )
    idDistritoOrigen.value = sucursal.id_distrito ?? ''
    await nextTick()

    origenHint.value = sucursal.id_distrito
      ? ''
      : 'La sucursal no tiene ubigeo configurado. Complétalo aquí o edita la sucursal en Configuración.'
  } finally {
    endUbigeoSuppress()
  }
}

async function usarDireccionSucursal() {
  const id = idSucursal.value
  if (!id) return
  const sucursal = (sucursalesQuery.data.value?.data ?? []).find((s) => s.id === Number(id))
  if (!sucursal) {
    toastWarning('No se encontró la sucursal seleccionada')
    return
  }

  aplicandoOrigenSucursal.value = true
  try {
    idDireccionOrigen.value = ''
    await applyOrigenDesdeSucursal(sucursal)
    toastSuccess('Dirección de la sucursal aplicada. Puedes ajustarla si es necesario.')
  } finally {
    aplicandoOrigenSucursal.value = false
  }
}

async function loadDireccionesRemitente(
  idCliente: number,
  opts?: { aplicarOrigen?: boolean },
) {
  const aplicar = opts?.aplicarOrigen !== false
  cargandoDireccionesOrigen.value = true
  if (aplicar) origenHint.value = ''
  try {
    const [response, cliente] = await Promise.all([
      direccionesService.listar({
        idCliente,
        pagina: 1,
        limite: 100,
        soloActivos: 1,
      }),
      clientesService.obtenerPorId(idCliente).catch(() => null),
    ])
    direccionesRemitente.value = response.data
    remitenteUbicacionCache.value = cliente

    if (!aplicar) {
      const actual = (direccionOrigen.value ?? '').trim().toLowerCase()
      const match = actual
        ? response.data.find((d) => d.direccion.trim().toLowerCase() === actual)
        : response.data.find((d) => d.es_principal) ?? response.data[0]
      if (match) idDireccionOrigen.value = match.id
      return
    }

    const principal = response.data.find((d) => d.es_principal) ?? response.data[0]
    if (principal) {
      if (Number(idDireccionOrigen.value) === principal.id) {
        await applyDireccionOrigen(principal)
      } else {
        idDireccionOrigen.value = principal.id
      }
      origenHint.value = ''
      return
    }

    idDireccionOrigen.value = ''
    if (cliente && (cliente.direccion?.trim() || cliente.id_distrito || cliente.id_departamento)) {
      await applyOrigenDesdeCliente(cliente)
      origenHint.value =
        'Sin direcciones registradas: se usó la ubicación del remitente. Puedes editarla, usar la sucursal o registrar una con +.'
    } else {
      origenHint.value =
        'El remitente no tiene dirección. Completa el origen, usa la sucursal o regístrala con +.'
    }
  } catch {
    direccionesRemitente.value = []
    if (aplicar) {
      origenHint.value =
        'No se pudieron cargar las direcciones del remitente. Completa el origen o usa la sucursal.'
    }
  } finally {
    cargandoDireccionesOrigen.value = false
  }
}

function resolverTextoDireccionRemitente(cliente: Cliente): string {
  const delCliente = (cliente.direccion ?? '').trim() || (cliente.referencia ?? '').trim()
  if (delCliente) return delCliente

  const actual = (direccionOrigen.value ?? '').trim()
  if (actual) return actual

  const seleccionada = idDireccionOrigen.value
    ? direccionesRemitente.value.find((d) => d.id === Number(idDireccionOrigen.value))
    : null
  const deSeleccion = (seleccionada?.direccion ?? '').trim()
  if (deSeleccion) return deSeleccion

  return [cliente.nombre_distrito, cliente.nombre_provincia, cliente.nombre_departamento]
    .filter(Boolean)
    .join(', ')
}

async function applyOrigenDesdeCliente(cliente: Cliente) {
  const dir = clienteToDireccionLike(cliente)
  dir.direccion = resolverTextoDireccionRemitente(cliente)
  if (!dir.direccion && !dir.id_distrito && !dir.id_departamento) return
  await applyDireccionOrigen(dir)
}

async function usarUbicacionRemitente() {
  let cliente = remitenteUbicacionCache.value
  const idCliente = idRemitente.value ? Number(idRemitente.value) : null
  if (!cliente && !idCliente) return

  aplicandoOrigenRemitente.value = true
  try {
    if (!cliente && idCliente) {
      cliente = await clientesService.obtenerPorId(idCliente)
      remitenteUbicacionCache.value = cliente
    }
    if (!cliente) return
    await applyOrigenDesdeCliente(cliente)
    toastSuccess('Ubicación del remitente aplicada. Puedes ajustarla si es necesario.')
  } finally {
    aplicandoOrigenRemitente.value = false
  }
}

async function onDireccionRemitenteCreada() {
  const id = idRemitente.value
  if (!id) return
  await loadDireccionesRemitente(Number(id), { aplicarOrigen: true })
}

async function applyDireccionOrigen(dir: Direccion) {
  if (applyingDireccionOrigen.value) return
  applyingDireccionOrigen.value = true
  beginUbigeoSuppress()
  try {
    if (dir.direccion?.trim()) direccionOrigen.value = dir.direccion.trim()
    if (dir.id_pais) idPais.value = dir.id_pais

    origenProvinciaFallback.value =
      dir.id_provincia && dir.nombre_provincia
        ? { value: dir.id_provincia, label: dir.nombre_provincia }
        : null
    origenDistritoFallback.value =
      dir.id_distrito && dir.nombre_distrito
        ? { value: dir.id_distrito, label: dir.nombre_distrito }
        : null

    idDepartamentoOrigen.value = dir.id_departamento ?? ''
    await nextTick()
    await waitForSelectOption(
      () => toSelectOptions(provinciasOrigenQuery.data.value),
      dir.id_provincia,
    )
    idProvinciaOrigen.value = dir.id_provincia ?? ''
    await nextTick()
    await waitForSelectOption(
      () => toSelectOptions(distritosOrigenQuery.data.value),
      dir.id_distrito,
    )
    idDistritoOrigen.value = dir.id_distrito ?? ''
    await nextTick()

    origenHint.value = dir.id_distrito
      ? ''
      : 'El remitente no tiene ubigeo completo. Completa departamento, provincia y distrito.'
  } finally {
    endUbigeoSuppress()
    applyingDireccionOrigen.value = false
  }
}

async function loadDireccionesDestinatario(idCliente: number) {
  cargandoDirecciones.value = true
  llegadaHint.value = ''
  direccionLlegadaSelectError.value = ''
  try {
    const [response, cliente] = await Promise.all([
      direccionesService.listar({
        idCliente,
        pagina: 1,
        limite: 100,
        soloActivos: 1,
      }),
      clientesService.obtenerPorId(idCliente).catch(() => null),
    ])
    direccionesDestinatario.value = response.data
    clienteUbicacionCache.value = cliente

    const principal = response.data.find((d) => d.es_principal) ?? response.data[0]
    if (principal) {
      // Una sola aplicación: el watch de idDireccionLlegada aplica el ubigeo.
      if (Number(idDireccionLlegada.value) === principal.id) {
        await applyDireccionLlegada(principal)
      } else {
        idDireccionLlegada.value = principal.id
      }
      llegadaHint.value = ''
      return
    }

    // Sin direcciones en ficha: intentar ubicación del cliente; si no, ingreso manual.
    idDireccionLlegada.value = ''
    if (cliente && (cliente.direccion?.trim() || cliente.id_distrito || cliente.id_departamento)) {
      await applyUbicacionDesdeCliente(cliente)
      llegadaHint.value =
        'Sin direcciones registradas: se usó la ubicación del cliente. Puedes editarla o registrar una nueva con +.'
    } else {
      llegadaHint.value =
        'Sin direcciones registradas. Completa dirección y ubigeo manualmente, o regístrala con +.'
    }
  } catch {
    direccionesDestinatario.value = []
    llegadaHint.value =
      'No se pudieron cargar las direcciones. Completa dirección y ubigeo manualmente.'
  } finally {
    cargandoDirecciones.value = false
  }
}

function clienteToDireccionLike(cliente: Cliente): Direccion {
  return {
    id: 0,
    id_cliente: cliente.id,
    direccion: (cliente.direccion ?? '').trim() || (cliente.referencia ?? '').trim() || '',
    referencia: cliente.referencia ?? null,
    id_pais: cliente.id_pais ?? null,
    nombre_pais: cliente.nombre_pais ?? null,
    id_departamento: cliente.id_departamento ?? null,
    nombre_departamento: cliente.nombre_departamento ?? null,
    id_provincia: cliente.id_provincia ?? null,
    nombre_provincia: cliente.nombre_provincia ?? null,
    id_distrito: cliente.id_distrito ?? null,
    nombre_distrito: cliente.nombre_distrito ?? null,
    latitud: cliente.latitud ?? null,
    longitud: cliente.longitud ?? null,
    es_principal: false,
    estado: 1,
    fecha_creacion: cliente.fecha_creacion,
    fecha_modificacion: cliente.fecha_modificacion,
  }
}

function resolverTextoDireccionCliente(cliente: Cliente): string {
  const delCliente = (cliente.direccion ?? '').trim() || (cliente.referencia ?? '').trim()
  if (delCliente) return delCliente

  const actual = (direccionLlegada.value ?? '').trim()
  if (actual) return actual

  const seleccionada = idDireccionLlegada.value
    ? direccionesDestinatario.value.find((d) => d.id === Number(idDireccionLlegada.value))
    : null
  const deSeleccion = (seleccionada?.direccion ?? '').trim()
  if (deSeleccion) return deSeleccion

  return [cliente.nombre_distrito, cliente.nombre_provincia, cliente.nombre_departamento]
    .filter(Boolean)
    .join(', ')
}

async function applyUbicacionDesdeCliente(cliente: Cliente) {
  const dir = clienteToDireccionLike(cliente)
  dir.direccion = resolverTextoDireccionCliente(cliente)
  if (!dir.direccion && !dir.id_distrito && !dir.id_departamento) return
  await applyDireccionLlegada(dir)
}

async function usarUbicacionCliente() {
  let cliente = clienteUbicacionCache.value
  const idCliente = idDestinatario.value ? Number(idDestinatario.value) : null
  if (!cliente && !idCliente) return

  aplicandoUbicacionCliente.value = true
  try {
    if (!cliente && idCliente) {
      cliente = await clientesService.obtenerPorId(idCliente)
      clienteUbicacionCache.value = cliente
    }
    if (!cliente) return

    // Conservar la dirección seleccionada en el combo; solo refresca texto/ubigeo.
    await applyUbicacionDesdeCliente(cliente)
    toastSuccess('Ubicación del cliente aplicada. Puedes ajustarla si es necesario.')
  } finally {
    aplicandoUbicacionCliente.value = false
  }
}

async function onDireccionDestinatarioCreada() {
  const id = idDestinatario.value
  if (!id) return
  await loadDireccionesDestinatario(Number(id))
}

async function applyDireccionLlegada(dir: Direccion) {
  if (applyingDireccionLlegada.value) return
  applyingDireccionLlegada.value = true
  beginUbigeoSuppress()
  try {
    direccionLlegada.value = dir.direccion
    if (dir.id_pais) idPais.value = dir.id_pais

    llegadaProvinciaFallback.value =
      dir.id_provincia && dir.nombre_provincia
        ? { value: dir.id_provincia, label: dir.nombre_provincia }
        : null
    llegadaDistritoFallback.value =
      dir.id_distrito && dir.nombre_distrito
        ? { value: dir.id_distrito, label: dir.nombre_distrito }
        : null

    idDepartamentoLlegada.value = dir.id_departamento ?? ''
    await nextTick()
    await waitForSelectOption(
      () => toSelectOptions(provinciasLlegadaQuery.data.value),
      dir.id_provincia,
    )
    idProvinciaLlegada.value = dir.id_provincia ?? ''
    await nextTick()
    await waitForSelectOption(
      () => toSelectOptions(distritosLlegadaQuery.data.value),
      dir.id_distrito,
    )
    idDistritoLlegada.value = dir.id_distrito ?? ''
    await nextTick()
    direccionLlegadaSelectError.value = ''
  } finally {
    endUbigeoSuppress()
    applyingDireccionLlegada.value = false
  }
}

async function searchClientes(query: string): Promise<SelectOption[]> {
  const response = await clientesService.listar({
    buscar: query || undefined,
    pagina: 1,
    limite: 20,
    soloActivos: 1,
  })
  return response.data.map((c) => ({
    value: c.id,
    label: getClienteOptionLabel(c),
  }))
}

function onAlmacenCreated(almacen: Almacen) {
  idAlmacen.value = almacen.id
  void almacenesQuery.refetch()
}

function abrirClienteModal(target: ClienteModalTarget) {
  clienteModalTarget.value = target
  clienteModalOpen.value = true
}

function onClienteCreado(cliente: Cliente) {
  const label = getClienteOptionLabel(cliente)
  if (clienteModalTarget.value === 'remitente') {
    idRemitente.value = cliente.id
    remitenteLabel.value = label
    remitenteError.value = ''
  } else {
    idDestinatario.value = cliente.id
    destinatarioLabel.value = label
  }
  clienteModalOpen.value = false
}

function onTransportistaCreado(cliente: Cliente) {
  idTransportista.value = cliente.id
  transportistaLabel.value = getClienteOptionLabel(cliente)
  transportistaModalOpen.value = false
}

function onChoferCreado(chofer?: Chofer) {
  if (!chofer) return
  idChofer.value = chofer.id
  choferLabel.value = mapChoferOption(chofer).label
  choferModalOpen.value = false
}

function onVehiculoCreado(vehiculo?: Vehiculo) {
  if (!vehiculo) return
  idVehiculo.value = vehiculo.id
  const scope = vehiculo.id_cliente == null ? 'Flota propia' : 'Cliente'
  vehiculoLabel.value = `${vehiculo.placa || `Vehículo ${vehiculo.id}`} (${scope})`
  vehiculoModalOpen.value = false
}

function mapChoferOption(c: {
  id: number
  nombres: string
  apellido_paterno?: string | null
  apellido_materno?: string | null
  numero_documento?: string | null
  id_cliente?: number | null
}): SelectOption {
  const nombre =
    [c.nombres, c.apellido_paterno, c.apellido_materno].filter(Boolean).join(' ') ||
    c.numero_documento ||
    `Chofer ${c.id}`
  const scope = c.id_cliente == null ? 'Flota propia' : 'Cliente'
  return {
    value: c.id,
    label: `${nombre}${c.numero_documento ? ` · ${c.numero_documento}` : ''} (${scope})`,
  }
}

async function searchChoferes(query: string): Promise<SelectOption[]> {
  const idDest = values.idDestinatario
  const generales = await choferesService.listar({
    buscar: query || undefined,
    pagina: 1,
    limite: 50,
    isActivos: 1,
  })

  let delCliente: typeof generales.data = []
  if (idDest) {
    const response = await choferesService.listar({
      buscar: query || undefined,
      pagina: 1,
      limite: 20,
      isActivos: 1,
      idCliente: Number(idDest),
    })
    delCliente = response.data
  }

  const flotaPropia = generales.data.filter((c) => c.id_cliente == null)
  const map = new Map<number, SelectOption>()
  for (const c of [...delCliente, ...flotaPropia]) {
    map.set(c.id, mapChoferOption(c))
  }
  return [...map.values()]
}

async function searchVehiculos(query: string): Promise<SelectOption[]> {
  const idDest = values.idDestinatario
  const generales = await vehiculosService.listar({
    buscar: query || undefined,
    pagina: 1,
    limite: 50,
  })

  let delCliente: typeof generales.data = []
  if (idDest) {
    const response = await vehiculosService.listar({
      buscar: query || undefined,
      pagina: 1,
      limite: 20,
      idCliente: Number(idDest),
    })
    delCliente = response.data
  }

  const flotaPropia = generales.data.filter((v) => v.id_cliente == null)
  const map = new Map<number, SelectOption>()
  for (const v of [...delCliente, ...flotaPropia]) {
    const scope = v.id_cliente == null ? 'Flota propia' : 'Cliente'
    map.set(v.id, {
      value: v.id,
      label: `${v.placa || `Vehículo ${v.id}`} (${scope})`,
    })
  }
  return [...map.values()]
}

function resolveUnidadBotellasId(): number | undefined {
  const units = catalogosQuery.data.value?.unidadesMedida ?? []
  const botellas = units.find(
    (u) =>
      (u.nombre ?? '').toUpperCase() === 'BOTELLAS' ||
      (u.descripcion ?? '').toUpperCase().includes('BOTELL'),
  )
  if (botellas) return botellas.id
  const unid = units.find((u) =>
    ['UNID', 'NIU', 'UND', 'UNI'].includes((u.nombre ?? '').toUpperCase()),
  )
  return unid?.id
}

function idsBalonesYaEnLineas(exceptIndex: number): Set<number> {
  const ids = new Set<number>()
  for (let i = 0; i < lineas.length; i++) {
    if (i === exceptIndex) continue
    const id = Number(lineas[i]?.idBalon)
    if (Number.isFinite(id) && id > 0) ids.add(id)
  }
  return ids
}

function searchBalonesForLine(index: number) {
  return async (query: string): Promise<SelectOption[]> => {
    const yaUsados = idsBalonesYaEnLineas(index)
    const response = await balonesService.listar({
      buscar: query || undefined,
      pagina: 1,
      limite: 30,
      soloBajas: false,
      ...(origenRecargaPlanta.value
        ? {
            idPropietario: idPropietarioEmpresa.value,
            idEstadoContenido: idContenidoVacio.value,
          }
        : {}),
    })
    return response.data
      .filter((b) => !yaUsados.has(b.id))
      .slice(0, 20)
      .map((b) => {
        balonesCache.set(b.id, b)
        return balonToSelectOption(b)
      })
  }
}

function productoToSelectOption(p: Producto): SelectOption {
  const badges: NonNullable<SelectOption['badges']> = []
  if (p.es_gas) badges.push({ label: 'Gas', color: 'primary' })
  if (p.es_servicio) badges.push({ label: 'Servicio', color: 'neutral' })
  if (p.es_alquilable) badges.push({ label: 'Alquilable', color: 'warning' })
  if (p.nombre_categoria) badges.push({ label: p.nombre_categoria, color: 'neutral' })
  if (p.nombre_sub_categoria) badges.push({ label: p.nombre_sub_categoria, color: 'neutral' })
  if (p.nombre_unidad_medida) badges.push({ label: p.nombre_unidad_medida, color: 'neutral' })
  if (p.presentacion) badges.push({ label: p.presentacion, color: 'neutral' })
  if (p.marca) badges.push({ label: p.marca, color: 'neutral' })

  return {
    value: p.id,
    title: `${p.codigo} — ${p.nombre}`,
    label: `${p.codigo} — ${p.nombre}`,
    badges,
  }
}

function mapProductosToOptions(items: Producto[]): SelectOption[] {
  return items.map((p) => {
    productosCache.set(p.id, {
      idUnidadMedida: p.id_unidad_medida,
      nombre: p.nombre,
      codigo: p.codigo,
    })
    return productoToSelectOption(p)
  })
}

/** Mercadería física: no gases (van en Cilindro) ni servicios. */
async function searchProductosCatalogo(query: string): Promise<SelectOption[]> {
  const response = await productosService.listar({
    buscar: query || undefined,
    pagina: 1,
    limite: 30,
    esGas: false,
    esServicio: false,
    soloActivos: 1,
  })
  return mapProductosToOptions(
    filtrarProductosCatalogo(response.data).filter((p) => !p.es_gas && !p.es_servicio),
  ).slice(0, 20)
}

/** Solo gases: fallback si el cilindro no tiene producto_gas asociado. */
async function searchProductosGas(query: string): Promise<SelectOption[]> {
  const response = await productosService.listar({
    buscar: query || undefined,
    pagina: 1,
    limite: 20,
    esGas: true,
    soloActivos: 1,
  })
  return mapProductosToOptions(response.data)
}

function onBalonSelected(index: number, value: number | string | null | undefined) {
  const linea = lineas[index]
  if (!linea) return

  if (value == null || value === '') {
    linea.idBalon = ''
    linea.balonLabel = null
    linea.glosa = ''
    linea.pesoKg = ''
    if (!pesoBultosManual.value) aplicarPesoBultosDesdeItems()
    return
  }

  const id = Number(value)
  const balon = balonesCache.get(id)
  if (!balon) {
    linea.idBalon = id
    return
  }

  const duplicado = lineas.some((l, i) => i !== index && Number(l.idBalon) === id)
  if (duplicado) {
    toastWarning(`El cilindro ${balon.codigo_balon} ya está en otra línea`)
    linea.idBalon = ''
    linea.balonLabel = null
    return
  }

  linea.idBalon = id
  linea.balonLabel = balonToSelectOption(balon).title ?? labelBalonGuia(balon)
  linea.cantidad = 1
  linea.glosa = buildGuiaDetalleGlosa(balon)
  linea.descripcion = linea.glosa
  linea.idUnidadMedida = resolveUnidadBotellasId()

  const tara = pesoCatalogoBalonKg(balon)
  if (tara != null) {
    linea.pesoKg = tara
  } else {
    linea.pesoKg = ''
    toastWarning(
      `El cilindro ${balon.codigo_balon} no tiene tara en catálogo. Ingresa su peso en kg.`,
    )
  }

  if (balon.id_producto_gas) {
    linea.idProducto = balon.id_producto_gas
    linea.productoLabel = balon.nombre_producto_gas
      ? `${balon.nombre_producto_gas}`
      : `Producto #${balon.id_producto_gas}`
    if (!productosCache.has(balon.id_producto_gas) && balon.nombre_producto_gas) {
      productosCache.set(balon.id_producto_gas, {
        nombre: balon.nombre_producto_gas,
        codigo: balon.codigo_balon,
        idUnidadMedida: linea.idUnidadMedida,
      })
    }
  } else {
    toastWarning(
      `El cilindro ${balon.codigo_balon} no tiene gas/producto asociado; selecciónalo manualmente`,
    )
  }

  if (!pesoBultosManual.value) aplicarPesoBultosDesdeItems()
}

function onProductoSelected(index: number, value: number | string | null | undefined) {
  const linea = lineas[index]
  if (!linea) return
  if (value == null || value === '') {
    linea.idProducto = ''
    linea.productoLabel = null
    if (!linea.idBalon) {
      linea.idUnidadMedida = undefined
      linea.descripcion = undefined
      linea.glosa = ''
    }
    return
  }
  const id = Number(value)
  const cached = productosCache.get(id)
  linea.idProducto = id
  linea.productoLabel = cached ? `${cached.codigo} — ${cached.nombre}` : null
  if (!linea.idBalon) {
    linea.idUnidadMedida = cached?.idUnidadMedida
    linea.descripcion = cached?.nombre
    linea.glosa = cached?.nombre
    if (!linea.pesoKg) {
      toastWarning('Ingresa el peso en kg de este producto para acumularlo en la guía.')
    }
  } else if (!linea.glosa && cached?.nombre) {
    linea.descripcion = linea.glosa
  }
  if (!pesoBultosManual.value) aplicarPesoBultosDesdeItems()
}

function agregarLinea() {
  lineas.push(lineaVacia())
}

function quitarLinea(index: number) {
  if (lineas.length <= 1) return
  lineas.splice(index, 1)
  if (!pesoBultosManual.value) aplicarPesoBultosDesdeItems()
}

function resetLocal() {
  resetForm()
  destinatarioLabel.value = null
  remitenteLabel.value = null
  modoDestinatario.value = 'cliente'
  destinatarioNombreLibre.value = ''
  destinatarioDocumentoLibre.value = ''
  destinatarioLibreError.value = ''
  destinatarioLibreErrorNombre.value = ''
  destinatarioLibreErrorDocumento.value = ''
  modoRemitente.value = 'cliente'
  remitenteNombreLibre.value = ''
  remitenteDocumentoLibre.value = ''
  remitenteLibreErrorNombre.value = ''
  remitenteLibreErrorDocumento.value = ''
  idRemitente.value = ''
  remitenteError.value = ''
  choferLabel.value = null
  vehiculoLabel.value = null
  transportistaLabel.value = null
  numero.value = ''
  origenProvinciaFallback.value = null
  origenDistritoFallback.value = null
  llegadaProvinciaFallback.value = null
  llegadaDistritoFallback.value = null
  beginUbigeoSuppress()
  idDepartamentoOrigen.value = ''
  idProvinciaOrigen.value = ''
  idDistritoOrigen.value = ''
  idDepartamentoLlegada.value = ''
  idProvinciaLlegada.value = ''
  idDistritoLlegada.value = ''
  endUbigeoSuppress()
  idDireccionLlegada.value = ''
  direccionesDestinatario.value = []
  idDireccionOrigen.value = ''
  direccionesRemitente.value = []
  remitenteUbicacionCache.value = null
  almacenesFilters.value = { pagina: 1, limite: 100 }
  lineas.splice(0, lineas.length, lineaVacia())
  pesoBultosManual.value = false
  detallesError.value = ''
  distritoOrigenError.value = ''
  distritoLlegadaError.value = ''
  direccionLlegadaSelectError.value = ''
  llegadaHint.value = ''
  origenHint.value = ''
  clienteUbicacionCache.value = null
}

function goBack(createdId?: number) {
  if (returnTo.value) {
    const query: Record<string, string> = {}
    if (createdId) {
      query[returnIdParam.value] = String(createdId)
    }
    void router.push({ path: returnTo.value, query })
    return
  }
  void router.push({ name: 'admin-ventas-guias-remision' })
}

function handleClose() {
  goBack()
}

async function initCreateForm() {
  resetLocal()
  await nextTick()
  applyCatalogDefaults()
  applySucursalAlmacenDefaults()
  const sucursalId = values.idSucursal
  if (sucursalId) {
    const sucursal = (sucursalesQuery.data.value?.data ?? []).find(
      (s) => s.id === Number(sucursalId),
    )
    if (sucursal) await applyOrigenDesdeSucursal(sucursal)
  }
}

onMounted(() => {
  if (!isEdit.value) {
    void initCreateForm()
  }
})

watch(
  () => [guiaQuery.data.value, guiaId.value] as const,
  async ([guia, id]) => {
    if (!id || !guia) return

    suppressDestinatarioReset.value = true
    suppressRemitenteReset.value = true
    beginUbigeoSuppress()

    try {
      setValues({
        idTipoGuiaRemision: guia.id_tipo_guia_remision,
        serie: guia.serie,
        fecha: String(guia.fecha).slice(0, 10),
        fechaTraslado: String(guia.fecha_traslado ?? guia.fecha).slice(0, 10),
        idMotivoTraslado: guia.id_motivo_traslado ?? undefined,
        idModalidadTraslado: guia.id_modalidad_traslado ?? undefined,
        idUnidadMedida: guia.id_unidad_medida ?? undefined,
        idSucursal: guia.id_sucursal,
        idAlmacen: guia.id_almacen,
        pesoBruto: Number(guia.peso_bruto ?? 1),
        numeroBultos: Number(guia.numero_bultos ?? 1),
        idDestinatario: guia.id_destinatario ?? undefined,
        direccionOrigen: guia.direccion_origen ?? '',
        direccionLlegada: guia.direccion_llegada ?? '',
        idChofer: guia.id_chofer ?? undefined,
        idVehiculo: guia.id_vehiculo ?? undefined,
        idTransportista: guia.id_transportista ?? undefined,
        observaciones: guia.observaciones ?? '',
      })
      pesoBultosManual.value = true

      numero.value = guia.numero
      if (guia.id_destinatario) {
        modoDestinatario.value = 'cliente'
        destinatarioLabel.value = guia.nombre_destinatario ?? null
        destinatarioNombreLibre.value = ''
        destinatarioDocumentoLibre.value = ''
      } else {
        modoDestinatario.value = 'libre'
        destinatarioLabel.value = null
        destinatarioNombreLibre.value = guia.nombre_destinatario ?? ''
        destinatarioDocumentoLibre.value = guia.documento_destinatario ?? ''
      }
      choferLabel.value = guia.nombre_chofer ?? null
      vehiculoLabel.value = guia.placa_vehiculo ?? null
      transportistaLabel.value = guia.nombre_transportista ?? null

      if (guia.codigo_tipo_guia === '31' && guia.id_cliente) {
        modoRemitente.value = 'cliente'
        idRemitente.value = guia.id_cliente
        remitenteLabel.value = guia.nombre_cliente ?? null
        remitenteNombreLibre.value = ''
        remitenteDocumentoLibre.value = ''
      } else if (guia.codigo_tipo_guia === '31' && (guia.nombre_cliente || guia.documento_cliente)) {
        modoRemitente.value = 'libre'
        idRemitente.value = ''
        remitenteLabel.value = null
        remitenteNombreLibre.value = guia.nombre_cliente ?? ''
        remitenteDocumentoLibre.value = guia.documento_cliente ?? ''
      } else {
        modoRemitente.value = 'cliente'
        idRemitente.value = ''
        remitenteLabel.value = null
        remitenteNombreLibre.value = ''
        remitenteDocumentoLibre.value = ''
      }

      almacenesFilters.value = {
        pagina: 1,
        limite: 100,
        idSucursal: guia.id_sucursal,
      }

      if (guia.id_pais_origen) idPais.value = guia.id_pais_origen
      else if (guia.id_pais_llegada) idPais.value = guia.id_pais_llegada

      origenDistritoFallback.value =
        guia.id_distrito_origen && guia.nombre_distrito_origen
          ? { value: guia.id_distrito_origen, label: guia.nombre_distrito_origen }
          : null
      llegadaDistritoFallback.value =
        guia.id_distrito_llegada && guia.nombre_distrito_llegada
          ? { value: guia.id_distrito_llegada, label: guia.nombre_distrito_llegada }
          : null

      idDepartamentoOrigen.value = guia.id_departamento_origen ?? ''
      await nextTick()
      await waitForSelectOption(
        () => toSelectOptions(provinciasOrigenQuery.data.value),
        guia.id_provincia_origen,
      )
      idProvinciaOrigen.value = guia.id_provincia_origen ?? ''
      await nextTick()
      await waitForSelectOption(
        () => toSelectOptions(distritosOrigenQuery.data.value),
        guia.id_distrito_origen,
      )
      idDistritoOrigen.value = guia.id_distrito_origen ?? ''

      idDepartamentoLlegada.value = guia.id_departamento_llegada ?? ''
      await nextTick()
      await waitForSelectOption(
        () => toSelectOptions(provinciasLlegadaQuery.data.value),
        guia.id_provincia_llegada,
      )
      idProvinciaLlegada.value = guia.id_provincia_llegada ?? ''
      await nextTick()
      await waitForSelectOption(
        () => toSelectOptions(distritosLlegadaQuery.data.value),
        guia.id_distrito_llegada,
      )
      idDistritoLlegada.value = guia.id_distrito_llegada ?? ''

      lineas.splice(
        0,
        lineas.length,
        ...(guia.detalles?.length
          ? guia.detalles.map((d) => {
              const idBalon = (d.id_balon ?? '') as number | ''
              const balon = idBalon ? balonesCache.get(Number(idBalon)) : undefined
              const tara = pesoCatalogoBalonKg(balon)
              const tipo = inferTipoLinea(d)
              return {
                key: crypto.randomUUID(),
                tipo,
                idBalon,
                balonLabel: d.codigo_balon
                  ? `${d.codigo_balon}${d.nombre_producto ? ` · ${d.nombre_producto}` : ''}`
                  : null,
                idProducto: (d.id_producto ?? '') as number | '',
                productoLabel: d.codigo_producto
                  ? `${d.codigo_producto} — ${d.nombre_producto ?? d.descripcion ?? ''}`
                  : (d.nombre_producto ?? d.descripcion ?? null),
                cantidad: Number(d.cantidad),
                pesoKg: (tara ?? '') as number | '',
                idUnidadMedida: d.id_unidad_medida ?? undefined,
                descripcion: d.glosa ?? d.descripcion ?? d.nombre_producto ?? undefined,
                glosa: d.glosa ?? d.descripcion ?? d.nombre_producto ?? undefined,
              }
            })
          : [lineaVacia()]),
      )

      if (guia.id_destinatario) {
        await loadDireccionesDestinatario(guia.id_destinatario)
      }
      if (guia.codigo_tipo_guia === '31' && guia.id_cliente) {
        await loadDireccionesRemitente(guia.id_cliente, { aplicarOrigen: false })
      }

      await nextTick()
    } finally {
      endUbigeoSuppress()
      suppressDestinatarioReset.value = false
      suppressRemitenteReset.value = false
    }
  },
)

const onSubmit = handleSubmit(async (formValues) => {
  const userId = authStore.user?.id
  if (!userId) return

  const tipoOpt = tipoGuiaOptions.value.find((t) => t.value === formValues.idTipoGuiaRemision)
  const es31 = tipoOpt?.codigo === '31'

  if (es31 && !validarRemitenteForm()) return

  if (!validarDestinatarioForm()) return

  if (!idDistritoOrigen.value || !idDistritoLlegada.value) {
    if (!idDistritoOrigen.value) distritoOrigenError.value = 'Selecciona distrito de origen'
    if (!idDistritoLlegada.value) distritoLlegadaError.value = 'Selecciona distrito de llegada'
    toastWarning('Completa el ubigeo de origen y destino')
    return
  }

  const modalidadCodigo = codigoModalidad.value
  if (modalidadCodigo === '02' && (!formValues.idChofer || !formValues.idVehiculo)) {
    toastWarning('Transporte privado requiere chofer y vehículo')
    return
  }
  if (modalidadCodigo === '01' && !formValues.idTransportista) {
    toastWarning('Transporte público requiere transportista')
    return
  }

  const lineasConContenido = lineas.filter((l) => lineaTieneContenido(l))
  if (lineasConContenido.length === 0) {
    detallesError.value = 'Agrega al menos un cilindro, producto o descripción'
    toastWarning('Agrega al menos un ítem a la guía')
    return
  }

  const lineaCilindroSinProducto = lineasConContenido.find(
    (l) => l.tipo === 'cilindro' && !l.idProducto,
  )
  if (lineaCilindroSinProducto) {
    detallesError.value = 'El cilindro no tiene producto/gas asociado'
    toastWarning('Selecciona el gas del cilindro o cambia el tipo de ítem')
    return
  }

  const lineaLibreCorta = lineasConContenido.find(
    (l) => l.tipo === 'libre' && (l.glosa?.trim().length ?? 0) < 3,
  )
  if (lineaLibreCorta) {
    detallesError.value = 'La descripción libre debe tener al menos 3 caracteres'
    toastWarning('Describe el ítem libre antes de guardar')
    return
  }

  const lineaSinCantidad = lineasConContenido.find((l) => !(Number(l.cantidad) > 0))
  if (lineaSinCantidad) {
    detallesError.value = 'Cada ítem debe tener cantidad mayor a 0'
    toastWarning('Revisa las cantidades de los ítems')
    return
  }

  const lineaSinPeso = lineasConContenido.find(
    (l) => !(Number.isFinite(Number(l.pesoKg)) && Number(l.pesoKg) > 0),
  )
  if (lineaSinPeso) {
    detallesError.value = 'Cada ítem debe tener peso en kg'
    toastWarning('Ingresa el peso (kg) de cada ítem antes de guardar')
    return
  }

  const detalles = lineasConContenido.map((l, i) => {
    const glosa = (l.glosa || l.descripcion || '').trim() || undefined
    return {
      item: i + 1,
      idProducto: l.idProducto ? Number(l.idProducto) : undefined,
      cantidad: Number(l.cantidad),
      idUnidadMedida: l.idUnidadMedida ?? resolveUnidadBotellasId(),
      descripcion: glosa,
      glosa,
      idBalon: l.idBalon ? Number(l.idBalon) : undefined,
    }
  })
  detallesError.value = ''

  if (!pesoBultosManual.value) aplicarPesoBultosDesdeItems()

  const esLibre = modoDestinatario.value === 'libre'
  const esRemitenteLibre = es31 && modoRemitente.value === 'libre'
  const idClientePayload = es31
    ? esRemitenteLibre
      ? undefined
      : Number(idRemitente.value)
    : esLibre
      ? undefined
      : Number(formValues.idDestinatario)

  const payloadBase = {
    fecha: formValues.fecha,
    fechaTraslado: formValues.fechaTraslado,
    idSucursal: Number(formValues.idSucursal),
    idAlmacen: Number(formValues.idAlmacen),
    idCliente: idClientePayload,
    remitenteNombre: esRemitenteLibre ? remitenteNombreLibre.value.trim() : undefined,
    remitenteDocumento: esRemitenteLibre
      ? remitenteDocumentoLibre.value.replace(/\D/g, '')
      : undefined,
    idMotivoTraslado: Number(formValues.idMotivoTraslado),
    idUnidadMedida: formValues.idUnidadMedida ? Number(formValues.idUnidadMedida) : undefined,
    pesoBruto: Number(formValues.pesoBruto) || pesoBultosCalculado.value.pesoBrutoKg || 0,
    numeroBultos:
      formValues.numeroBultos != null && Number(formValues.numeroBultos) > 0
        ? Number(formValues.numeroBultos)
        : pesoBultosCalculado.value.numeroBultos || 1,
    direccionOrigen: formValues.direccionOrigen,
    idDistritoOrigen: Number(idDistritoOrigen.value),
    idDestinatario: esLibre ? undefined : Number(formValues.idDestinatario),
    destinatarioNombre: esLibre ? destinatarioNombreLibre.value.trim() : undefined,
    destinatarioDocumento: esLibre
      ? destinatarioDocumentoLibre.value.replace(/\D/g, '')
      : undefined,
    direccionLlegada: formValues.direccionLlegada,
    idDistritoLlegada: Number(idDistritoLlegada.value),
    idModalidadTraslado: Number(formValues.idModalidadTraslado),
    idTransportista: formValues.idTransportista
      ? Number(formValues.idTransportista)
      : undefined,
    idChofer: formValues.idChofer ? Number(formValues.idChofer) : undefined,
    idVehiculo: formValues.idVehiculo ? Number(formValues.idVehiculo) : undefined,
    observaciones: formValues.observaciones || undefined,
    detalles,
    idUsuarioAuditoria: userId,
  }

  if (isEdit.value && guiaId.value) {
    await updateMutation.mutateAsync({
      id: guiaId.value,
      payload: payloadBase,
    })
    goBack()
    return
  }

  const created = await createMutation.mutateAsync({
    idTipoGuiaRemision: Number(formValues.idTipoGuiaRemision),
    serie: String(formValues.serie).trim().toUpperCase(),
    ...payloadBase,
  })
  goBack(created?.id)
})
</script>
