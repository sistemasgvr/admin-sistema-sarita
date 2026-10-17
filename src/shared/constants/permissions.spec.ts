import { describe, expect, it } from 'vitest'
import { PermisoBanderas, hasPermissionFlag, canAccessByPermissions } from './permissions'

describe('permisos de la interfaz', () => {
  it.each(Object.values(PermisoBanderas))('%s exige permiso explícito o auth.todo', permission => {
    expect(hasPermissionFlag([], permission)).toBe(false)
    expect(hasPermissionFlag([permission], permission)).toBe(true)
    expect(hasPermissionFlag(['auth.todo'], permission)).toBe(true)
  })
  it('registrar gastos no concede edición de catálogos ni apertura o cierre de caja', () => {
    const permissions = [PermisoBanderas.CAJA_VER, PermisoBanderas.CAJA_REGISTRAR_GASTO]
    expect(hasPermissionFlag(permissions, PermisoBanderas.CATALOGOS_EDITAR)).toBe(false)
    expect(hasPermissionFlag(permissions, PermisoBanderas.CAJA_ABRIR)).toBe(false)
    expect(hasPermissionFlag(permissions, PermisoBanderas.CAJA_CERRAR)).toBe(false)
    expect(canAccessByPermissions(permissions, { permission: PermisoBanderas.CAJA_VER })).toBe(true)
  })
  it('las alternativas de acceso permiten solo los permisos indicados', () => {
    const options = { anyPermission: [PermisoBanderas.CAJA_VER, PermisoBanderas.COMPRAS_LISTAR] }
    expect(canAccessByPermissions([], options)).toBe(false)
    expect(canAccessByPermissions([PermisoBanderas.CAJA_VER], options)).toBe(true)
    expect(canAccessByPermissions([PermisoBanderas.COMPRAS_LISTAR], options)).toBe(true)
    expect(canAccessByPermissions([PermisoBanderas.CLIENTES_LISTAR], options)).toBe(false)
  })
})
