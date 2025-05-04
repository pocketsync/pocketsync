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
                                Reset Password
                            </h1>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                Enter your email address and we'll send you instructions to reset your password.
                            </p>
                        </div>

                        <error-alert :error="error" />

                        <form @submit.prevent="handleSubmit" class="space-y-5">
                            <!-- Email -->
                            <div>
                                <label for="email"
                                    class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                                    Email<span class="text-error-500">*</span>
                                </label>
                                <input v-model="email" type="email" id="email" name="email"
                                    placeholder="Enter your email" autocomplete="email" required
                                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" />
                                <p v-if="errors.email?.length" class="mt-2 text-sm text-error-500">
                                    {{ errors.email[0] }}
                                </p>
                            </div>

                            <div v-if="emailSent" class="rounded-md bg-success-50 p-4">
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
                                            Reset instructions sent! Check your email.
                                        </p>
                                    </div>
                                </div>
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
                                    :class="{ 'opacity-75 cursor-not-allowed': isLoading }"
                                    :disabled="isLoading">
                                    <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                            stroke-width="4">
                                        </circle>
                                        <path class="opacity-75" fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                        </path>
                                    </svg>
                                    {{ isLoading ? 'Sending...' : 'Send reset instructions' }}
                                </button>
                            </div>
                        </form>
                        <div class="mt-5">
                            <p class="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                                Remember your password?
                                <NuxtLink to="/auth/login"
                                    class="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                                    Sign In
                                </NuxtLink>
                            </p>
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
                            Enter your email to receive password reset instructions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useValidation } from '~/composables/useValidation'
import { useAuth } from '~/composables/useAuth'
import CommonGridShape from '~/components/common/common-grid-shape.vue'
import ErrorAlert from '~/components/common/error-alert.vue'

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