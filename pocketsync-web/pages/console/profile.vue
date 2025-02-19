<template>
    <div>
        <div class="space-y-6">
            <!-- Profile section -->
            <div class="bg-white shadow-sm rounded-lg border border-gray-200">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg font-medium leading-6 text-gray-900">Profile Information</h3>
                    <ErrorAlert v-if="error" :message="error" class="mt-4" />
                    <div class="mt-5 space-y-6">
                        <div v-if="user" class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label for="firstName" class="block text-sm font-medium text-gray-700">First
                                    name</label>
                                <input type="text" id="firstName" v-model="profileData.firstName"
                                    class="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                                <p v-if="errors.firstName" class="mt-1 text-sm text-red-600">{{ errors.firstName[0] }}
                                </p>
                            </div>
                            <div>
                                <label for="lastName" class="block text-sm font-medium text-gray-700">Last name</label>
                                <input type="text" id="lastName" v-model="profileData.lastName"
                                    class="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                                <p v-if="errors.lastName" class="mt-1 text-sm text-red-600">{{ errors.lastName[0] }}</p>
                            </div>
                            <div>
                                <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" id="email" v-model="user.email" disabled
                                    class="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 bg-gray-50 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 text-right sm:px-6 border-t border-gray-100">
                    <button @click="updateUserProfile" :disabled="isLoading"
                        class="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        {{ isLoading ? 'Saving...' : 'Save changes' }}
                    </button>
                </div>
            </div>

            <!-- Password section -->
            <ChangePasswordForm />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useValidation } from '~/composables/useValidation'
import { useToast } from '~/composables/useToast'
import ErrorAlert from '~/components/common/error-alert.vue'

useHead({
    title: 'Profile Settings - PocketSync'
})
import ChangePasswordForm from '~/components/profile/change-password-form.vue'

definePageMeta({
    layout: 'dashboard'
})

const { user } = useAuth()
const { success } = useToast()
const { validate, rules, errors, clearErrors } = useValidation()
const error = ref(null)
const isLoading = ref(false)

const profileData = ref({
    firstName: user.value?.firstName || '',
    lastName: user.value?.lastName || ''
})

const validationRules = {
    firstName: [rules.required('First name is required'), rules.maxLength(50, 'First name must not exceed 50 characters')],
    lastName: [rules.required('Last name is required'), rules.maxLength(50, 'Last name must not exceed 50 characters')]
}

const updateUserProfile = async () => {
    clearErrors()
    error.value = null

    const isValid = validate({
        firstName: profileData.value.firstName,
        lastName: profileData.value.lastName
    }, validationRules)

    if (!isValid) return

    try {
        isLoading.value = true
        // await update({
        //     data: {
        //         firstName: profileData.value.firstName,
        //         lastName: profileData.value.lastName
        //     }
        // })
        success('Profile updated successfully')
    } catch (err: any) {
        error.value = err.message
    } finally {
        isLoading.value = false
    }
}
</script>