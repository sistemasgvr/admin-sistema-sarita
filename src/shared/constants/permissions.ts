/**
 * Banderas de permiso. Deben coincidir con auth_permisos.nombre en la BD.
 * auth.todo = acceso total (superadmin).
 */
export const PermisoBanderas = {
  AUTH_TODO: 'auth.todo',

  USUARIOS_LISTAR: 'usuarios.listar',
  USUARIOS_VER: 'usuarios.ver',
  USUARIOS_CREAR: 'usuarios.crear',
  USUARIOS_EDITAR: 'usuarios.editar',
  USUARIOS_ELIMINAR: 'usuarios.eliminar',

  ROLES_LISTAR: 'roles.listar',
  ROLES_VER: 'roles.ver',
  ROLES_CREAR: 'roles.crear',
  ROLES_EDITAR: 'roles.editar',
  ROLES_ELIMINAR: 'roles.eliminar',

  PERMISOS_LISTAR: 'permisos.listar',
  PERMISOS_VER: 'permisos.ver',
  PERMISOS_CREAR: 'permisos.crear',
  PERMISOS_EDITAR: 'permisos.editar',
  PERMISOS_ELIMINAR: 'permisos.eliminar',

  USUARIOS_ROLES_LISTAR: 'usuarios_roles.listar',
  USUARIOS_ROLES_ASIGNAR: 'usuarios_roles.asignar',
  USUARIOS_ROLES_QUITAR: 'usuarios_roles.quitar',

  ROLES_PERMISOS_LISTAR: 'roles_permisos.listar',
  ROLES_PERMISOS_ASIGNAR: 'roles_permisos.asignar',
  ROLES_PERMISOS_QUITAR: 'roles_permisos.quitar',

  SESIONES_LISTAR: 'sesiones.listar',
  SESIONES_VER: 'sesiones.ver',
  SESIONES_CREAR: 'sesiones.crear',
  SESIONES_CERRAR: 'sesiones.cerrar',

  CLIENTES_LISTAR: 'clientes.listar',
} as const

export type PermissionBandera = (typeof PermisoBanderas)[keyof typeof PermisoBanderas]

export function hasPermissionFlag(permisos: string[], permission?: string): boolean {
  if (!permission) return true
  return permisos.includes(PermisoBanderas.AUTH_TODO) || permisos.includes(permission)
}
