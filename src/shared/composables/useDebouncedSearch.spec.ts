import { effectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebouncedSearch } from './useDebouncedSearch'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}

let scope: ReturnType<typeof effectScope>
function mount(fn: (term: string) => Promise<string[]>, minChars = 0) {
  scope = effectScope()
  const onError = vi.fn()
  const search = scope.run(() => useDebouncedSearch(fn, { minChars, onError }))!
  return { ...search, onError }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  scope.stop()
  vi.useRealTimers()
})

describe('búsquedas sin interrumpir la escritura', () => {
  it('agrupa pulsaciones y mantiene resultados durante la siguiente búsqueda', async () => {
    const request = deferred<string[]>()
    const fn = vi.fn().mockResolvedValueOnce(['reciente']).mockReturnValue(request.promise)
    const state = mount(fn)
    state.search('', true)
    await Promise.resolve()
    state.search('s')
    await vi.advanceTimersByTimeAsync(200)
    state.search('se')
    await vi.advanceTimersByTimeAsync(200)
    state.search('sefabin')
    await vi.advanceTimersByTimeAsync(350)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('sefabin')
    expect(state.results.value).toEqual(['reciente'])
    expect(state.loading.value).toBe(true)
    request.resolve(['SEFABIN'])
    await Promise.resolve()
    expect(state.results.value).toEqual(['SEFABIN'])
    expect(state.loading.value).toBe(false)
  })

  it('invalida respuestas desde la pulsación, incluso antes del próximo envío', async () => {
    const old = deferred<string[]>()
    const fn = vi.fn().mockReturnValueOnce(old.promise).mockResolvedValue(['nuevo'])
    const state = mount(fn)
    state.search('anterior', true)
    state.search('nuevo')
    old.resolve(['anterior'])
    await Promise.resolve()
    expect(state.results.value).toEqual([])
    expect(state.loading.value).toBe(true)
    await vi.advanceTimersByTimeAsync(350)
    expect(state.results.value).toEqual(['nuevo'])
  })

  it('ignora errores antiguos sin borrar resultados ni mostrar alertas', async () => {
    const old = deferred<string[]>()
    const fn = vi.fn().mockReturnValueOnce(old.promise).mockResolvedValue(['nuevo'])
    const state = mount(fn)
    state.search('anterior', true)
    state.search('nuevo', true)
    await Promise.resolve()
    old.reject(new Error('consulta antigua'))
    await Promise.resolve()
    expect(state.results.value).toEqual(['nuevo'])
    expect(state.onError).not.toHaveBeenCalled()
    expect(state.loading.value).toBe(false)
  })

  it('al borrar por debajo del mínimo descarta la respuesta pendiente', async () => {
    const request = deferred<string[]>()
    const state = mount(() => request.promise, 3)
    state.search('cliente', true)
    state.search('c')
    request.resolve(['cliente'])
    await Promise.resolve()
    expect(state.results.value).toEqual([])
    expect(state.loading.value).toBe(false)
  })

  it('cancela temporizadores al cerrar o desmontar e ignora respuestas al reabrir', async () => {
    const old = deferred<string[]>()
    const fn = vi.fn().mockReturnValueOnce(old.promise).mockResolvedValue(['reabierto'])
    const state = mount(fn)
    state.search('antes', true)
    state.cancel()
    state.search('reabierto', true)
    await Promise.resolve()
    old.resolve(['antes'])
    await Promise.resolve()
    expect(state.results.value).toEqual(['reabierto'])
    state.search('pendiente')
    state.cancel()
    await vi.advanceTimersByTimeAsync(350)
    state.search('desmontado')
    scope.stop()
    await vi.advanceTimersByTimeAsync(350)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('publica errores vigentes y termina el estado de carga', async () => {
    const error = new Error('sin conexión')
    const state = mount(vi.fn().mockRejectedValue(error))
    state.search('venta', true)
    await Promise.resolve()
    expect(state.onError).toHaveBeenCalledWith(error)
    expect(state.loading.value).toBe(false)
  })
})
