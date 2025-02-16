<template>
    <div class="bg-white shadow-sm rounded-lg border border-gray-200">
        <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg font-medium leading-6 text-gray-900">Change Password</h3>
            <div class="mt-5 space-y-4">
                <div v-if="!user?.isSocialUser">
                    <label for="current-password" class="block text-sm font-medium text-gray-700">Current Password</label>
                    <input type="password" id="current-password" v-model="currentPassword"
                        class="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                </div>
                <div>
                    <label for="new-password" class="block text-sm font-medium text-gray-700">New Password</label>
                    <input type="password" id="new-password" v-model="newPassword"
                        class="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                </div>
                <div>
                    <label for="confirm-password" class="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <input type="password" id="confirm-password" v-model="confirmPassword"
                        class="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                </div>
                <ErrorAlert v-if="error" :message="error.message" class="mt-4" />
            </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 text-right sm:px-6 border-t border-gray-100">
            <button @click="handleChangePassword" :disabled="isLoading || !isFormValid"
                class="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <span v-if="isLoading">Updating...</span>
                <span v-else>Update password</span>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'
import ErrorAlert from '~/components/common/error-alert.vue'

const { changePassword, isLoading, error, user } = useAuth()
const { success: successToast, error: errorToast } = useToast()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const isFormValid = computed(() => {
    // Basic password validation
    const isNewPasswordValid = newPassword.value.length >= 8
    const doPasswordsMatch = newPassword.value === confirmPassword.value
    
    // Current password is only required for non-social users
    const isCurrentPasswordValid = user?.isSocialUser || currentPassword.value.length >= 8
    
    return isCurrentPasswordValid && isNewPasswordValid && doPasswordsMatch
})

const handleChangePassword = async () => {
    if (!isFormValid.value) return

    try {
        await changePassword(user?.isSocialUser ? null : currentPassword.value, newPassword.value)
        successToast('Password updated successfully')
        currentPassword.value = ''
        newPassword.value = ''
        confirmPassword.value = ''
    } catch (err) {
        errorToast(err.message)
    }
}
</script>