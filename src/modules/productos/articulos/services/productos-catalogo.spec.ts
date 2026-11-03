import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ apiGetPaginated: vi.fn() }))
vi.mock('@/shared/api/apiClient', () => ({
  ...api, apiGet: vi.fn(), apiPost: vi.fn(), apiPatch: vi.fn(), apiDelete: vi.fn(),
  apiGetBlob: vi.fn(), apiPostBlob: vi.fn(),
}))
import { productosService } from './productos.service'
import { stockService } from '@/modules/productos/stock/services/stock.service'
import { stockGasService } from '@/modules/balones/stock-gas/services/stock-gas.service'

beforeEach(() => vi.clearAllMocks())

describe('productos y stock usados por los formularios', () => {
  for (const [nombre, servicio, endpoint] of [
    ['productos', productosService, '/productos'],
    ['stock de salida', stockService, '/productos/stock'],
    ['stock de gas del POS', stockGasService, '/balones/stock-gas'],
  ] as const) {
    it(`${nombre}: recupera todas las páginas sin perder el almacén`, async () => {
      api.apiGetPaginated.mockImplementation(async (_url, { params }) => ({
        data: [{ id: params.pagina }], meta: { pagina: params.pagina, limite: 1, total: 3 },
      }))
      const signal = new AbortController().signal
      const resultado = await servicio.listarCatalogo({ idAlmacen: 8 }, signal)
      expect(resultado.data).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
      expect(api.apiGetPaginated).toHaveBeenCalledTimes(3)
      for (const [url, config] of api.apiGetPaginated.mock.calls) {
        expect(url).toBe(endpoint)
        expect(config.params.idAlmacen).toBe(8)
        expect(config.signal).toBe(signal)
      }
    })
  }

  it('el listado principal de productos conserva su paginación visible', async () => {
    api.apiGetPaginated.mockResolvedValue({ data: [{ id: 2 }], meta: { pagina: 2, limite: 10, total: 615 } })
    await productosService.listar({ pagina: 2, limite: 10 })
    expect(api.apiGetPaginated).toHaveBeenCalledTimes(1)
    expect(api.apiGetPaginated).toHaveBeenCalledWith('/productos', { params: { incluirImagenes: false, pagina: 2, limite: 10 } })
  })
})
