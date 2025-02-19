<template>
    <div>
        <h2 class="text-center text-3xl font-extrabold text-gray-900 mb-8">
            Sign in to your account
        </h2>

        <ErrorAlert :error="error" :validation-errors="validationErrors" />

        <div class="space-y-6">
            <!-- Social Login Buttons -->
            <div class="space-y-4">
                <button @click="handleGithubLogin" type="button"
                    class="w-full flex justify-center items-center px-4 py-2.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200">
                    <svg class="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                    Continue with GitHub
                </button>

                <button @click="handleGoogleLogin" type="button"
                    class="w-full flex justify-center items-center px-4 py-2.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200">
                    <svg class="h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#EA4335"
                            d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z" />
                        <path fill="#34A853"
                            d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z" />
                        <path fill="#4A90E2"
                            d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z" />
                        <path fill="#FBBC05"
                            d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z" />
                    </svg>
                    Continue with Google
                </button>
            </div>

            <div class="relative">
                <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-gray-300"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                    <span class="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
            </div>

            <!-- Email/Password Form -->
            <form @submit.prevent="handleLogin" class="space-y-6">
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">
                        Email address
                    </label>
                    <div class="mt-1">
                        <input id="email" v-model="form.email" name="email" type="email" autocomplete="email" required
                            :class="{ 'border-red-300 focus:ring-red-500 focus:border-red-500': validationErrors?.email }"
                            class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                        <p v-if="validationErrors?.email" class="mt-1 text-sm text-red-600">{{ validationErrors.email[0]
                            }}</p>
                    </div>
                </div>

                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <div class="mt-1">
                        <input id="password" v-model="form.password" name="password" type="password"
                            autocomplete="current-password" required
                            :class="{ 'border-red-300 focus:ring-red-500 focus:border-red-500': validationErrors?.password }"
                            class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                        <p v-if="validationErrors?.password" class="mt-1 text-sm text-red-600">{{ validationErrors.password[0] }}</p>
                    </div>
                </div>

                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <input id="remember-me" v-model="form.rememberMe" name="remember-me" type="checkbox"
                            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer" />
                        <label for="remember-me" class="ml-2 block text-sm text-gray-900 cursor-pointer">
                            Remember me
                        </label>
                    </div>

                    <div class="text-sm">
                        <NuxtLink to="/auth/forgot-password"
                            class="font-medium text-primary-600 hover:text-primary-500">
                            Forgot your password?
                        </NuxtLink>
                    </div>
                </div>

                <div>
                    <button type="submit"
                        class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transform transition-all duration-200 cursor-pointer"
                        :class="{ 'opacity-75 cursor-not-allowed': isLoading }" :disabled="isLoading">
                        <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                            </circle>
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                            </path>
                        </svg>
                        {{ isLoading ? 'Signing in...' : 'Sign in' }}
                    </button>
                </div>
            </form>
        </div>

        <p class="mt-8 text-center text-sm text-gray-600">
            Don't have an account?
            <NuxtLink to="/auth/register" class="font-medium text-primary-600 hover:text-primary-500">
                Create one now
            </NuxtLink>
        </p>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useValidation } from '~/composables/useValidation'
import ErrorAlert from '~/components/common/error-alert.vue'

useHead({
    title: 'Sign In - PocketSync'
})

const { signIn } = useAuth()
const { validate, rules, clearErrors } = useValidation()

const form = ref({
    email: '',
    password: '',
    rememberMe: false
})

const error = ref('')
const validationErrors = ref(null)
const isLoading = ref(false)

definePageMeta({
    layout: 'auth'
})

async function handleLogin() {
    error.value = ''
    validationErrors.value = null
    clearErrors()
    isLoading.value = true

    const validationRules = {
        email: [rules.required(), rules.email()],
        password: [rules.required(), rules.minLength(8)]
    }

    if (!validate(form.value, validationRules)) {
        validationErrors.value = error.value
        isLoading.value = false
        return
    }

    try {
        await signIn({
            email: form.value.email,
            password: form.value.password
        })
        navigateTo('/console')
    } catch (err) {
        if (err.code === 'VALIDATION_ERROR' && err.details) {
            validationErrors.value = err.details
        } else {
            error.value = err.message || 'An error occurred during sign in'
        }
        isLoading.value = false
    }
}

async function handleGithubLogin() {
    error.value = ''
    validationErrors.value = null
    isLoading.value = true

    try {
        await signIn('github')
        navigateTo('/console')
    } catch (err) {
        error.value = err.message || 'An error occurred during GitHub sign in'
        isLoading.value = false
    }
}

async function handleGoogleLogin() {
    error.value = ''
    validationErrors.value = null
    isLoading.value = true

    try {
        await signIn('google')
        navigateTo('/console')
    } catch (err) {
        error.value = err.message || 'An error occurred during Google sign in'
        isLoading.value = false
    }
}
</script>