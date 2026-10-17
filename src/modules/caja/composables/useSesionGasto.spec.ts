import { effectScope, nextTick, ref } from 'vue'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { useSesionGasto } from './useSesionGasto'
import type { CajaSesion } from '../interfaces/caja.interface'

const state = vi.hoisted(() => ({ options: null as { enabled: { value: boolean } } | null }))
const data = ref<{ data: CajaSesion[] }>({ data: [] })
const isFetching = ref(false)
const isError = ref(false)
vi.mock('@tanstack/vue-query', () => ({ useQuery: (options: { enabled: { value: boolean } }) => {
  state.options = options
  return { data, isFetching, isError }
} }))
vi.mock('../services/caja.service', () => ({ cajaService: { listarSesiones: vi.fn() } }))
let scope: ReturnType<typeof effectScope>
const sesion = (id: number, fecha = '2026-10-17', estadoCaja = 'ABIERTA'): CajaSesion => ({
  id, fecha, estadoCaja, idSucursal: id, nombreSucursal: `Sucursal ${id}`, montoInicial: 0,
})
function mount(requerida = true) {
  const fecha = ref<string | undefined>('2026-10-17')
  const open = ref(true)
  scope = effectScope()
  const result = scope.run(() => useSesionGasto(fecha, ref(requerida), open))!
  return { ...result, open, fecha }
}
beforeEach(() => { data.value = { data: [] }; isFetching.value = false; isError.value = false })
afterEach(() => scope?.stop())
describe('selección de caja para gastos', () => {
  it('selecciona la única caja abierta y conserva su sucursal', () => {
    data.value.data = [sesion(11)]
    const r = mount()
    expect(r.seleccion.value?.idSucursal).toBe(11)
    expect(r.valida.value).toBe(true)
  })
  it('exige elegir cuando hay varias sucursales', async () => {
    data.value.data = [sesion(11), sesion(12)]
    const r = mount()
    expect(r.valida.value).toBe(false)
    r.idSesion.value = 12
    await nextTick()
    expect(r.seleccion.value?.idSucursal).toBe(12)
    expect(r.valida.value).toBe(true)
  })
  it('no permite cajas cerradas, fechas anteriores ni ausencia de caja', () => {
    data.value.data = [sesion(11, '2026-10-16'), sesion(12, '2026-10-17', 'CERRADA')]
    const r = mount()
    expect(r.options.value).toEqual([])
    expect(r.valida.value).toBe(false)
  })
  it('bloquea el envío durante consulta o error aunque haya datos en caché', async () => {
    data.value.data = [sesion(11)]
    const r = mount()
    isFetching.value = true
    expect(r.valida.value).toBe(false)
    isFetching.value = false
    isError.value = true
    expect(r.valida.value).toBe(false)
    await nextTick()
  })
  it('descarta selección de una sesión que se cierra', async () => {
    data.value.data = [sesion(11)]
    const r = mount()
    data.value.data = []
    await nextTick()
    expect(r.valida.value).toBe(false)
    expect(r.idSesion.value).toBeNull()
  })
  it('no consulta ni exige otra caja en edición o con contexto de Caja del día', () => {
    const r = mount(false)
    expect(state.options!.enabled.value).toBe(false)
    expect(r.valida.value).toBe(true)
  })
  it('descarta la selección al cambiar la fecha', async () => {
    data.value.data = [sesion(11)]
    const r = mount()
    r.fecha.value = '2026-10-18'
    await nextTick()
    expect(r.valida.value).toBe(false)
    expect(r.idSesion.value).toBeNull()
  })
})
