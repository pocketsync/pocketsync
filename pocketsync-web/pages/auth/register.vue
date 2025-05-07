<template>
    <div class="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
        <div class="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900">
            <div class="flex flex-col flex-1 w-full lg:w-1/2">
                <div class="w-full max-w-md pt-10 mx-auto">
                    <NuxtLink to="/"
                        class="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                        <svg class="stroke-current" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                            viewBox="0 0 20 20" fill="none">
                            <path d="M12.7083 5L7.5 10.2083L12.7083 15.4167" stroke="" stroke-width="1.5"
                                stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        Back to home
                    </NuxtLink>
                </div>
                <div class="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                    <div>
                        <div class="mb-5 sm:mb-8">
                            <h1 class="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                                Sign Up
                            </h1>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                Enter your email and password to sign up!
                            </p>
                        </div>

                        <ErrorAlert :error="errorMessage" :validation-errors="validationErrors" />
                        
                        <div>
                            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
                                <button @click="handleGithubRegister"
                                    class="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10"
                                    :disabled="isLoading">
                                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                    </svg>
                                    Sign up with GitHub
                                </button>
                                <button @click="handleGoogleRegister"
                                    class="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10"
                                    :disabled="isLoading">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z"
                                            fill="#4285F4" />
                                        <path
                                            d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z"
                                            fill="#34A853" />
                                        <path
                                            d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z"
                                            fill="#FBBC05" />
                                        <path
                                            d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z"
                                            fill="#EB4335" />
                                    </svg>
                                    Sign up with Google
                                </button>
                            </div>

                            <div class="relative py-3 sm:py-5">
                                <div class="absolute inset-0 flex items-center">
                                    <div class="w-full border-t border-gray-200 dark:border-gray-800"></div>
                                </div>
                                <div class="relative flex justify-center text-sm">
                                    <span class="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2">Or</span>
                                </div>
                            </div>

                            <form @submit.prevent="handleRegister" class="space-y-5">
                                <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <!-- First Name -->
                                    <div class="sm:col-span-1">
                                        <label for="firstName"
                                            class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                                            First Name<span class="text-error-500">*</span>
                                        </label>
                                        <input v-model="userForm.firstName" type="text" id="firstName" name="firstName"
                                            placeholder="Enter your first name"
                                            :class="{ 'border-red-300 focus:ring-red-500 focus:border-red-500': validationErrors?.firstName }"
                                            class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" />
                                    </div>
                                    <!-- Last Name -->
                                    <div class="sm:col-span-1">
                                        <label for="lastName"
                                            class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                                            Last Name<span class="text-error-500">*</span>
                                        </label>
                                        <input v-model="userForm.lastName" type="text" id="lastName" name="lastName"
                                            placeholder="Enter your last name"
                                            :class="{ 'border-red-300 focus:ring-red-500 focus:border-red-500': validationErrors?.lastName }"
                                            class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" />
                                    </div>
                                </div>
                                <!-- Email -->
                                <div>
                                    <label for="email"
                                        class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                                        Email<span class="text-error-500">*</span>
                                    </label>
                                    <input v-model="userForm.email" type="email" id="email" name="email"
                                        placeholder="Enter your email"
                                        :class="{ 'border-red-300 focus:ring-red-500 focus:border-red-500': validationErrors?.email }"
                                        class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" />
                                </div>
                                <!-- Password -->
                                <div>
                                    <label for="password"
                                        class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                                        Password<span class="text-error-500">*</span>
                                    </label>
                                    <div class="relative">
                                        <input v-model="userForm.password" :type="showPassword ? 'text' : 'password'"
                                            id="password" placeholder="Enter your password"
                                            :class="{ 'border-red-300 focus:ring-red-500 focus:border-red-500': validationErrors?.password }"
                                            class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" />
                                        <span @click="togglePasswordVisibility"
                                            class="absolute z-30 text-gray-500 -translate-y-1/2 cursor-pointer right-4 top-1/2 dark:text-gray-400">
                                            <svg v-if="!showPassword" class="fill-current" width="20" height="20"
                                                viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path fill-rule="evenodd" clip-rule="evenodd"
                                                    d="M10.0002 13.8619C7.23361 13.8619 4.86803 12.1372 3.92328 9.70241C4.86804 7.26761 7.23361 5.54297 10.0002 5.54297C12.7667 5.54297 15.1323 7.26762 16.0771 9.70243C15.1323 12.1372 12.7667 13.8619 10.0002 13.8619ZM10.0002 4.04297C6.48191 4.04297 3.49489 6.30917 2.4155 9.4593C2.3615 9.61687 2.3615 9.78794 2.41549 9.94552C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C13.5184 15.3619 16.5055 13.0957 17.5849 9.94555C17.6389 9.78797 17.6389 9.6169 17.5849 9.45932C16.5055 6.30919 13.5184 4.04297 10.0002 4.04297ZM9.99151 7.84413C8.96527 7.84413 8.13333 8.67606 8.13333 9.70231C8.13333 10.7286 8.96527 11.5605 9.99151 11.5605H10.0064C11.0326 11.5605 11.8646 10.7286 11.8646 9.70231C11.8646 8.67606 11.0326 7.84413 10.0064 7.84413H9.99151Z"
                                                    fill="#98A2B3" />
                                            </svg>
                                            <svg v-else class="fill-current" width="20" height="20"
                                                viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path fill-rule="evenodd" clip-rule="evenodd"
                                                    d="M4.63803 3.57709C4.34513 3.2842 3.87026 3.2842 3.57737 3.57709C3.28447 3.86999 3.28447 4.34486 3.57737 4.63775L4.85323 5.91362C3.74609 6.84199 2.89363 8.06395 2.4155 9.45936C2.3615 9.61694 2.3615 9.78801 2.41549 9.94558C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C11.255 15.3619 12.4422 15.0737 13.4994 14.5598L15.3625 16.4229C15.6554 16.7158 16.1302 16.7158 16.4231 16.4229C16.716 16.13 16.716 15.6551 16.4231 15.3622L4.63803 3.57709ZM12.3608 13.4212L10.4475 11.5079C10.3061 11.5423 10.1584 11.5606 10.0064 11.5606H9.99151C8.96527 11.5606 8.13333 10.7286 8.13333 9.70237C8.13333 9.5461 8.15262 9.39434 8.18895 9.24933L5.91885 6.97923C5.03505 7.69015 4.34057 8.62704 3.92328 9.70247C4.86803 12.1373 7.23361 13.8619 10.0002 13.8619C10.8326 13.8619 11.6287 13.7058 12.3608 13.4212ZM16.0771 9.70249C15.7843 10.4569 15.3552 11.1432 14.8199 11.7311L15.8813 12.7925C16.6329 11.9813 17.2187 11.0143 17.5849 9.94561C17.6389 9.78803 17.6389 9.61696 17.5849 9.45938C16.5055 6.30925 13.5184 4.04303 10.0002 4.04303C9.13525 4.04303 8.30244 4.17999 7.52218 4.43338L8.75139 5.66259C9.1556 5.58413 9.57311 5.54303 10.0002 5.54303C12.7667 5.54303 15.1323 7.26768 16.0771 9.70249Z"
                                                    fill="#98A2B3" />
                                            </svg>
                                        </span>
                                    </div>
                                    <p class="mt-1 text-sm text-gray-500">Must be at least 8 characters with numbers and letters</p>
                                </div>
                                <!-- Terms Checkbox -->
                                <div>
                                    <label for="terms"
                                        class="flex items-start text-sm font-normal text-gray-700 cursor-pointer select-none dark:text-gray-400">
                                        <div class="relative">
                                            <input v-model="acceptTerms" type="checkbox" id="terms" class="sr-only" required
                                                :class="{ 'border-red-300': termsError }" />
                                            <div
                                                :class="acceptTerms ? 'border-brand-500 bg-brand-500' : 'bg-transparent border-gray-300 dark:border-gray-700'"
                                                class="mr-3 flex h-5 w-5 items-center justify-center rounded-md border-[1.25px]">
                                                <span :class="acceptTerms ? '' : 'opacity-0'">
                                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                                                        xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="white"
                                                            stroke-width="1.94437" stroke-linecap="round"
                                                            stroke-linejoin="round" />
                                                    </svg>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="flex-1">
                                            I agree to the
                                            <NuxtLink to="/terms" class="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                                                Terms of Service
                                            </NuxtLink>
                                            and
                                            <NuxtLink to="/privacy" class="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                                                Privacy Policy
                                            </NuxtLink>
                                        </div>
                                    </label>
                                </div>
                                <!-- Button -->
                                <div>
                                    <button type="submit"
                                        class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
                                        :class="{ 'opacity-75 cursor-not-allowed': isLoading }" :disabled="isLoading">
                                        <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                stroke-width="4">
                                            </circle>
                                            <path class="opacity-75" fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                            </path>
                                        </svg>
                                        {{ isLoading ? 'Creating account...' : 'Create account' }}
                                    </button>
                                </div>
                            </form>
                            <div class="mt-5">
                                <p class="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                                    Already have an account?
                                    <NuxtLink to="/auth/login" class="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                                        Sign In
                                    </NuxtLink>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="relative items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid">
                <div class="flex items-center justify-center z-1">
                    <common-grid-shape />
                    <div class="flex flex-col items-center max-w-xs">
                        <NuxtLink to="/" class="block mb-4">
                            <div class="flex items-center space-x-3">
                                <img src="/images/logo/logo_full-dark.svg" alt="Logo" class="w-64" />
                            </div>
                        </NuxtLink>
                        <p class="text-center text-gray-400 dark:text-white/60">
                            Create an account to get started with PocketSync.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useValidation } from '~/composables/useValidation'
import { useAuth } from '~/composables/useAuth'
import ErrorAlert from '~/components/common/error-alert.vue'
import CommonGridShape from '~/components/common/common-grid-shape.vue'

useHead({
    title: 'Create Account - PocketSync'
})

definePageMeta({
    layout: 'auth'
})

const { signUp, signInWithProvider } = useAuth()
const { rules, validate, clearErrors } = useValidation()

const userForm = ref({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
})
const acceptTerms = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const termsError = ref(false)
const showPassword = ref(false)

function togglePasswordVisibility() {
    showPassword.value = !showPassword.value
}

// Computed property to extract validation errors
const validationErrors = computed(() => {
    if (errorMessage.value?.code === 'VALIDATION_ERROR') {
        return errorMessage.value.details
    }
    return null
})

async function handleRegister() {
    errorMessage.value = ''
    termsError.value = false
    clearErrors()

    if (!acceptTerms.value) {
        errorMessage.value = 'Please accept the terms and conditions'
        termsError.value = true
        return
    }

    const validationRules = {
        firstName: [rules.required()],
        lastName: [rules.required()],
        email: [rules.required(), rules.email()],
        password: [rules.required(), rules.password()]
    }

    if (!validate(userForm.value, validationRules)) {
        errorMessage.value = 'Please check your input'
        return
    }

    try {
        isLoading.value = true
        await signUp({
            email: userForm.value.email,
            password: userForm.value.password,
            firstName: userForm.value.firstName,
            lastName: userForm.value.lastName
        })
        navigateTo('/console')
    } catch (error) {
        errorMessage.value = error.message || 'An error occurred during registration'
        isLoading.value = false
    }
}

async function handleGithubRegister() {
    errorMessage.value = ''
    isLoading.value = true

    try {
        await signInWithProvider('github')
    } catch (error) {
        errorMessage.value = error.message || 'An error occurred during GitHub registration'
        isLoading.value = false
    }
}

async function handleGoogleRegister() {
    errorMessage.value = ''
    isLoading.value = true

    try {
        await signInWithProvider('google')
    } catch (error) {
        errorMessage.value = error.message || 'An error occurred during Google registration'
        isLoading.value = false
    }
}
</script>