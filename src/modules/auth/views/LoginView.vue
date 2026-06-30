<template>
  <div class="relative flex h-screen w-full flex-col overflow-hidden bg-white dark:bg-gray-900 lg:flex-row">
    <!-- Panel formulario -->
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

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div>
            <label for="email" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Correo<span class="text-error-500">*</span>
            </label>
            <input
              v-model="email"
              type="email"
              id="email"
              name="email"
              autocomplete="email"
              placeholder="correo@ejemplo.com"
              class="login-input"
              :disabled="loginMutation.isPending.value"
              required
            />
          </div>

          <div>
            <label
              for="password"
              class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Contraseña<span class="text-error-500">*</span>
            </label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                id="password"
                name="password"
                autocomplete="current-password"
                placeholder="Ingresa tu contraseña"
                class="login-input pr-11"
                :disabled="loginMutation.isPending.value"
                required
              />
              <button
                type="button"
                @click="togglePasswordVisibility"
                class="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                <AppIcon :name="showPassword ? ICONS.eyeOff : ICONS.eye" :size="20" />
              </button>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3">
            <label
              for="keepLoggedIn"
              class="flex cursor-pointer select-none items-center text-sm text-gray-700 dark:text-gray-300"
            >
              <input v-model="keepLoggedIn" type="checkbox" id="keepLoggedIn" class="sr-only" />
              <span
                class="mr-3 flex h-5 w-5 items-center justify-center rounded-md border-[1.25px]"
                :class="
                  keepLoggedIn
                    ? 'border-brand-500 bg-brand-500'
                    : 'border-gray-300 bg-transparent dark:border-gray-600'
                "
              >
                <AppIcon
                  v-if="keepLoggedIn"
                  :name="ICONS.check"
                  :size="14"
                  class="text-white"
                />
              </span>
              Mantener sesión iniciada
            </label>
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
            :disabled="loginMutation.isPending.value"
          >
            {{ loginMutation.isPending.value ? 'Iniciando sesión...' : 'Iniciar sesión' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Panel marca — imagen de fondo con blur -->
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
import { useLoginMutation } from '@/modules/auth/composables/useLoginMutation'
import AppIcon from '@/shared/components/AppIcon.vue'
import ThemeToggler from '@/shared/components/ThemeToggler.vue'
import { ICONS } from '@/shared/constants/icons'

const loginMutation = useLoginMutation()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const keepLoggedIn = ref(false)

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleSubmit = () => {
  if (!email.value.trim() || !password.value) return

  loginMutation.mutate({
    correo: email.value.trim(),
    contrasena: password.value,
    keepLoggedIn: keepLoggedIn.value,
  })
}
</script>
