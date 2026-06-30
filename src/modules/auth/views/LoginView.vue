<template>
  <div class="relative flex h-screen w-full flex-col overflow-hidden bg-white dark:bg-gray-900 lg:flex-row">
    <div class="relative flex w-full flex-1 flex-col justify-center lg:w-1/2 lg:flex-none">
      <div class="absolute top-4 right-4 z-20 sm:top-6 sm:right-6">
        <ThemeToggler />
      </div>

      <div class="mx-auto w-full max-w-md px-6 py-10 sm:px-8">
        <div class="mb-8 flex justify-center lg:hidden">
          <img
            src="/images/logo/logo-o-sarita.webp"
            alt="Oxígeno Sarita"
            width="200"
            height="80"
            class="object-contain"
          />
        </div>

        <div class="mb-6 sm:mb-8">
          <h1 class="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white sm:text-title-md">
            Iniciar sesión
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Ingresa tu correo y contraseña para acceder
          </p>
        </div>

        <form class="space-y-5" @submit="onSubmit">
          <AppInput
            v-model="correo"
            type="email"
            label="Correo"
            name="email"
            autocomplete="email"
            placeholder="correo@ejemplo.com"
            required
            v-bind="correoAttrs"
            :disabled="loginMutation.isPending.value"
            :error="errors.correo"
          />

          <AppInput
            v-model="contrasena"
            type="password"
            label="Contraseña"
            name="password"
            autocomplete="current-password"
            placeholder="Ingresa tu contraseña"
            required
            v-bind="contrasenaAttrs"
            :disabled="loginMutation.isPending.value"
            :error="errors.contrasena"
          />

          <div class="flex flex-wrap items-center justify-between gap-3">
            <AppCheckbox v-model="keepLoggedIn" label="Mantener sesión iniciada" />

            <router-link
              to="/"
              class="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              ¿Olvidaste tu contraseña?
            </router-link>
          </div>

          <button
            type="submit"
            class="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="loginMutation.isPending.value || isSubmitting"
          >
            {{ loginMutation.isPending.value ? 'Iniciando sesión...' : 'Iniciar sesión' }}
          </button>
        </form>
      </div>
    </div>

    <div
      class="relative hidden h-full w-full shrink-0 overflow-hidden lg:flex lg:w-1/2 lg:items-center lg:justify-center"
    >
      <div class="login-brand-panel-bg" aria-hidden="true" />
      <div class="absolute inset-0 bg-brand-900/25" aria-hidden="true" />
      <div class="relative z-10 flex max-w-md flex-col items-center px-8 text-center">
        <img
          width="300"
          height="130"
          src="/images/logo/logo-o-sarita.webp"
          alt="Oxígeno Sarita"
          class="drop-shadow-lg"
        />
        <p class="mt-8 text-base font-medium text-white drop-shadow-sm">
          Panel de administración
        </p>
        <p class="mt-1 text-sm text-white/80 drop-shadow-sm">Sistema Sarita</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import { useLoginMutation } from '@/modules/auth/composables/useLoginMutation'
import { AppCheckbox, AppInput } from '@/shared/components'
import ThemeToggler from '@/shared/components/ThemeToggler.vue'
import { requiredEmail, requiredString } from '@/shared/validation'

const loginMutation = useLoginMutation()
const keepLoggedIn = ref(false)

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      correo: requiredEmail(),
      contrasena: requiredString('La contraseña'),
    }),
  ),
  initialValues: {
    correo: '',
    contrasena: '',
  },
})

const [correo, correoAttrs] = defineField('correo')
const [contrasena, contrasenaAttrs] = defineField('contrasena')

const onSubmit = handleSubmit((values) => {
  loginMutation.mutate({
    correo: values.correo,
    contrasena: values.contrasena,
    keepLoggedIn: keepLoggedIn.value,
  })
})
</script>
