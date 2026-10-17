import { onScopeDispose, ref, shallowRef } from 'vue'

/** Conserva los resultados mientras busca y solo publica la consulta vigente. */
export function useDebouncedSearch<T>(
  searchFn: (term: string) => Promise<T[]>,
  options: {
    debounceMs?: number
    minChars?: number
    onError?: (error: unknown) => void
  } = {},
) {
  const results = shallowRef<T[]>([])
  const loading = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  let version = 0

  function cancel() {
    clearTimeout(timer)
    version++
    loading.value = false
  }

  function search(value: string, immediate = false) {
    cancel()
    const term = value.trim()
    const current = version
    if (term.length < (options.minChars ?? 0)) {
      results.value = []
      return
    }

    loading.value = true
    const run = async () => {
      try {
        const response = await searchFn(term)
        if (current === version) results.value = response
      } catch (error) {
        if (current !== version) return
        results.value = []
        options.onError?.(error)
      } finally {
        if (current === version) loading.value = false
      }
    }

    if (immediate) void run()
    else timer = setTimeout(() => void run(), options.debounceMs ?? 350)
  }

  onScopeDispose(cancel)
  return { results, loading, search, cancel }
}
