# Admin Sistema Sarita

Panel administrativo de **Oxígeno Sarita**. Frontend en Vue 3 + TypeScript + Vite, con arquitectura modular, Pinia, TanStack Query y componentes compartidos alineados al template TailAdmin.

## Requisitos

- Node.js 20+
- API backend en ejecución (`api-sistema-sarita`)
- Variable de entorno: `VITE_API_BASE_URL` (ej. `http://localhost:3000`)

```bash
npm install
npm run dev
npm run build
```

---

## Estructura general

```
src/
├── modules/          # Funcionalidad por dominio (usuarios, roles, clientes…)
├── shared/           # Código reutilizable entre módulos
│   ├── api/          # Cliente HTTP (apiGet, apiPost, apiGetPaginated…)
│   ├── components/   # UI compartida (AppTable, AppModal, AppInput…)
│   ├── composables/  # Lógica reutilizable (toast, clases de formulario)
│   ├── constants/    # Permisos, iconos
│   ├── interfaces/   # Tipos transversales (paginación, tabla, formulario)
│   └── utils/        # Helpers (fechas, paginación)
├── router/           # Router principal y guards de auth/permisos
└── assets/           # Estilos globales (Tailwind, utilidades de formulario)
```

El módulo `admin` es especial: contiene el layout (sidebar, header), menú y ensamblado de rutas hijas. No representa un dominio de negocio.

---

## Estructura de un módulo

Cada módulo de negocio vive en `src/modules/<nombre>/` y sigue esta convención:

```
src/modules/<nombre>/
├── interfaces/       # Tipos TypeScript del dominio (entidades, payloads, filtros)
├── services/         # Llamadas HTTP al backend (sin lógica de UI)
├── constants/        # Query keys de TanStack Query
├── composables/      # Hooks de datos (useQuery, useMutation)
├── components/       # Componentes propios del módulo (modales, formularios)
├── views/            # Páginas / pantallas completas
└── routes.ts         # Rutas del módulo bajo /admin
```

### Propósito de cada carpeta

| Carpeta | Responsabilidad |
|---------|-----------------|
| **`interfaces/`** | Contratos de datos: entidades que devuelve la API, DTOs de creación/edición, filtros de listado y tipos auxiliares (`FormMode`, asignaciones, etc.). Deben reflejar el backend. |
| **`services/`** | Capa de acceso a la API. Solo funciones async que llaman a `apiGet`, `apiPost`, `apiPatch`, `apiDelete` o `apiGetPaginated`. Sin estado ni UI. |
| **`constants/`** | Claves de caché para TanStack Query (`queryKeys`). Centralizan invalidaciones al mutar datos. |
| **`composables/`** | Lógica reactiva reutilizable dentro del módulo: `useXxxQuery` (lectura) y `useXxxMutation` (escritura), con toasts e invalidación de caché. |
| **`components/`** | Piezas de UI del dominio que no son una ruta completa: modales de formulario, selectores, sub-tablas, etc. Reutilizan componentes de `@/shared/components`. |
| **`views/`** | Vistas enlazadas al router: listados, detalle, dashboards del módulo. Orquestan composables, permisos y componentes. |
| **`routes.ts`** | Define las rutas hijas de `/admin`, con `meta.title`, `meta.permission` y lazy import de la vista. |

### Servicios adicionales

Si un módulo consume endpoints relacionados pero distintos (ej. `usuarios-roles` dentro de `usuarios`), se añade otro archivo en `services/` (`usuarios-roles.service.ts`) y composables asociados, sin crear un módulo separado salvo que el dominio lo justifique.

### Referencia: módulo `usuarios`

```
usuarios/
├── interfaces/usuario.interface.ts
├── services/
│   ├── usuarios.service.ts
│   └── usuarios-roles.service.ts
├── constants/usuariosQueryKeys.ts
├── composables/
│   ├── useUsuariosQuery.ts
│   ├── useUsuarioMutations.ts
│   ├── useUsuarioRolesQuery.ts
│   └── useUsuarioRolMutations.ts
├── components/UsuarioFormModal.vue
├── views/UsuariosListView.vue
└── routes.ts
```

---

## Flujo para integrar un nuevo módulo (desde el backend)

Sigue estos pasos cuando el backend ya expone endpoints (controlador NestJS + permisos en BD).

### 1. Revisar el backend

- URL base del recurso (ej. `/auth/usuarios`, `/clientes`)
- DTOs de entrada/salida y campos de paginación (`buscar`, `pagina`, `limite`)
- Permisos requeridos (`modulo.listar`, `modulo.crear`, etc.)
- Respuesta paginada: `{ data: T[], meta: { pagina, limite, total } }`

### 2. Registrar permisos en el frontend

En `src/shared/constants/permissions.ts`, agregar las banderas que existan en `auth_permisos` de la BD:

```ts
export const PermisoBanderas = {
  // ...
  CLIENTES_LISTAR: 'clientes.listar',
  CLIENTES_CREAR: 'clientes.crear',
} as const
```

### 3. Crear el módulo

```bash
src/modules/clientes/
├── interfaces/cliente.interface.ts
├── services/clientes.service.ts
├── constants/clientesQueryKeys.ts
├── composables/
│   ├── useClientesQuery.ts
│   └── useClienteMutations.ts
├── components/ClienteFormModal.vue   # si aplica
├── views/ClientesListView.vue
└── routes.ts
```

**`interfaces/`** — tipos alineados a la API.

**`services/`** — ejemplo de listado paginado:

```ts
import { apiGetPaginated, apiPost } from '@/shared/api/apiClient'

export const clientesService = {
  listar(filters = {}) {
    return apiGetPaginated<Cliente>('/clientes', { params: filters })
  },
  crear(payload: CreateClientePayload) {
    return apiPost<Cliente>('/clientes', payload)
  },
}
```

**`constants/`** — query keys:

```ts
export const clientesQueryKeys = {
  all: ['clientes'] as const,
  lists: () => [...clientesQueryKeys.all, 'list'] as const,
  list: (filters: ClienteListFilters) =>
    [...clientesQueryKeys.lists(), filters] as const,
}
```

**`composables/`** — lectura y escritura con TanStack Query, toasts e invalidación (ver `useUsuariosQuery` / `useUsuarioMutations`).

**`views/`** — pantalla con `AppTable`, `AppPagination`, `AppInput`, permisos vía `useAuthStore().hasPermission()` y modales para crear/editar.

**`routes.ts`**:

```ts
export const clientesRoutes: RouteRecordRaw[] = [
  {
    path: 'clientes',
    name: 'admin-clientes',
    component: () => import('@/modules/clientes/views/ClientesListView.vue'),
    meta: {
      title: 'Clientes',
      module: 'clientes',
      permission: PermisoBanderas.CLIENTES_LISTAR,
    },
  },
]
```

### 4. Registrar rutas

En `src/modules/admin/routes.ts`:

```ts
import { clientesRoutes } from '@/modules/clientes/routes'

const moduleRoutes = [
  // ...
  ...clientesRoutes,
]
```

El guard en `src/router/index.ts` ya valida `meta.permission` automáticamente.

### 5. Agregar al menú lateral

En `src/modules/admin/config/menu.ts`:

```ts
{
  icon: ICONS.users,
  name: 'Clientes',
  path: '/admin/clientes',
  permission: PermisoBanderas.CLIENTES_LISTAR,
}
```

Si el icono no existe, añadirlo en `src/shared/constants/icons.ts` (colección Lucide vía Iconify).

### 6. Proteger acciones en la UI

En la vista, condicionar botones con permisos granulares:

```ts
const canCreate = computed(() =>
  authStore.hasPermission(PermisoBanderas.CLIENTES_CREAR),
)
```

No basta con ocultar el menú: cada acción (crear, editar, eliminar) debe validar su permiso.

### 7. Verificar

```bash
npm run build
```

Probar con un usuario que tenga los permisos y otro que no, para confirmar menú, rutas y botones.

---

## Componentes compartidos

Importar desde `@/shared/components`:

| Componente | Uso |
|------------|-----|
| `AppTable` | Listados con columnas, slots `#actions`, `#toolbar`, `#footer` |
| `AppPagination` | Paginación sincronizada con `meta` de la API |
| `AppModal` | Diálogos con header, body con scroll y footer |
| `AppInput`, `AppTextarea`, `AppSelect`, `AppCheckbox` | Formularios |
| `AppBadge`, `AppBadgeList` | Etiquetas (roles, estados) |

Cliente HTTP: `@/shared/api/apiClient` — el token JWT se inyecta automáticamente.

---

## Plantilla UI

Referencia visual en `template-tail-admin/`. Los componentes de producción están adaptados en `src/shared/components/`.
