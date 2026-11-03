import { describe, expect, it, vi } from 'vitest'
import { cargarCatalogoCompleto } from './cargarCatalogoCompleto'

describe('catálogos completos para selección', () => {
  it('incluye productos posteriores al 500 y respeta filtros y tamaño efectivo del servidor', async () => {
    const todos = Array.from({ length: 615 }, (_, id) => ({ id: id + 1 }))
    const listar = vi.fn(async (f: { pagina?: number; limite?: number; esGas?: boolean; idAlmacen?: number; buscar?: string }) => {
      const limite = Math.min(f.limite!, 100)
      const inicio = (f.pagina! - 1) * limite
      return { data: todos.slice(inicio, inicio + limite), meta: { pagina: f.pagina!, limite, total: todos.length } }
    })
    const filtros = { pagina: 9, limite: 20, esGas: false, idAlmacen: 7, buscar: 'argón' }
    const resultado = await cargarCatalogoCompleto(listar, filtros)
    expect(resultado.data).toEqual(todos)
    expect(listar).toHaveBeenCalledTimes(7)
    for (const [f] of listar.mock.calls) {
      expect(f).toMatchObject({ esGas: false, idAlmacen: 7, buscar: 'argón' })
    }
    expect(listar.mock.calls[1]![0]).toMatchObject({ pagina: 2, limite: 100 })
    expect(filtros).toMatchObject({ pagina: 9, limite: 20 })
  })

  it('no publica un catálogo parcial cuando falla una página', async () => {
    const listar = vi.fn()
      .mockResolvedValueOnce({ data: [{ id: 1 }], meta: { pagina: 1, limite: 1, total: 2 } })
      .mockRejectedValueOnce(new Error('Sin conexión'))
    await expect(cargarCatalogoCompleto(listar, {})).rejects.toThrow('Sin conexión')
  })

  it('detecta una página vacía antes de completar el total', async () => {
    const listar = vi.fn()
      .mockResolvedValueOnce({ data: [{ id: 1 }], meta: { pagina: 1, limite: 1, total: 2 } })
      .mockResolvedValueOnce({ data: [], meta: { pagina: 2, limite: 1, total: 2 } })
    await expect(cargarCatalogoCompleto(listar, {})).rejects.toThrow('catálogo completo')
  })

  it('acepta un catálogo vacío sin pedir páginas adicionales', async () => {
    const listar = vi.fn().mockResolvedValue({ data: [], meta: { pagina: 1, limite: 200, total: 0 } })
    expect((await cargarCatalogoCompleto(listar, {})).data).toEqual([])
    expect(listar).toHaveBeenCalledTimes(1)
  })

  it('cancela la carga anterior antes de pedir otra página al cambiar de búsqueda o almacén', async () => {
    const controller = new AbortController()
    const listar = vi.fn(async () => {
      controller.abort()
      return { data: [{ id: 1 }], meta: { pagina: 1, limite: 1, total: 2 } }
    })
    await expect(cargarCatalogoCompleto(listar, {}, controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
    expect(listar).toHaveBeenCalledTimes(1)
  })
})
