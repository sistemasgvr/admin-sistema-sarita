import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PaginatedResult } from '@/shared/api/interfaces/api.interface'
vi.mock('@/shared/utils/exportExcel', () => ({ downloadExcel: vi.fn() }))
vi.mock('@/shared/composables/useToast', () => ({ toastInfo: vi.fn() }))
import {
  columnasListadoExcel,
  exportarFilasExcel,
  exportarListadoExcel,
  obtenerFilasExcel,
} from './exportarListadoExcel'
import { downloadExcel } from './exportExcel'
import { toastInfo } from '@/shared/composables/useToast'

function page<T>(data: T[], total: number, limite: number): PaginatedResult<T[]> {
  return { data, meta: { pagina: 1, total, limite } }
}

const mockList = <T>() =>
  vi.fn<(filters: Record<string, unknown>) => Promise<PaginatedResult<T[]>>>()

describe('reportes simples de listados', () => {
  beforeEach(() => vi.clearAllMocks())

  it('recorre todas las páginas y respeta un límite reducido por el servidor', async () => {
    const listar = mockList<{ id: number }>()
      .mockResolvedValueOnce(page([{ id: 1 }, { id: 2 }], 5, 2))
      .mockResolvedValueOnce(page([{ id: 3 }, { id: 4 }], 5, 2))
      .mockResolvedValueOnce(page([{ id: 5 }], 5, 2))
    const rows = await obtenerFilasExcel(listar, {
      buscar: 'gastos',
      fechaDesde: '2026-10-01',
      pagina: 8,
      limite: 10,
    })
    expect(rows.map((r) => r.id)).toEqual([1, 2, 3, 4, 5])
    expect(listar.mock.calls.map(([f]) => f)).toEqual([
      { buscar: 'gastos', fechaDesde: '2026-10-01', pagina: 1, limite: 500 },
      { buscar: 'gastos', fechaDesde: '2026-10-01', pagina: 2, limite: 2 },
      { buscar: 'gastos', fechaDesde: '2026-10-01', pagina: 3, limite: 2 },
    ])
  })

  it('usa tamano en retenciones y conserva empresa, proveedor y fechas', async () => {
    const listar = mockList<{ numero: string }>()
      .mockResolvedValueOnce(page([{ numero: '000001' }], 2, 1))
      .mockResolvedValueOnce(page([{ numero: '000002' }], 2, 1))
    await exportarListadoExcel({
      nombre: 'Retenciones',
      listar,
      filtros: { idEmpresa: 9, idProveedor: 7, fechaHasta: '2026-10-16', pagina: 4, tamano: 20 },
      paginacion: 'tamano',
      campos: [['numero', 'Número']],
    })
    expect(listar).toHaveBeenNthCalledWith(2, {
      idEmpresa: 9,
      idProveedor: 7,
      fechaHasta: '2026-10-16',
      pagina: 2,
      tamano: 1,
    })
    expect(listar.mock.calls.every(([f]) => !('limite' in f))).toBe(true)
    expect(downloadExcel).toHaveBeenCalledWith(
      expect.objectContaining({ rows: [{ numero: '000001' }, { numero: '000002' }] }),
    )
  })

  it('no mezcla filtros si el usuario cambia la pantalla durante la descarga', async () => {
    const filters = { buscar: 'oxígeno', pagina: 5, limite: 10 }
    const listar = mockList<{ id: number }>()
      .mockImplementationOnce(async () => {
        filters.buscar = 'combustible'
        return page([{ id: 1 }], 2, 1)
      })
      .mockResolvedValueOnce(page([{ id: 2 }], 2, 1))
    await obtenerFilasExcel(listar, filters)
    expect(listar.mock.calls[1]![0].buscar).toBe('oxígeno')
    expect(filters.pagina).toBe(5)
  })

  it('cancela la descarga ante una página fallida', async () => {
    const listar = mockList<{ id: number }>()
      .mockResolvedValueOnce(page([{ id: 1 }], 2, 1))
      .mockRejectedValueOnce(new Error('Sin conexión'))
    await expect(
      exportarListadoExcel({
        nombre: 'Gastos de caja',
        listar,
        filtros: {},
        campos: [['id', 'ID']],
      }),
    ).rejects.toThrow('Sin conexión')
    expect(downloadExcel).not.toHaveBeenCalled()
  })

  it('rechaza resultados parciales aunque todas las solicitudes respondan', async () => {
    const listar = mockList<{ id: number }>()
      .mockResolvedValueOnce(page([{ id: 1 }], 2, 1))
      .mockResolvedValueOnce(page([], 2, 1))
    await expect(
      exportarListadoExcel({ nombre: 'Usuarios', listar, filtros: {}, campos: [['id', 'ID']] }),
    ).rejects.toThrow('incompleto')
    expect(downloadExcel).not.toHaveBeenCalled()
  })

  it('respeta los filtros locales de la vista sobre todas las páginas', async () => {
    const listar = mockList<{ tipo: string }>().mockResolvedValue(
      page([{ tipo: '01' }, { tipo: 'NV' }], 2, 500),
    )
    await exportarListadoExcel({
      nombre: 'Comprobantes',
      listar,
      filtros: {},
      campos: [['tipo', 'Tipo']],
      seleccionar: (r) => r.tipo !== 'NV',
    })
    expect(downloadExcel).toHaveBeenCalledWith(expect.objectContaining({ rows: [{ tipo: '01' }] }))
  })

  it('no descarga un libro vacío', async () => {
    await exportarFilasExcel('Vacío', [], [])
    expect(toastInfo).toHaveBeenCalledOnce()
    expect(downloadExcel).not.toHaveBeenCalled()
  })

  it('conserva documentos/códigos, convierte montos y no incluye campos sin seleccionar', () => {
    const row = {
      numero: '000042',
      documento: '00123456789',
      monto: '125.40',
      estado: false,
      aprobado: true,
      roles: [{ nombre: 'Operador', interno: 'no exportar' }],
      secreto: 'no exportar',
    }
    const columns = columnasListadoExcel<typeof row>([
      ['numero', 'Número'],
      ['documento', 'Documento'],
      ['monto', 'Monto', 'numero'],
      ['estado', 'Estado', 'estado'],
      ['aprobado', 'Aprobado'],
      ['roles', 'Roles'],
    ])
    expect(Object.fromEntries(columns.map((c) => [c.key, c.value(row)]))).toEqual({
      numero: '000042',
      documento: '00123456789',
      monto: 125.4,
      estado: 'Inactivo',
      aprobado: 'Sí',
      roles: 'Operador',
    })
  })

  it('deja vacíos los nulos y no convierte texto inválido en NaN', () => {
    const columns = columnasListadoExcel<{ monto: string | null }>([['monto', 'Monto', 'numero']])
    expect(columns[0]!.value({ monto: null })).toBe('')
    expect(columns[0]!.value({ monto: 'Sin dato' })).toBe('Sin dato')
  })
})
