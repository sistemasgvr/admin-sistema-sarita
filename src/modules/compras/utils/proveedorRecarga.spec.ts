import { describe, expect, it } from 'vitest'
import { debeLimpiarRecargaPorProveedor } from './proveedorRecarga'

describe('proveedor de una compra desde recarga externa', () => {
  it('conserva la orden al seleccionar el mismo proveedor aunque cambie el tipo del ID', () => {
    expect(debeLimpiarRecargaPorProveedor(72, '72', 72)).toBe(false)
    expect(debeLimpiarRecargaPorProveedor('72', 72, undefined)).toBe(false)
  })

  it('conserva la orden al completar su proveedor por primera vez', () => {
    expect(debeLimpiarRecargaPorProveedor(72, '', 72)).toBe(false)
    expect(debeLimpiarRecargaPorProveedor(72, '', null)).toBe(false)
  })

  it('desvincula la orden si el nuevo proveedor es distinto del de la orden', () => {
    expect(debeLimpiarRecargaPorProveedor(80, 72, 72)).toBe(true)
    expect(debeLimpiarRecargaPorProveedor(80, '', 72)).toBe(true)
    expect(debeLimpiarRecargaPorProveedor(80, 72, null)).toBe(true)
  })

  it('desvincula la orden cuando el usuario limpia el proveedor', () => {
    expect(debeLimpiarRecargaPorProveedor('', 72, 72)).toBe(true)
    expect(debeLimpiarRecargaPorProveedor(null, 72, null)).toBe(true)
  })
})
