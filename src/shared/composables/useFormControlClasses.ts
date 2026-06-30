import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import type { FormControlState } from '@/shared/interfaces/form.interface'

export type { FormControlState }

export function useFormControlClasses(
  state: MaybeRefOrGetter<FormControlState> = 'default',
  options?: MaybeRefOrGetter<{ textarea?: boolean; file?: boolean; hasTrailingIcon?: boolean }>,
) {
  return computed(() => {
    const currentState = toValue(state)
    const { textarea = false, file = false, hasTrailingIcon = false } = toValue(options) ?? {}

    return [
      file ? 'form-control form-file' : textarea ? 'app-form-textarea' : 'form-control',
      currentState === 'error' ? 'form-control-error' : '',
      currentState === 'success' ? 'form-control-success' : '',
      hasTrailingIcon ? 'pr-11' : '',
    ]
      .filter(Boolean)
      .join(' ')
  })
}
