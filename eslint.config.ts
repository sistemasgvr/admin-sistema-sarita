import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', 'template-tail-admin/**'],
  },

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  skipFormatting,
  {
    name: 'app/rules',
    rules: {
      // Un componente usado en el template pero sin importar no es error de
      // tipos ni de sintaxis: Vue solo avisa en consola y no renderiza nada, así
      // que el campo desaparece en silencio. Pasó con MedioPagoCuentaField en el
      // POS (Fase 3). RouterLink/RouterView los registra vue-router globalmente.
      'vue/no-undef-components': [
        'error',
        { ignorePatterns: ['[rR]outer-?[lL]ink', '[rR]outer-?[vV]iew'] },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
    },
  },
)
