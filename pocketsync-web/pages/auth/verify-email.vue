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
                            <h1
                                class="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                                Email Verification
                            </h1>
                        </div>

                        <ErrorAlert :error="error" />

                        <div v-if="isLoading" class="text-center py-10">
                            <svg class="animate-spin h-10 w-10 mx-auto text-brand-500"
                                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                    stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                </path>
                            </svg>
                            <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">Verifying your email...</p>
                        </div>

                        <div v-else-if="verified" class="text-center space-y-6 py-8">
                            <div
                                class="rounded-full bg-success-100 p-3 w-12 h-12 mx-auto flex items-center justify-center">
                                <svg class="w-6 h-6 text-success-600" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <h3 class="text-lg font-medium text-gray-900 dark:text-white/90">Email verified
                                successfully!</h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400">Thank you for verifying your email
                                address. You can now access all features of your account.</p>
                            <div class="pt-4">
                                <button @click="redirectToConsole"
                                    class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600">
                                    Continue to Dashboard
                                </button>
                            </div>
                        </div>

                        <div v-else class="text-center space-y-6 py-8">
                            <div
                                class="rounded-full bg-error-100 p-3 w-12 h-12 mx-auto flex items-center justify-center">
                                <svg class="w-6 h-6 text-error-600" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </div>
                            <h3 class="text-lg font-medium text-gray-900 dark:text-white/90">Verification failed</h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400">The verification link appears to be
                                invalid or has expired. Please try again or request a new verification email.</p>
                            <div class="pt-4">
                                <button v-if="isAuthenticated" @click="redirectToConsole"
                                    class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600">
                                    Return to Dashboard
                                </button>
                                <NuxtLink v-else to="/auth/login"
                                    class="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600">
                                    Return to Login
                                </NuxtLink>
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
                            Verify your email address to access all features of your account.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from '#app'
import ErrorAlert from '~/components/common/error-alert'
import CommonGridShape from '~/components/common/common-grid-shape.vue'

useHead({
    title: 'Verify Email - PocketSync'
})

definePageMeta({
    layout: 'auth'
})

const route = useRoute()
const router = useRouter()
const { verifyEmail, error: authError, isAuthenticated } = useAuth()

const isLoading = ref(true)
const verified = ref(false)

onMounted(async () => {
    const token = route.query.token

    if (!token) {
        authError.value = 'Verification token is missing'
        isLoading.value = false
        return
    }

    try {
        await verifyEmail(token.toString())
        verified.value = true
    } catch (err) {
        // Error is already handled by the composable
    } finally {
        isLoading.value = false
    }
})

const redirectToConsole = () => {
    if (isAuthenticated.value) {
        router.push('/console')
    } else {
        router.push('/auth/login')
    }
}
</script>