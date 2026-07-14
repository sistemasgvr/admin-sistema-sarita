import { ref, watch } from 'vue'

export function useDebouncedSearch(onSearch: () => void, delay = 350) {
  const buscar = ref('')
  let timeout: ReturnType<typeof setTimeout> | undefined

  watch(buscar, () => {
    clearTimeout(timeout)
    timeout = setTimeout(onSearch, delay)
  })

  return buscar
}
