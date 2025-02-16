<template>
    <div v-if="!user?.isEmailVerified" class="bg-yellow-50 p-4 border-b border-yellow-100">
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium text-yellow-800">Please verify your email address to access all features</p>
                </div>
            </div>
            <div class="flex items-center space-x-4">
                <button @click="resendVerification" :disabled="isLoading || cooldownActive" class="text-sm font-medium text-yellow-700 hover:text-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ cooldownActive ? `Resend available in ${cooldownSeconds}s` : 'Resend verification email' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'

const { user, resendEmailVerification } = useAuth()
const { success: successToast, error: errorToast } = useToast()

const isLoading = ref(false)
const cooldownSeconds = ref(0)
const cooldownActive = computed(() => cooldownSeconds.value > 0)

const startCooldown = () => {
    cooldownSeconds.value = 60
    const timer = setInterval(() => {
        cooldownSeconds.value--
        if (cooldownSeconds.value === 0) {
            clearInterval(timer)
        }
    }, 1000)
}

const resendVerification = async () => {
    if (isLoading.value || cooldownActive.value) return

    try {
        isLoading.value = true
        await resendEmailVerification()
        successToast('Verification email sent successfully')
        startCooldown()
    } catch (error) {
        errorToast(error.message || 'Failed to send verification email')
    } finally {
        isLoading.value = false
    }
}
</script>