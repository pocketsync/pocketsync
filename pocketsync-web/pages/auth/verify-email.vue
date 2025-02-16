<template>
    <div>
        <h2 class="text-center text-3xl font-extrabold text-gray-900 mb-8">
            Email Verification
        </h2>

        <ErrorAlert :error="error" />

        <div v-if="isLoading" class="text-center">
            <svg class="animate-spin h-10 w-10 mx-auto text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="mt-4 text-sm text-gray-600">Verifying your email...</p>
        </div>

        <div v-else-if="verified" class="text-center space-y-6">
            <div class="rounded-full bg-green-100 p-3 w-12 h-12 mx-auto">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900">Email verified successfully!</h3>
            <p class="text-sm text-gray-600">Thank you for verifying your email address. You can now access all features of your account.</p>
            <div class="pt-4">
                <button @click="redirectToConsole" class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transform transition-all duration-200">
                    Continue to Dashboard
                </button>
            </div>
        </div>

        <div v-else class="text-center space-y-6">
            <div class="rounded-full bg-red-100 p-3 w-12 h-12 mx-auto">
                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900">Verification failed</h3>
            <p class="text-sm text-gray-600">The verification link appears to be invalid or has expired. Please try again or request a new verification email.</p>
            <div class="pt-4">
                <button v-if="isAuthenticated" @click="redirectToConsole" class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transform transition-all duration-200">
                    Return to Dashboard
                </button>
                <NuxtLink v-else to="/auth/login" class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transform transition-all duration-200">
                    Return to Login
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from '#app'
import { useAuth } from '~/composables/useAuth'
import ErrorAlert from '~/components/common/error-alert'

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
const error = ref('')

onMounted(async () => {
    const token = route.query.token

    if (!token) {
        error.value = 'Verification token is missing'
        isLoading.value = false
        return
    }

    try {
        await verifyEmail(token.toString())
        verified.value = true
    } catch (err) {
        error.value = err.message
    } finally {
        isLoading.value = false
    }
})

const redirectToConsole = () => {
    router.push('/console')
}
</script>