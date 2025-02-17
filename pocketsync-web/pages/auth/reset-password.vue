<template>
    <div>
        <h2 class="text-center text-3xl font-extrabold text-gray-900 mb-4">
            Set new password
        </h2>
        <p class="text-center text-sm text-gray-600 mb-8">
            Please enter your new password below.
        </p>

        <form v-if="!resetComplete" @submit.prevent="handleSubmit" class="space-y-6">
            <div>
                <label for="password" class="block text-sm font-medium text-gray-700">
                    New password
                </label>
                <div class="mt-1">
                    <input id="password" v-model="password" name="password" type="password" required
                        class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        :class="{ 'border-red-300': passwordError }" />
                    <p v-if="passwordError" class="mt-1 text-sm text-red-600">
                        {{ passwordError }}
                    </p>
                    <p class="mt-1 text-sm text-gray-500">
                        Password must be at least 8 characters long and contain at least one uppercase letter, one
                        lowercase letter, and one number.
                    </p>
                </div>
            </div>

            <div>
                <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
                    Confirm new password
                </label>
                <div class="mt-1">
                    <input id="confirmPassword" v-model="confirmPassword" name="confirmPassword" type="password"
                        required
                        class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        :class="{ 'border-red-300': confirmPasswordError }" />
                    <p v-if="confirmPasswordError" class="mt-1 text-sm text-red-600">
                        {{ confirmPasswordError }}
                    </p>
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
                    :class="{ 'opacity-75 cursor-not-allowed': isLoading }" :disabled="isLoading">
                    <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                    </svg>
                    {{ isLoading ? 'Updating password...' : 'Update password' }}
                </button>
            </div>
        </form>

        <div v-else class="text-center space-y-6">
            <div class="rounded-md bg-green-50 p-4">
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
                            Password updated successfully!
                        </p>
                    </div>
                </div>
            </div>

            <NuxtLink to="/auth/login"
                class="inline-flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transform transition-all duration-200">
                Continue to login
            </NuxtLink>
        </div>
    </div>
</template>

<script setup>
definePageMeta({
    layout: 'auth'
})

useHead({
    title: 'Reset Password - PocketSync'
})

const route = useRoute()
const router = useRouter()

const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const error = ref('')
const resetComplete = ref(false)
const passwordError = ref('')
const confirmPasswordError = ref('')

const token = computed(() => route.query.token)

const validatePassword = (pass) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(pass)
    const hasLowerCase = /[a-z]/.test(pass)
    const hasNumbers = /\d/.test(pass)

    if (pass.length < minLength) {
        return 'Password must be at least 8 characters long'
    }
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        return 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }
    return ''
}

watch(password, (newValue) => {
    passwordError.value = validatePassword(newValue)
})

watch(confirmPassword, (newValue) => {
    if (newValue && newValue !== password.value) {
        confirmPasswordError.value = 'Passwords do not match'
    } else {
        confirmPasswordError.value = ''
    }
})

async function handleSubmit() {
    error.value = ''
    passwordError.value = validatePassword(password.value)

    if (password.value !== confirmPassword.value) {
        confirmPasswordError.value = 'Passwords do not match'
        return
    }

    if (passwordError.value || confirmPasswordError.value) {
        return
    }

    if (!token.value) {
        error.value = 'Invalid or expired reset link'
        return
    }

    try {
        isLoading.value = true
        const { resetPassword, error: authError } = useAuth()
        await resetPassword(token.value, password.value)
        resetComplete.value = true
    } catch (err) {
        error.value = authError.value?.message || 'Failed to reset password. Please try again.'
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    if (!token.value) {
        router.push('/auth/forgot-password')
    }
})
</script>