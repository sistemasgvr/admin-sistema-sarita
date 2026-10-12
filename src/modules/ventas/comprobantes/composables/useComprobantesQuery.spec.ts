import { effectScope, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useComprobantesQuery } from './useComprobantesQuery'
import { comprobantesService } from '../services/comprobantes.service'

const invalidate = vi.fn().mockResolvedValue(undefined)
const data = ref({ data: [{ id: 69, codigo_tipo_comprobante: '01', estado_envio: 'EN_CURSO' }] })
const updatedAt = ref(0)
vi.mock('@tanstack/vue-query', () => ({
  keepPreviousData: vi.fn(),
  useQuery: () => ({ data, dataUpdatedAt: updatedAt }),
  useQueryClient: () => ({ invalidateQueries: invalidate }),
}))
vi.mock('../services/comprobantes.service', () => ({
  comprobantesService: { listar: vi.fn(), sincronizarValidez: vi.fn(), emitir: vi.fn() },
}))

let scope: ReturnType<typeof effectScope>
async function refresh() { updatedAt.value++; await nextTick(); await nextTick() }
function mount(permission = true) {
  scope = effectScope()
  scope.run(() => useComprobantesQuery(ref({}), ref(false), ref(permission)))
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-12T17:00:00Z'))
  vi.clearAllMocks()
  data.value = { data: [{ id: 69, codigo_tipo_comprobante: '01', estado_envio: 'EN_CURSO' }] }
  updatedAt.value = 0
})
afterEach(() => { scope?.stop(); vi.useRealTimers() })

describe('reconciliación automática de emisiones', () => {
  it('refresca la lista al confirmar aceptación sin emitir nuevamente', async () => {
    vi.mocked(comprobantesService.sincronizarValidez).mockResolvedValue({ estadoActualizado: true } as never)
    mount()
    await refresh()
    expect(comprobantesService.sincronizarValidez).toHaveBeenCalledWith(69)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['comprobantes'] })
    expect(comprobantesService.emitir).not.toHaveBeenCalled()
  })

  it('respeta 15 segundos entre consultas cuando SUNAT aún no informa', async () => {
    data.value.data[0]!.estado_envio = 'POR_CONFIRMAR'
    vi.mocked(comprobantesService.sincronizarValidez).mockResolvedValue({ estadoActualizado: false } as never)
    mount()
    await refresh()
    vi.setSystemTime(Date.now() + 3000)
    await refresh()
    expect(comprobantesService.sincronizarValidez).toHaveBeenCalledTimes(1)
    vi.setSystemTime(Date.now() + 12000)
    await refresh()
    expect(comprobantesService.sincronizarValidez).toHaveBeenCalledTimes(2)
    expect(invalidate).not.toHaveBeenCalled()
    expect(comprobantesService.emitir).not.toHaveBeenCalled()
  })

  it('no modifica el estado cuando falla la consulta', async () => {
    vi.mocked(comprobantesService.sincronizarValidez).mockRejectedValue(new Error('SUNAT temporalmente no disponible'))
    mount()
    await refresh()
    expect(data.value.data[0]!.estado_envio).toBe('EN_CURSO')
    expect(invalidate).not.toHaveBeenCalled()
    expect(comprobantesService.emitir).not.toHaveBeenCalled()
  })

  it('no consulta sin permiso y deja de consultar al salir de la página', async () => {
    mount(false)
    await refresh()
    expect(comprobantesService.sincronizarValidez).not.toHaveBeenCalled()
    scope.stop()
    mount()
    scope.stop()
    await refresh()
    expect(comprobantesService.sincronizarValidez).not.toHaveBeenCalled()
  })

  it('evita consultas concurrentes y termina al desaparecer en curso', async () => {
    let resolve!: (value: never) => void
    vi.mocked(comprobantesService.sincronizarValidez).mockReturnValue(new Promise(done => { resolve = done }))
    mount()
    await refresh()
    vi.setSystemTime(Date.now() + 30000)
    await refresh()
    expect(comprobantesService.sincronizarValidez).toHaveBeenCalledTimes(1)
    resolve({ estadoActualizado: true } as never)
    await nextTick(); await nextTick()
    data.value.data[0]!.estado_envio = ''
    await refresh()
    expect(comprobantesService.sincronizarValidez).toHaveBeenCalledTimes(1)
  })
})
