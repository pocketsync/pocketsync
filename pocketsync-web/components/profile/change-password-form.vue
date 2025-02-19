<template>
    <div class="bg-white shadow-sm rounded-lg border border-gray-200">
        <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg font-medium leading-6 text-gray-900">Change Password</h3>
            <div class="mt-5 space-y-4">
                <div v-if="!session?.user?.provider?.includes('social')">
                    <label for="current-password" class="block text-sm font-medium text-gray-700">Current Password</label>
                    <input type="password" id="current-password" v-model="currentPassword"
                        :class="{'ring-red-300 focus:ring-red-500': errors.value?.currentPassword}"
                        class="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                    <p v-if="errors.value?.currentPassword" class="mt-1 text-sm text-red-600">{{ errors.value.currentPassword[0] }}</p>
                </div>
                <div>
                    <label for="new-password" class="block text-sm font-medium text-gray-700">New Password</label>
                    <input type="password" id="new-password" v-model="newPassword"
                        :class="{'ring-red-300 focus:ring-red-500': errors.value?.newPassword}"
                        class="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                    <p v-if="errors.value?.newPassword" class="mt-1 text-sm text-red-600">{{ errors.value.newPassword[0] }}</p>
                </div>
                <div>
                    <label for="confirm-password" class="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <input type="password" id="confirm-password" v-model="confirmPassword"
                        :class="{'ring-red-300 focus:ring-red-500': errors.value?.confirmPassword}"
                        class="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                    <p v-if="errors.value?.confirmPassword" class="mt-1 text-sm text-red-600">{{ errors.value.confirmPassword[0] }}</p>
                </div>
                <ErrorAlert v-if="error" :message="error" class="mt-4" />
            </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 text-right sm:px-6 border-t border-gray-100">
            <button @click="handleChangePassword" :disabled="isLoading || !isFormValid"
                class="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ isLoading ? 'Changing password...' : 'Change password' }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from '~/composables/useToast'
import ErrorAlert from '~/components/common/error-alert.vue'

const { data: session, update } = useAuth()
const { success } = useToast()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref(null)
const isLoading = ref(false)
const errors = ref({})

const isFormValid = computed(() => {
    if (!session.value?.user?.provider?.includes('social')) {
        return currentPassword.value && newPassword.value && confirmPassword.value && newPassword.value === confirmPassword.value
    }
    return newPassword.value && confirmPassword.value && newPassword.value === confirmPassword.value
})

const handleChangePassword = async () => {
    error.value = null
    errors.value = {}

    if (newPassword.value !== confirmPassword.value) {
        errors.value.confirmPassword = ['Passwords do not match']
        return
    }

    try {
        isLoading.value = true
        await update({
            data: {
                currentPassword: currentPassword.value,
                newPassword: newPassword.value
            }
        })
        success('Password changed successfully')
        currentPassword.value = ''
        newPassword.value = ''
        confirmPassword.value = ''
    } catch (err) {
        error.value = err.message
    } finally {
        isLoading.value = false
    }
}
</script>