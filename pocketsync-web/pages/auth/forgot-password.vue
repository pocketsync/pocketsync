<template>
    <div>
        <h2 class="text-center text-3xl font-extrabold text-gray-900 mb-4">
            Reset your password
        </h2>
        <p class="text-center text-sm text-gray-600 mb-8">
            Enter your email address and we'll send you instructions to reset your password.
        </p>

        <form @submit.prevent="handleSubmit" class="space-y-6">
            <div>
                <label for="email" class="block text-sm font-medium text-gray-700">
                    Email address
                </label>
                <div class="mt-1">
                    <input id="email" v-model="email" name="email" type="email" autocomplete="email" required
                        class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
                <p v-if="errors.email?.length" class="mt-2 text-sm text-red-600">
                    {{ errors.email[0] }}
                </p>
            </div>

            <div v-if="emailSent" class="rounded-md bg-green-50 p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-green-800">
                            Reset instructions sent! Check your email.
                        </p>
                    </div>
                </div>
            </div>

            <div v-if="error" class="rounded-md bg-red-50 p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-red-800">
                            {{ error }}
                        </p>
                    </div>
                </div>
            </div>

            <div>
                <button type="submit"
                    class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transform transition-all duration-200"
                    :class="{ 'opacity-75 cursor-not-allowed': isLoading }" :disabled="isLoading || emailSent">
                    <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                    </svg>
                    {{ isLoading ? 'Sending...' : 'Send reset instructions' }}
                </button>
            </div>
        </form>

        <div class="mt-8 text-center">
            <NuxtLink to="/auth/login" class="text-sm font-medium text-primary-600 hover:text-primary-500">
                Back to login
            </NuxtLink>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useValidation } from '~/composables/useValidation'

definePageMeta({
    layout: 'auth'
})

useHead({
    title: 'Reset Password - PocketSync'
})

const email = ref('')
const emailSent = ref(false)

const { requestPasswordReset, isLoading, error } = useAuth()
const { validate, errors, rules } = useValidation()

async function handleSubmit() {
    emailSent.value = false

    const isValid = validate(
        { email: email.value },
        { email: [rules.required('Email is required'), rules.email('Please enter a valid email address')] }
    )

    if (!isValid) return

    try {
        await requestPasswordReset(email.value)
        emailSent.value = true
        email.value = ''
    } catch (err) {
    }
}
</script>