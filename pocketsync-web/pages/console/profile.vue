<template>
    <div>
        <div class="space-y-6">
            <!-- Profile section -->
            <div class="bg-white shadow-sm rounded-lg border border-gray-200">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg font-medium leading-6 text-gray-900">Profile Information</h3>
                    <div class="mt-5 space-y-6">
                        <div class="flex items-center space-x-4">
                            <div v-if="user.avatar_url" class="h-14 w-14 rounded-full overflow-hidden">
                                <img :src="user.avatar_url" :alt="user.name" class="h-full w-full object-cover" />
                            </div>
                            <div v-else class="h-14 w-14 rounded-full bg-primary-100 flex items-center justify-center">
                                <span class="text-lg font-medium text-primary-600">{{ getUserInitials(user) }}</span>
                            </div>
                            <button class="text-sm text-primary-600 hover:text-primary-500 font-medium">
                                Change avatar
                            </button>
                        </div>

                        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
                                <input type="text" id="name" v-model="user.name"
                                    class="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
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
                    <button
                        class="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                        Save changes
                    </button>
                </div>
            </div>

            <!-- Password section -->
            <div class="bg-white shadow-sm rounded-lg border border-gray-200">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg font-medium leading-6 text-gray-900">Change Password</h3>
                    <div class="mt-5 space-y-4">
                        <div>
                            <label for="current-password" class="block text-sm font-medium text-gray-700">Current
                                Password</label>
                            <input type="password" id="current-password" v-model="currentPassword"
                                class="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                        </div>
                        <div>
                            <label for="new-password" class="block text-sm font-medium text-gray-700">New
                                Password</label>
                            <input type="password" id="new-password" v-model="newPassword"
                                class="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                        </div>
                        <div>
                            <label for="confirm-password" class="block text-sm font-medium text-gray-700">Confirm
                                Password</label>
                            <input type="password" id="confirm-password" v-model="confirmPassword"
                                class="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 text-right sm:px-6 border-t border-gray-100">
                    <button
                        class="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                        Update password
                    </button>
                </div>
            </div>

            <!-- Preferences section -->
            <div class="bg-white shadow-sm rounded-lg border border-gray-200">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg font-medium leading-6 text-gray-900">Preferences</h3>
                    <div class="mt-5 space-y-4">
                        <div class="flex items-center">
                            <input type="checkbox" id="email-notifications" v-model="emailNotifications"
                                class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-600 focus:ring-offset-2" />
                            <label for="email-notifications" class="ml-2 block text-sm text-gray-900">
                                Receive email notifications
                            </label>
                        </div>
                        <div class="flex items-center">
                            <input type="checkbox" id="marketing-emails" v-model="marketingEmails"
                                class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-600 focus:ring-offset-2" />
                            <label for="marketing-emails" class="ml-2 block text-sm text-gray-900">
                                Receive marketing emails
                            </label>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 text-right sm:px-6 border-t border-gray-100">
                    <button
                        class="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                        Save preferences
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

definePageMeta({
    layout: 'dashboard'
})

// User data
const user = ref({
    name: 'John Doe',
    email: 'john@example.com',
    avatar_url: null
})

// Password change form
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// Preferences
const emailNotifications = ref(true)
const marketingEmails = ref(false)

// Helper function to get user initials
function getUserInitials(user) {
    return user.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
}
</script>