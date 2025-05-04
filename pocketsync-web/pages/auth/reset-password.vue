<template>
    <div class="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
        <div class="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900">
            <div class="flex flex-col flex-1 w-full lg:w-1/2">
                <div class="w-full max-w-md pt-10 mx-auto">
                    <NuxtLink to="/auth/login"
                        class="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                        <svg class="stroke-current" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                            viewBox="0 0 20 20" fill="none">
                            <path d="M12.7083 5L7.5 10.2083L12.7083 15.4167" stroke="" stroke-width="1.5"
                                stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        Back to login
                    </NuxtLink>
                </div>
                <div class="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                    <div>
                        <div class="mb-5 sm:mb-8">
                            <h1
                                class="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                                Set New Password
                            </h1>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                Please enter your new password below.
                            </p>
                        </div>

                        <form v-if="!resetComplete" @submit.prevent="handleSubmit" class="space-y-5">
                            <!-- Password -->
                            <div>
                                <label for="password"
                                    class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                                    New Password<span class="text-error-500">*</span>
                                </label>
                                <div class="relative">
                                    <input v-model="password" :type="showPassword ? 'text' : 'password'" id="password"
                                        placeholder="Enter your new password" required
                                        :class="{ 'border-error-300 focus:ring-error-500 focus:border-error-500': passwordError }"
                                        class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" />
                                    <span @click="togglePasswordVisibility"
                                        class="absolute z-30 text-gray-500 -translate-y-1/2 cursor-pointer right-4 top-1/2 dark:text-gray-400">
                                        <svg v-if="!showPassword" class="fill-current" width="20" height="20"
                                            viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" clip-rule="evenodd"
                                                d="M10.0002 13.8619C7.23361 13.8619 4.86803 12.1372 3.92328 9.70241C4.86804 7.26761 7.23361 5.54297 10.0002 5.54297C12.7667 5.54297 15.1323 7.26762 16.0771 9.70243C15.1323 12.1372 12.7667 13.8619 10.0002 13.8619ZM10.0002 4.04297C6.48191 4.04297 3.49489 6.30917 2.4155 9.4593C2.3615 9.61687 2.3615 9.78794 2.41549 9.94552C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C13.5184 15.3619 16.5055 13.0957 17.5849 9.94555C17.6389 9.78797 17.6389 9.6169 17.5849 9.45932C16.5055 6.30919 13.5184 4.04297 10.0002 4.04297ZM9.99151 7.84413C8.96527 7.84413 8.13333 8.67606 8.13333 9.70231C8.13333 10.7286 8.96527 11.5605 9.99151 11.5605H10.0064C11.0326 11.5605 11.8646 10.7286 11.8646 9.70231C11.8646 8.67606 11.0326 7.84413 10.0064 7.84413H9.99151Z"
                                                fill="#98A2B3" />
                                        </svg>
                                        <svg v-else class="fill-current" width="20" height="20" viewBox="0 0 20 20"
                                            fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" clip-rule="evenodd"
                                                d="M4.63803 3.57709C4.34513 3.2842 3.87026 3.2842 3.57737 3.57709C3.28447 3.86999 3.28447 4.34486 3.57737 4.63775L4.85323 5.91362C3.74609 6.84199 2.89363 8.06395 2.4155 9.45936C2.3615 9.61694 2.3615 9.78801 2.41549 9.94558C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C11.255 15.3619 12.4422 15.0737 13.4994 14.5598L15.3625 16.4229C15.6554 16.7158 16.1302 16.7158 16.4231 16.4229C16.716 16.13 16.716 15.6551 16.4231 15.3622L4.63803 3.57709ZM12.3608 13.4212L10.4475 11.5079C10.3061 11.5423 10.1584 11.5606 10.0064 11.5606H9.99151C8.96527 11.5606 8.13333 10.7286 8.13333 9.70237C8.13333 9.5461 8.15262 9.39434 8.18895 9.24933L5.91885 6.97923C5.03505 7.69015 4.34057 8.62704 3.92328 9.70247C4.86803 12.1373 7.23361 13.8619 10.0002 13.8619C10.8326 13.8619 11.6287 13.7058 12.3608 13.4212ZM16.0771 9.70249C15.7843 10.4569 15.3552 11.1432 14.8199 11.7311L15.8813 12.7925C16.6329 11.9813 17.2187 11.0143 17.5849 9.94561C17.6389 9.78803 17.6389 9.61696 17.5849 9.45938C16.5055 6.30925 13.5184 4.04303 10.0002 4.04303C9.13525 4.04303 8.30244 4.17999 7.52218 4.43338L8.75139 5.66259C9.1556 5.58413 9.57311 5.54303 10.0002 5.54303C12.7667 5.54303 15.1323 7.26768 16.0771 9.70249Z"
                                                fill="#98A2B3" />
                                        </svg>
                                    </span>
                                </div>
                                <p v-if="passwordError" class="mt-1 text-sm text-error-500">
                                    {{ passwordError }}
                                </p>
                                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Password must be at least 8 characters long and contain at least one uppercase
                                    letter, one
                                    lowercase letter, and one number.
                                </p>
                            </div>

                            <!-- Confirm Password -->
                            <div>
                                <label for="confirmPassword"
                                    class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                                    Confirm Password<span class="text-error-500">*</span>
                                </label>
                                <div class="relative">
                                    <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
                                        id="confirmPassword" placeholder="Confirm your password" required
                                        :class="{ 'border-error-300 focus:ring-error-500 focus:border-error-500': confirmPasswordError }"
                                        class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" />
                                    <span @click="toggleConfirmPasswordVisibility"
                                        class="absolute z-30 text-gray-500 -translate-y-1/2 cursor-pointer right-4 top-1/2 dark:text-gray-400">
                                        <svg v-if="!showConfirmPassword" class="fill-current" width="20" height="20"
                                            viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" clip-rule="evenodd"
                                                d="M10.0002 13.8619C7.23361 13.8619 4.86803 12.1372 3.92328 9.70241C4.86804 7.26761 7.23361 5.54297 10.0002 5.54297C12.7667 5.54297 15.1323 7.26762 16.0771 9.70243C15.1323 12.1372 12.7667 13.8619 10.0002 13.8619ZM10.0002 4.04297C6.48191 4.04297 3.49489 6.30917 2.4155 9.4593C2.3615 9.61687 2.3615 9.78794 2.41549 9.94552C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C13.5184 15.3619 16.5055 13.0957 17.5849 9.94555C17.6389 9.78797 17.6389 9.6169 17.5849 9.45932C16.5055 6.30919 13.5184 4.04297 10.0002 4.04297ZM9.99151 7.84413C8.96527 7.84413 8.13333 8.67606 8.13333 9.70231C8.13333 10.7286 8.96527 11.5605 9.99151 11.5605H10.0064C11.0326 11.5605 11.8646 10.7286 11.8646 9.70231C11.8646 8.67606 11.0326 7.84413 10.0064 7.84413H9.99151Z"
                                                fill="#98A2B3" />
                                        </svg>
                                        <svg v-else class="fill-current" width="20" height="20" viewBox="0 0 20 20"
                                            fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fill-rule="evenodd" clip-rule="evenodd"
                                                d="M4.63803 3.57709C4.34513 3.2842 3.87026 3.2842 3.57737 3.57709C3.28447 3.86999 3.28447 4.34486 3.57737 4.63775L4.85323 5.91362C3.74609 6.84199 2.89363 8.06395 2.4155 9.45936C2.3615 9.61694 2.3615 9.78801 2.41549 9.94558C3.49488 13.0957 6.48191 15.3619 10.0002 15.3619C11.255 15.3619 12.4422 15.0737 13.4994 14.5598L15.3625 16.4229C15.6554 16.7158 16.1302 16.7158 16.4231 16.4229C16.716 16.13 16.716 15.6551 16.4231 15.3622L4.63803 3.57709ZM12.3608 13.4212L10.4475 11.5079C10.3061 11.5423 10.1584 11.5606 10.0064 11.5606H9.99151C8.96527 11.5606 8.13333 10.7286 8.13333 9.70237C8.13333 9.5461 8.15262 9.39434 8.18895 9.24933L5.91885 6.97923C5.03505 7.69015 4.34057 8.62704 3.92328 9.70247C4.86803 12.1373 7.23361 13.8619 10.0002 13.8619C10.8326 13.8619 11.6287 13.7058 12.3608 13.4212ZM16.0771 9.70249C15.7843 10.4569 15.3552 11.1432 14.8199 11.7311L15.8813 12.7925C16.6329 11.9813 17.2187 11.0143 17.5849 9.94561C17.6389 9.78803 17.6389 9.61696 17.5849 9.45938C16.5055 6.30925 13.5184 4.04303 10.0002 4.04303C9.13525 4.04303 8.30244 4.17999 7.52218 4.43338L8.75139 5.66259C9.1556 5.58413 9.57311 5.54303 10.0002 5.54303C12.7667 5.54303 15.1323 7.26768 16.0771 9.70249Z"
                                                fill="#98A2B3" />
                                        </svg>
                                    </span>
                                </div>
                                <p v-if="confirmPasswordError" class="mt-1 text-sm text-error-500">
                                    {{ confirmPasswordError }}
                                </p>
                            </div>

                            <div v-if="error" class="rounded-md bg-error-50 p-4">
                                <div class="flex">
                                    <div class="flex-shrink-0">
                                        <svg class="h-5 w-5 text-error-400" xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fill-rule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                clip-rule="evenodd" />
                                        </svg>
                                    </div>
                                    <div class="ml-3">
                                        <p class="text-sm font-medium text-error-800">
                                            {{ error }}
                                        </p>
                                    </div>
                                </div>
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
                                    {{ isLoading ? 'Updating password...' : 'Update password' }}
                                </button>
                            </div>
                        </form>

                        <div v-else class="text-center space-y-5">
                            <div class="rounded-md bg-success-50 p-4">
                                <div class="flex">
                                    <div class="flex-shrink-0">
                                        <svg class="h-5 w-5 text-success-400" xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fill-rule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clip-rule="evenodd" />
                                        </svg>
                                    </div>
                                    <div class="ml-3">
                                        <p class="text-sm font-medium text-success-800">
                                            Password updated successfully!
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <NuxtLink to="/auth/login"
                                class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600">
                                Continue to login
                            </NuxtLink>
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
                                <img class="w-6 h-6" src="/images/logo/logo_icon.svg" alt="Logo" />
                                <h1 class="text-2xl font-bold text-white dark:text-black">PocketSync</h1>
                            </div>
                        </NuxtLink>
                        <p class="text-center text-gray-400 dark:text-white/60">
                            Create a new secure password for your account.
                        </p>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from '#app'
import { useAuth } from '~/composables/useAuth'

useHead({
    title: 'Reset Password - PocketSync'
})

definePageMeta({
    layout: 'auth'
})

const route = useRoute()
const { resetPassword, error } = useAuth()

const token = ref(route.query.token?.toString() || '')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const resetComplete = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const passwordError = ref('')
const confirmPasswordError = ref('')

const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
    showConfirmPassword.value = !showConfirmPassword.value
}

const validatePassword = () => {
    passwordError.value = ''

    if (password.value.length < 8) {
        passwordError.value = 'Password must be at least 8 characters long'
        return false
    }

    if (!/[A-Z]/.test(password.value)) {
        passwordError.value = 'Password must contain at least one uppercase letter'
        return false
    }

    if (!/[a-z]/.test(password.value)) {
        passwordError.value = 'Password must contain at least one lowercase letter'
        return false
    }

    if (!/[0-9]/.test(password.value)) {
        passwordError.value = 'Password must contain at least one number'
        return false
    }

    return true
}

const validateConfirmPassword = () => {
    confirmPasswordError.value = ''

    if (password.value !== confirmPassword.value) {
        confirmPasswordError.value = 'Passwords do not match'
        return false
    }

    return true
}

const handleSubmit = async () => {
    if (!validatePassword() || !validateConfirmPassword()) {
        return
    }

    if (!token.value) {
        error.value = 'Reset token is missing'
        return
    }

    isLoading.value = true

    try {
        await resetPassword(token.value, password.value)
        resetComplete.value = true
    } catch (err) {
        // Error is already handled by the composable
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    if (!token.value) {
        useRouter().push('/auth/forgot-password')
    }
})
</script>