# Documentación del Proyecto — Admin Sistema Sarita

Panel administrativo de **Oxígeno Sarita**. Sistema SPA para la gestión integral de una empresa peruana de oxígeno y gases: CRM, inventario, balones/cilindros, punto de venta (POS), facturación electrónica SUNAT y administración del sistema.

---

## Índice

1. [Stack Tecnológico](#1-stack-tecnológico)
2. [Estructura del Proyecto](#2-estructura-del-proyecto)
3. [Módulos del Sistema](#3-módulos-del-sistema)
4. [Enrutamiento](#4-enrutamiento)
5. [Autenticación y Autorización](#5-autenticación-y-autorización)
6. [API Client](#6-api-client)
7. [Estado Global (Pinia)](#7-estado-global-pinia)
8. [Componentes Compartidos](#8-componentes-compartidos)
9. [Base de Datos (Esquema Inferido)](#9-base-de-datos-esquema-inferido)
10. [Desarrollo y Despliegue](#10-desarrollo-y-despliegue)

---

## 1. Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| **Vue 3** | ^3.5 | Framework UI (Composition API, `<script setup>`) |
| **TypeScript** | ~6.0 | Tipado estático |
| **Vite** | ^8.1 | Bundler y dev server |
| **Pinia** | ^3.0 | Estado global con persistencia |
| **TanStack Query (Vue Query)** | ^5.101 | Caché y fetch de datos del servidor |
| **Vue Router** | ^5.1 | Enrutamiento SPA |
| **Axios** | ^1.18 | Cliente HTTP |
| **Tailwind CSS** | ^4.3 | CSS utilitario (con `@tailwindcss/forms`) |
| **VeeValidate + Yup** | ^4.15 | Validación de formularios |
| **Vue Sonner** | ^2.0 | Notificaciones toast |
| **Iconify** | ^5.0 | Iconos (colección Lucide) |
| **Leaflet** | ^1.9.4 | Mapas interactivos |
| **ESLint** | ^10.5 | Linting |
| **Prettier** | ^3.8 | Formateo |
| **PostCSS** | ^8.5 | Procesamiento CSS |

**Backend:** API REST independiente (`api-sistema-sarita`) en `http://localhost:3000`.

---

## 2. Estructura del Proyecto

```
admin-sistema-sarita/
├── .editorconfig
├── .env                          # VITE_API_BASE_URL=http://localhost:3000
├── .env.example
├── .gitignore
├── .prettierrc.json
├── eslint.config.ts
├── index.html                    # Entry HTML con script de dark-mode
├── package.json
├── postcss.config.js
├── README.md
├── tsconfig.json                 # Config raíz (references)
├── tsconfig.app.json             # Config app
├── tsconfig.node.json            # Config node
├── vite.config.ts                # Vite config con alias @
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   └── images/
│       ├── logo/
│       │   ├── auth-logo.svg
│       │   └── logo-o-sarita.webp
│       ├── shape/
│       │   └── grid-01.svg
│       ├── marcador-mapa.png
│       └── movilidad_sarita.webp
└── src/
    ├── main.ts                   # Entry point
    ├── App.vue                   # Componente raíz
    ├── vite-env.d.ts
    ├── assets/
    │   └── main.css              # Tailwind directives, theme, utilities
    ├── router/
    │   ├── index.ts              # Router principal + guards
    │   └── router.d.ts           # RouteMeta augmentation
    ├── shared/                   # Código reutilizable entre módulos
    │   ├── api/
    │   │   ├── apiClient.ts      # Axios client + interceptors
    │   │   ├── interfaces/
    │   │   │   └── api.interface.ts
    │   │   └── errors/
    │   │       └── api.error.ts
    │   ├── components/
    │   │   ├── index.ts
    │   │   ├── AppIcon.vue
    │   │   ├── ThemeToggler.vue
    │   │   ├── CommonGridShape.vue
    │   │   ├── form/             # Componentes de formulario
    │   │   ├── ui/               # Componentes de UI general
    │   │   ├── filters/          # Filtros dinámicos
    │   │   ├── detail/           # Layouts de detalle
    │   │   └── map/              # Mapa Leaflet
    │   ├── composables/          # Lógica reactiva reutilizable
    │   ├── constants/            # Permisos, iconos, lista-ids
    │   ├── interfaces/           # Tipos transversales
    │   ├── layouts/              # Layouts globales
    │   ├── plugins/              # Pinia + Vue Query config
    │   ├── utils/                # Helpers (fechas, paginación, tabla)
    │   └── validation/           # Esquemas Yup y mensajes
    └── modules/                  # 15 módulos funcionales
        ├── admin/                # Layout principal
        ├── auth/                 # Autenticación
        ├── dashboard/            # Dashboard principal
        ├── usuarios/             # Usuarios del sistema
        ├── roles/                # Roles
        ├── permisos/             # Permisos
        ├── clientes/             # CRM de clientes
        ├── contactos/            # Contactos de clientes
        ├── direcciones/          # Direcciones de clientes
        ├── choferes/             # Conductores
        ├── vehiculos/            # Vehículos
        ├── cuentas-bancarias/    # Cuentas bancarias
        ├── catalogos/            # Catálogos compartidos (ubigeo, listas)
        ├── consultas/            # Consultas externas (DNI/RUC)
        ├── configuracion/        # Configuración del sistema
        ├── productos/            # Productos, stock, movimientos
        ├── balones/              # Gestión de cilindros/balones
        └── ventas/               # POS y facturación electrónica
```

---

## 3. Módulos del Sistema

### 3.1 `admin` — Layout Principal

Módulo estructural que contiene el layout base de la aplicación:

- **AdminLayout.vue** — Layout con sidebar lateral y header superior
- **AdminShell.vue** — Shell consciente de autenticación
- **AppSidebar.vue** — Menú lateral navegable con permisos
- **AppHeader.vue** — Barra superior con logo, búsqueda, notificaciones y menú de usuario
- **UserMenu.vue** — Menú desplegable del usuario autenticado
- **NotificationMenu.vue** — Campana de notificaciones
- **SearchBar.vue** — Barra de búsqueda global
- **SidebarProvider.vue** — Proveedor de estado del sidebar
- **HeaderLogo.vue** — Logo en el header
- **Backdrop.vue** — Fondo oscuro para sidebar en mobile

**Configuración de menú:** `src/modules/admin/config/menu.ts` define todos los ítems del menú lateral con sus iconos, rutas y permisos requeridos.

### 3.2 `auth` — Autenticación

- **LoginView.vue** — Pantalla de inicio de sesión con formulario de credenciales y checkbox "Mantener sesión iniciada"
- **auth.store.ts** — Store Pinia con JWT, datos del usuario, permisos y métodos `login`, `logout`, `hasPermission`
- **auth.service.ts** — `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- **Composables:** `useLoginMutation`, `useLogoutMutation`, `useAuthMeQuery`

**Flujo:**
1. Usuario ingresa credenciales en `/`
2. Backend devuelve `{ token, usuario }` con permisos
3. Token almacenado en localStorage (persistente) o sessionStorage (no persistente)
4. Axios interceptor inyecta `Authorization: Bearer <token>`
5. 401 → limpieza de sesión + redirección a login

### 3.3 `dashboard` — Dashboard Principal

- **DashboardView.vue** — Página principal con resumen del sistema (métricas, gráficos, actividad reciente)
- Ruta: `/admin/dashboard`

### 3.4 `usuarios` — Usuarios del Sistema

- **UsuariosListView.vue** — Listado con tabla, filtros, paginación
- **UsuarioFormModal.vue** — Modal de creación/edición con asignación de roles
- **Servicios:** `usuarios.service.ts` + `usuarios-roles.service.ts`
- **Permisos:** `usuarios.listar`, `usuarios.crear`, `usuarios.editar`, `usuarios.eliminar`, `usuarios.activar`
- Endpoints: `GET/POST /auth/usuarios`, `GET/PATCH/DELETE /auth/usuarios/:id`, `PATCH .../activar`

### 3.5 `roles` — Roles

- **RolesListView.vue** — Listado de roles del sistema
- **RolFormModal.vue** — Modal de creación/edición
- **RolPermisosModal.vue** — Modal de asignación de permisos a roles
- **Permisos:** `roles.listar`, `roles.crear`, `roles.editar`, `roles.eliminar`
- Endpoints: `GET/POST /auth/roles`, `GET/PATCH/DELETE /auth/roles/:id`, `GET/POST/DELETE /auth/roles-permisos`

### 3.6 `permisos` — Permisos

- **PermisosListView.vue** — Listado de permisos (formato `modulo.accion`)
- **PermisoFormModal.vue** — Modal de creación/edición
- **Permisos:** `permisos.listar`, `permisos.crear`, `permisos.editar`, `permisos.eliminar`
- Endpoints: `GET/POST /auth/permisos`, `GET/PATCH/DELETE /auth/permisos/:id`

### 3.7 `clientes` — CRM de Clientes

Módulo más complejo, agrupa CRUD principal y vistas auxiliares.

- **ClientesTabsView.vue** — Vista principal con tabs (lista, mapa)
- **ClientesListView.vue** — Listado con tabla, filtros avanzados, búsqueda
- **ClientesMapaView.vue** — Visualización de clientes en mapa Leaflet con marcadores
- **ClienteFormModal.vue** — Modal de creación/edición con datos completos (tipo persona, documento, ubicación, regímenes SUNAT)
- **ClienteDetailModal.vue** — Modal de detalle con toda la información del cliente
- **bajas-cliente/** — Submódulo de solicitudes de baja de clientes con flujo de aprobación
- **Permisos:** `clientes.listar`, `clientes.crear`, `clientes.editar`, `clientes.eliminar`, `clientes.restaurar`, `clientes.ver`
- Endpoints: `GET/POST /clientes`, `GET/PATCH/DELETE /clientes/:id`, `PATCH .../restaurar`, `GET .../validar-documento`

### 3.8 `contactos` — Contactos de Clientes

- **ContactosListView.vue** — Listado con filtro por cliente
- **ContactoFormModal.vue** — Modal de creación/edición
- **ContactoDetailModal.vue** — Modal de detalle
- **Permisos:** `contactos.listar`, `contactos.crear`, `contactos.editar`, `contactos.eliminar`, `contactos.ver`

### 3.9 `direcciones` — Direcciones de Clientes

- **DireccionesListView.vue** — Listado con ubicación en mapa
- **DireccionFormModal.vue** — Modal con selector de ubigeo (departamento/provincia/distrito)
- **DireccionDetailModal.vue** — Modal de detalle
- Soporte para coordenadas desde link de Google Maps
- **Permisos:** `direcciones.listar`, `direcciones.crear`, `direcciones.editar`, `direcciones.eliminar`, `direcciones.ver`

### 3.10 `choferes` — Conductores

- **ChoferesListView.vue** — Listado con tabla
- **ChoferFormModal.vue** — Modal con datos de licencia (tipo, categoría, fechas)
- **ChoferDetailModal.vue** — Modal de detalle
- **Permisos:** `choferes.listar`, `choferes.crear`, `choferes.editar`, `choferes.eliminar`, `choferes.ver`

### 3.11 `vehiculos` — Vehículos

- **VehiculosListView.vue** — Listado de vehículos
- **VehiculoFormModal.vue** — Modal con datos de placa, marca, modelo, certificados
- **VehiculoDetailModal.vue** — Modal de detalle
- **Permisos:** `vehiculos.listar`, `vehiculos.crear`, `vehiculos.editar`, `vehiculos.eliminar`, `vehiculos.ver`

### 3.12 `cuentas-bancarias` — Cuentas Bancarias

- **CuentasBancariasListView.vue** — Listado de cuentas por cliente
- **CuentaBancariaFormModal.vue** — Modal con banco, tipo de cuenta, número, CCI, billetera
- **CuentaBancariaDetailModal.vue** — Modal de detalle
- **Permisos:** `cuentas_bancarias.listar`, `cuentas_bancarias.crear`, `cuentas_bancarias.editar`, `cuentas_bancarias.eliminar`, `cuentas_bancarias.ver`

### 3.13 `catalogos` — Catálogos Compartidos

- **Lista de Opciones:** Catálogos genéricos desde tabla `gen_lista`/`gen_lista_opciones`
- **Ubigeo:** Departamentos, provincias y distritos del Perú
- **IDs de listas:** Definidos en `src/shared/constants/lista-ids.ts`
- Endpoints: `GET /catalogos/listas/:idLista/opciones`, `GET /catalogos/ubigeo/paises|departamentos|provincias|distritos`

### 3.14 `consultas` — Consultas Externas

- Consulta de DNI (RENIEC) y RUC (SUNAT)
- Endpoints: `GET /consultas/dni/:dni`, `GET /consultas/ruc/:ruc`

### 3.15 `configuracion` — Configuración del Sistema

Módulo hub con acceso a:

| Submódulo | Descripción | Permiso |
|---|---|---|
| **Sucursales** | CRUD de sucursales/tiendas | `sucursales.*` |
| **Almacenes** | CRUD de almacenes por sucursal | `almacenes.*` |
| **Condiciones de Pago** | CRUD de condiciones (ej. contado, crédito 30d) | `condiciones_pago.*` |
| **Empresas** | Configuración de datos de la empresa (RUC, razón social) | `empresas.*` |
| **SUNAT** | Configuración de facturación electrónica (usuario SOL, certificado, ambiente) | `configuracion_sunat.*` |
| **Servicios** | Configuración de servicios externos (API keys, URLs) | `configuracion_servicios.*` |

### 3.16 `productos` — Gestión de Productos

Módulo hub con submódulos:

| Submódulo | Descripción |
|---|---|
| **Categorías** | CRUD de categorías de producto |
| **Subcategorías** | CRUD de subcategorías |
| **Artículos** | CRUD de productos/servicios |
| **Stock** | Niveles de inventario por almacén |
| **Movimientos** | Movimientos de inventario (entradas, salidas, ajustes) |
| **Catálogo de Precios** | Precios por producto (lista de precios) |

### 3.17 `balones` — Gestión de Cilindros/Balones

Módulo especializado para el negocio de oxígeno. Maneja el ciclo de vida completo de los cilindros.

| Submódulo | Descripción | Permiso |
|---|---|---|
| **Tipos de Balón** | CRUD de tipos (tamaño, capacidad, peso) | `tipos_balon.*` |
| **Cilindros** | Registro individual ("libro de cilindros") con estado, seguimiento, bajas | `balones.*` |
| **Movimientos** | Movimientos físicos de cilindros (entregas, devoluciones) | `movimientos_balon.*` |
| **Recargas** | Registro de recargas de cilindros por cliente | `movimientos_recarga.*` |
| **Préstamos** | Préstamos de cilindros a clientes con detalle | `prestamos_balon.*` |
| **Alquileres** | Alquiler de cilindros con detalle | `alquileres_balon.*` |
| **Mantenimientos** | Mantenimiento de cilindros (pruebas, reparaciones) | `mantenimientos_balon.*` |
| **Bajas Pendientes** | Aprobación de bajas de cilindros | — |

### 3.18 `ventas` — POS y Facturación Electrónica

Módulo principal de caja/ventas.

**POS (Punto de Venta):**
- **PosView.vue** — Interfaz de caja rápida con:
  - Selector de productos y balones
  - Panel de recarga de cilindros
  - Panel de alquiler de cilindros
  - Panel de mantenimiento
  - Panel de accesorios
  - Resumen lateral con totales
  - Selección de cliente, condición de pago, almacén

**Comprobantes:**
- **ComprobantesListView.vue** — Historial de todos los comprobantes
- **NotasCreditoListView.vue** — Gestión de notas de crédito
- **ResumenDiarioView.vue** — Resúmenes diarios para SUNAT
- **Componentes:** Detail, Edit, Anular, NotaCredito, CDR, ResumenDiario modales
- **Utils:** Generación de PDF, impresión de ticket, series de comprobante

**Flujo de facturación electrónica:**
1. Emisión → envío a SUNAT → consulta CDR → actualización de estado
2. Soporta: facturas, boletas, notas de crédito, resúmenes diarios
3. Estados: pendiente, aceptado, rechazado, baja

**Permisos:** `comprobantes.*` (listar, ver, crear, editar, eliminar, emitir, consultar_cdr)

---

## 4. Enrutamiento

### 4.1 Rutas de Autenticación (guest)

| Ruta | Nombre | Componente | Meta |
|---|---|---|---|
| `/` | `auth-login` | LoginView | guest, title: "Iniciar sesión" |
| `/login` | — | Redirect → `/` | |

### 4.2 Rutas de Administración (require auth)

| Ruta | Nombre | Componente | Permiso |
|---|---|---|---|
| `/admin` | — | AdminShell | requiresAuth |
| `/admin/dashboard` | admin-dashboard | DashboardView | — |
| `/admin/clientes` | admin-clientes | ClientesTabsView | clientes.listar |
| `/admin/clientes/mapa` | admin-clientes-mapa | ClientesMapaView | clientes.listar |
| `/admin/clientes/contactos` | admin-clientes-contactos | ContactosListView | contactos.listar |
| `/admin/clientes/direcciones` | admin-clientes-direcciones | DireccionesListView | direcciones.listar |
| `/admin/clientes/choferes` | admin-clientes-choferes | ChoferesListView | choferes.listar |
| `/admin/clientes/vehiculos` | admin-clientes-vehiculos | VehiculosListView | vehiculos.listar |
| `/admin/clientes/cuentas-bancarias` | admin-clientes-cuentas-bancarias | CuentasBancariasListView | cuentas_bancarias.listar |
| `/admin/usuarios` | admin-usuarios | UsuariosListView | usuarios.listar |
| `/admin/roles` | admin-roles | RolesListView | roles.listar |
| `/admin/permisos` | admin-permisos | PermisosListView | permisos.listar |
| `/admin/configuracion` | admin-configuracion | ConfiguracionHubView | configuracion.ver |
| `/admin/configuracion/sucursales` | admin-configuracion-sucursales | SucursalesListView | sucursales.listar |
| `/admin/configuracion/almacenes` | admin-configuracion-almacenes | AlmacenesListView | almacenes.listar |
| `/admin/configuracion/condiciones-pago` | admin-configuracion-condiciones-pago | CondicionesPagoListView | condiciones_pago.listar |
| `/admin/configuracion/empresas` | admin-configuracion-empresas | EmpresaSettingsView | empresas.ver |
| `/admin/configuracion/sunat` | admin-configuracion-sunat | SunatSettingsView | configuracion_sunat.ver |
| `/admin/configuracion/servicios` | admin-configuracion-servicios | ServiciosListView | configuracion_servicios.listar |
| `/admin/productos` | admin-productos | ProductosHubView | productos.ver |
| `/admin/productos/categorias` | admin-productos-categorias | CategoriasProductoListView | categorias.listar |
| `/admin/productos/sub-categorias` | admin-productos-sub-categorias | SubCategoriasProductoListView | sub_categorias.listar |
| `/admin/productos/articulos` | admin-productos-articulos | ProductosListView | productos.listar |
| `/admin/productos/stock` | admin-productos-stock | StockListView | stock.listar |
| `/admin/productos/movimientos` | admin-productos-movimientos | MovimientosListView | movimientos.listar |
| `/admin/productos/catalogo-precios` | admin-productos-catalogo-precios | CatalogoPreciosListView | catalogo_precios.listar |
| `/admin/balones` | admin-balones | BalonesHubView | balones.ver |
| `/admin/balones/cilindros` | admin-balones-cilindros | CilindrosTabsView | balones.listar |
| `/admin/balones/tipos` | admin-balones-tipos | TiposBalonListView | tipos_balon.listar |
| `/admin/balones/movimientos` | admin-balones-movimientos | MovimientosBalonListView | movimientos_balon.listar |
| `/admin/balones/recargas` | admin-balones-recargas | RecargasListView | movimientos_recarga.listar |
| `/admin/balones/recargas/nueva` | admin-balones-recarga-cliente | RecargaClienteView | movimientos_recarga.crear |
| `/admin/balones/prestamos` | admin-balones-prestamos | PrestamosListView | prestamos_balon.listar |
| `/admin/balones/alquileres` | admin-balones-alquileres | AlquileresListView | alquileres_balon.listar |
| `/admin/balones/mantenimientos` | admin-balones-mantenimientos | MantenimientosListView | mantenimientos_balon.listar |
| `/admin/ventas/pos` | admin-ventas-pos | PosView | comprobantes.crear |
| `/admin/ventas/comprobantes` | admin-ventas-comprobantes | ComprobantesListView | comprobantes.listar |
| `/admin/ventas/notas-credito` | admin-ventas-notas-credito | NotasCreditoListView | comprobantes.listar |
| `/admin/ventas/resumen-diario` | admin-ventas-resumen-diario | ResumenDiarioView | comprobantes.emitir |

### 4.3 Guards (Middleware de Rutas)

Implementados en `src/router/index.ts`:

1. **Auth Guard** — Verifica `meta.requiresAuth`; redirige a `/` si no hay sesión
2. **Guest Guard** — Verifica `meta.guest`; redirige a dashboard si ya hay sesión
3. **Permission Guard** — Verifica `meta.permission` contra los permisos del usuario; redirige a dashboard con toast si no autorizado
4. **Title Guard** — Actualiza `document.title` desde `meta.title`

---

## 5. Autenticación y Autorización

### 5.1 Permisos

Definidos en `src/shared/constants/permissions.ts`. Siguen el formato `modulo.accion`.

**Permisos definidos (226 flags en total):**

| Grupo | Acciones |
|---|---|
| `auth.todo` | Superadmin (bypassea todo) |
| `usuarios.*` | listar, ver, crear, editar, eliminar, activar |
| `roles.*` | listar, ver, crear, editar, eliminar |
| `permisos.*` | listar, ver, crear, editar, eliminar |
| `usuarios_roles.*` | listar, asignar, quitar |
| `roles_permisos.*` | listar, asignar, quitar |
| `sesiones.*` | listar, ver, crear, cerrar |
| `clientes.*` | listar, ver, crear, editar, eliminar, restaurar |
| `contactos.*` | listar, ver, crear, editar, eliminar |
| `direcciones.*` | listar, ver, crear, editar, eliminar |
| `choferes.*` | listar, ver, crear, editar, eliminar |
| `vehiculos.*` | listar, ver, crear, editar, eliminar |
| `cuentas_bancarias.*` | listar, ver, crear, editar, eliminar |
| `configuracion.*` | ver |
| `sucursales.*` | listar, ver, crear, editar, eliminar |
| `almacenes.*` | listar, ver, crear, editar, eliminar |
| `condiciones_pago.*` | listar, ver, crear, editar, eliminar |
| `empresas.*` | listar, ver, crear, editar, eliminar |
| `configuracion_sunat.*` | listar, ver, crear, editar, eliminar |
| `configuracion_servicios.*` | listar, ver, crear, editar, eliminar |
| `productos_hub.*` | ver |
| `categorias.*` | listar, ver, crear, editar, eliminar |
| `sub_categorias.*` | listar, ver, crear, editar, eliminar |
| `productos.*` | listar, ver, crear, editar, eliminar |
| `stock.*` | listar, ver, crear, editar, eliminar |
| `movimientos.*` | listar, ver, crear, editar, eliminar |
| `catalogo_precios.*` | listar, ver, crear, editar, eliminar |
| `balones_hub.*` | ver |
| `tipos_balon.*` | listar, ver, crear, editar, eliminar |
| `balones.*` | listar, ver, crear, editar, eliminar |
| `movimientos_balon.*` | listar, ver, crear, editar, eliminar |
| `movimientos_recarga.*` | listar, ver, crear, editar, eliminar |
| `prestamos_balon.*` | listar, ver, crear, editar, eliminar |
| `prestamos_detalle.*` | listar, ver, crear, editar, eliminar |
| `alquileres_balon.*` | listar, ver, crear, editar, eliminar |
| `alquileres_detalle.*` | listar, ver, crear, editar, eliminar |
| `mantenimientos_balon.*` | listar, ver, crear, editar, eliminar |
| `ventas.*` | ver |
| `comprobantes.*` | listar, ver, crear, editar, eliminar, emitir, consultar_cdr |
| `bajas_cliente.*` | listar, ver, solicitar, aprobar, rechazar, eliminar |

### 5.2 Capas de Seguridad

1. **Menú lateral** — Items filtrados por permiso
2. **Router** — `beforeEach` valida `meta.permission`
3. **UI** — `authStore.hasPermission()` para mostrar/ocultar acciones

---

## 6. API Client

Centralizado en `src/shared/api/apiClient.ts`.

### 6.1 Funciones

| Función | Descripción |
|---|---|
| `apiGet<T>(url, config?)` | GET simple |
| `apiGetPaginated<T>(url, config?)` | GET con respuesta `{ data, meta }` |
| `apiPost<T>(url, body?, config?)` | POST |
| `apiPatch<T>(url, body?, config?)` | PATCH |
| `apiPut<T>(url, body?, config?)` | PUT |
| `apiDelete<T>(url, config?)` | DELETE |
| `apiGetBlob(url, config?)` | GET blob (PDF) |

### 6.2 Interceptores

- **Request:** Inyecta `Authorization: Bearer <token>` desde auth store
- **Response:** Captura 401 → limpia sesión → redirige a login

### 6.3 Formatos de Respuesta

```typescript
interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  meta?: PaginationMeta
}

interface PaginationMeta {
  pagina: number
  limite: number
  total: number
}
```

---

## 7. Estado Global (Pinia)

| Store | Módulo | Propósito |
|---|---|---|
| `auth.store.ts` | `auth` | Sesión del usuario, token JWT, permisos |
| `useAdminMenu` | `admin` | Estado del menú lateral (items visibles) |
| `useSidebar` | `admin` | Estado del sidebar (colapsado, mobile) |
| `useTheme` | `shared` | Tema claro/oscuro |

Persistencia con `pinia-plugin-persistedstate`.

---

## 8. Componentes Compartidos

### 8.1 UI (@/shared/components/ui/)

| Componente | Descripción |
|---|---|
| `AppTable.vue` | Tabla genérica con columnas, slots toolbar/actions/footer |
| `AppPagination.vue` | Paginación sincronizada con API meta |
| `AppModal.vue` | Modal con header, body scrollable, footer |
| `AppBadge.vue` | Etiqueta/estado individual |
| `AppBadgeList.vue` | Lista de etiquetas |
| `AppTabs.vue` | Sistema de tabs |

### 8.2 Formularios (@/shared/components/form/)

| Componente | Descripción |
|---|---|
| `AppInput.vue` | Campo de texto |
| `AppTextarea.vue` | Área de texto |
| `AppSelect.vue` | Select desplegable |
| `AppCheckbox.vue` | Checkbox |
| `AppFileInput.vue` | Carga de archivos |
| `AppFormField.vue` | Wrapper con label, errores y slot |
| `SearchableSelect.vue` | Select con búsqueda |

### 8.3 Filtros (@/shared/components/filters/)

| Componente | Descripción |
|---|---|
| `AppDynamicFilters.vue` | Sistema de filtros dinámicos configurables |
| `AppListToolbar.vue` | Barra de herramientas con búsqueda y acciones |

### 8.4 Detalle (@/shared/components/detail/)

| Componente | Descripción |
|---|---|
| `DetailCardsLayout.vue` | Layout de tarjetas para vista detalle |
| `DetailSectionCard.vue` | Tarjeta individual de sección |
| `FormCardsLayout.vue` | Layout de tarjetas para formularios |

### 8.5 Mapa (@/shared/components/map/)

| Componente | Descripción |
|---|---|
| `MapaLeaflet.vue` | Componente de mapa interactivo con Leaflet (marcadores, popups) |

### 8.6 Generales

| Componente | Descripción |
|---|---|
| `AppIcon.vue` | Renderizado de iconos Iconify (colección Lucide) |
| `ThemeToggler.vue` | Toggle claro/oscuro |
| `CommonGridShape.vue` | Decoración SVG de fondo |

---

## 9. Base de Datos (Esquema Inferido)

El backend es una API separada (`api-sistema-sarita`). Las siguientes tablas se infieren de las interfaces y servicios del frontend:

### 9.1 Tablas de Autenticación

| Tabla | Columnas principales |
|---|---|
| `auth_usuarios` | id, nombre, correo, contrasena, estado, fecha_creacion, fecha_modificacion |
| `auth_roles` | id, nombre, descripcion, estado |
| `auth_permisos` | id, nombre (modulo.accion), descripcion, estado |
| `auth_usuarios_roles` | id, id_usuario (FK), id_rol (FK), estado |
| `auth_roles_permisos` | id, id_rol (FK), id_permiso (FK), estado |
| `auth_sesiones` | id, id_usuario (FK), nombre_usuario, correo, fecha_inicio |

### 9.2 Tablas de Clientes

| Tabla | Columnas principales |
|---|---|
| `clientes` | id, codigo_interno, razon_social, nombre_comercial, id_tipo_cliente, id_tipo_persona, nombres, apellido_paterno, apellido_materno, id_tipo_documento, numero_documento, direccion, referencia, latitud, longitud, telefono, email, id_departamento, id_provincia, id_distrito, id_pais, es_agente_percepcion, es_buen_contribuyente, es_agente_retenedor, afecto_rus, situacion_sunat, estado_contribuyente_sunat, observacion, estado |
| `contactos` | id, id_cliente (FK), nombre, apellido_paterno, apellido_materno, direccion, email, telefono1-3, es_principal, estado |
| `direcciones` | id, id_cliente (FK), descripcion, direccion, id_pais, id_departamento, id_provincia, id_distrito, referencia, latitud, longitud, es_principal, estado |
| `choferes` | id, id_cliente (FK), nombres, apellidos, id_tipo_documento, numero_documento, telefono, codigo_licencia, fecha_emision, fecha_vencimiento, id_tipo_licencia, id_categoria_licencia, estado |
| `vehiculos` | id, id_cliente (FK), id_tipo_vehiculo, placa, placa2, marca, marca2, modelo, anio, color, certificado_inscripcion, certificado2, estado |
| `cuentas_bancarias` | id, id_cliente (FK), id_banco, id_tipo_cuenta, titular, numero_cuenta, numero_cuenta_interbancaria, telefono_billetera, es_principal, estado |

### 9.3 Tablas de Configuración

| Tabla | Columnas principales |
|---|---|
| `sucursales` | id, codigo, nombre, direccion, id_departamento, id_provincia, id_distrito, telefono, estado |
| `almacenes` | id, id_sucursal (FK), nombre, ubicacion, descripcion, estado |
| `condiciones_pago` | id, codigo, nombre, dias_credito, estado |
| `empresas` | id, ruc, razon_social, nombre_comercial, direccion, telefono, email, estado |
| `configuracion_sunat` | id, id_empresa (FK), nombre_comercial, usuario_sol, certificado_digital, tiene_clave_sol, tiene_clave_certificado, id_ambiente, estado |
| `configuracion_servicios` | id, codigo, nombre, usuario, contrasena, email, url, observacion, estado |

### 9.4 Tablas de Productos

| Tabla | Columnas principales |
|---|---|
| `categorias_producto` | id, nombre, descripcion, estado |
| `sub_categorias_producto` | id, id_categoria (FK), nombre, descripcion, estado |
| `productos` / `articulos` | id, id_categoria, id_sub_categoria, codigo, nombre, descripcion, precio_venta, costo, unidad_medida, estado |
| `stock` | id, id_producto (FK), id_almacen (FK), cantidad, stock_minimo, stock_maximo |
| `movimientos_inventario` | id, id_producto, id_almacen, tipo_movimiento, cantidad, motivo, fecha |
| `catalogo_precios` | id, id_producto, precio, fecha_inicio, fecha_fin, estado |

### 9.5 Tablas de Balones/Cilindros

| Tabla | Columnas principales |
|---|---|
| `tipos_balon` | id, nombre, capacidad, peso, descripcion, estado |
| `balones` / `cilindros` | id, codigo, id_tipo_balon (FK), id_estado, ubicacion_actual, id_cliente_asignado, fecha_fabricacion, fecha_ultima_prueba, fecha_vencimiento, estado |
| `movimientos_balon` | id, id_balon (FK), id_tipo_movimiento, id_cliente, fecha, observacion |
| `recargas` | id, id_balon (FK), id_cliente, fecha, cantidad, precio, estado |
| `prestamos` | id, id_cliente, fecha, fecha_devolucion, estado |
| `prestamos_detalle` | id, id_prestamo (FK), id_balon (FK), cantidad, fecha_devolucion |
| `alquileres` | id, id_cliente, fecha_inicio, fecha_fin, estado |
| `alquileres_detalle` | id, id_alquiler (FK), id_balon (FK), cantidad, precio_diario |
| `mantenimientos` | id, id_balon (FK), fecha, tipo_mantenimiento, descripcion, costo, resultado, estado |
| `bajas_cliente` | id, id_cliente (FK), id_balon (FK), fecha_solicitud, motivo, estado_aprobacion |

### 9.6 Tablas de Ventas

| Tabla | Columnas principales |
|---|---|
| `comprobantes` | id, id_tipo_comprobante, serie, numero, fecha, id_cliente (FK), total_importe, sub_total, descuento, valor_venta, igv, exonerado, glosa, observaciones, id_estado, id_estado_sunat, hash_documento, xml_firmado, ticket_sunat, id_comprobante_origen, id_motivo_nota, id_moneda, id_medio_pago, id_almacen, id_tipo_operacion_sunat |
| `comprobantes_detalle` | id, id_comprobante (FK), item, id_producto (FK), cantidad, precio_unitario, descuento, porcentaje_igv, id_afectacion_igv, valor_venta, impuesto, importe |
| `resumenes_diarios` | id, fecha, correlativo, identificador, ticket_sunat, id_estado_sunat, moneda, cantidad_docs, total_importe, total_igv, total_valor_venta, cdr_respuesta, observacion |
| `resumenes_diarios_detalle` | id, id_resumen (FK), id_comprobante (FK), item |

### 9.7 Tablas de Catálogos

| Tabla | Columnas principales |
|---|---|
| `gen_lista` | id, nombre |
| `gen_lista_opciones` | id, id_lista (FK), nombre, descripcion, estado |

---

## 10. Desarrollo y Despliegue

### 10.1 Requisitos

- Node.js 20+
- API backend en ejecución (`api-sistema-sarita`)

### 10.2 Variables de Entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_BASE_URL` | URL base de la API backend | `http://localhost:3000` |

### 10.3 Comandos

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (puerto 5173)
npm run dev

# Build de producción
npm run build

# Vista previa del build
npm run preview

# Lint
npm run lint

# Formateo con Prettier
npm run format
```

### 10.4 Convenciones de Código

- **Componentes:** Vue 3 `<script setup lang="ts">`, Composition API
- **Tipado:** Tipos explícitos en props, emits, refs y reactive
- **Store:** `defineStore` con setup function
- **Composables:** Prefijo `use`, archivos PascalCase
- **Servicios:** Objetos con métodos (no clases)
- **Query keys:** Jerarquía inmutable `all → lists → list(filters)`
- **Rutas:** Lazy loading con `() => import()`
- **Iconos:** Colección Lucide vía `@iconify/vue`, centralizados en `shared/constants/icons.ts`

---

*Documentación generada el 17 de julio de 2026 — Oxígeno Sarita*
