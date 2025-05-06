<template>
    <div class="max-w-4xl mx-auto">
        <NuxtLink to="/console"
            class="mb-12 flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
            <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                    d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                    clip-rule="evenodd" />
            </svg>
            <span class="text-sm font-medium">Back to console</span>
        </NuxtLink>
        <!-- Page Header -->
        <div class="mb-8">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Account settings</h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your profile and security settings</p>
        </div>

        <!-- Loading Spinner (only show if user is null) -->
        <div v-if="isLoading && !user" class="flex justify-center py-12">
            <div class="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div>
        </div>

        <!-- Error Alert -->
        <div v-if="error && !user && !isLoading" class="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400 dark:text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error loading profile</h3>
                    <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                        <p>{{ getErrorMessage(error) }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Settings Content -->
        <div v-if="user" class="space-y-8">
            <!-- Tabs -->
            <div class="border-b border-gray-200 dark:border-gray-700">
                <nav class="-mb-px flex space-x-8">
                    <button 
                        @click="switchTab('profile')" 
                        class="py-4 px-1 text-sm font-medium transition-colors duration-200"
                        :class="activeTab === 'profile' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'"
                    >
                        Profile information
                    </button>
                    <button 
                        @click="switchTab('security')" 
                        class="py-4 px-1 text-sm font-medium transition-colors duration-200"
                        :class="activeTab === 'security' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'"
                        id="security"
                    >
                        Security
                    </button>
                    <button 
                        @click="switchTab('notifications')" 
                        class="py-4 px-1 text-sm font-medium transition-colors duration-200"
                        :class="activeTab === 'notifications' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'"
                        id="notifications"
                    >
                        Notifications
                    </button>
                </nav>
            </div>

            <!-- Profile Tab -->
            <div v-if="activeTab === 'profile'" class="space-y-6">
                <form @submit.prevent="updateUserProfile" class="space-y-6">
                    <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <!-- First Name -->
                        <div class="sm:col-span-3">
                            <label for="firstName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">First name</label>
                            <div class="mt-1">
                                <input 
                                    type="text" 
                                    id="firstName" 
                                    v-model="profileForm.firstName" 
                                    class="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                                    :class="{'border-red-300 focus:border-red-500 focus:ring-red-500': formErrors.firstName}"
                                />
                                <p v-if="formErrors.firstName" class="mt-2 text-sm text-red-600 dark:text-red-400">{{ formErrors.firstName }}</p>
                            </div>
                        </div>

                        <!-- Last Name -->
                        <div class="sm:col-span-3">
                            <label for="lastName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Last name</label>
                            <div class="mt-1">
                                <input 
                                    type="text" 
                                    id="lastName" 
                                    v-model="profileForm.lastName" 
                                    class="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                                    :class="{'border-red-300 focus:border-red-500 focus:ring-red-500': formErrors.lastName}"
                                />
                                <p v-if="formErrors.lastName" class="mt-2 text-sm text-red-600 dark:text-red-400">{{ formErrors.lastName }}</p>
                            </div>
                        </div>

                        <!-- Email (Read-only) -->
                        <div class="sm:col-span-6">
                            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                            <div class="mt-1 flex items-center">
                                <input 
                                    type="email" 
                                    id="email" 
                                    :value="user.email" 
                                    disabled
                                    class="block w-full rounded-md border-gray-300 bg-gray-100 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 sm:text-sm"
                                />
                                <span v-if="user.isEmailVerified" class="ml-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    <svg class="-ml-0.5 mr-1.5 h-2 w-2 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 8 8">
                                        <circle cx="4" cy="4" r="3" />
                                    </svg>
                                    Verified
                                </span>
                                <span v-else class="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                    <svg class="-ml-0.5 mr-1.5 h-2 w-2 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 8 8">
                                        <circle cx="4" cy="4" r="3" />
                                    </svg>
                                    Not verified
                                </span>
                            </div>
                            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Your email address cannot be changed. Contact support if you need to update it.</p>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <div class="flex justify-end">
                        <button 
                            type="submit" 
                            class="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors duration-200"
                            :disabled="isUpdating"
                        >
                            <span v-if="isUpdating" class="inline-flex items-center">
                                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </span>
                            <span v-else>Save changes</span>
                        </button>
                    </div>
                </form>

                <!-- Success Message -->
                <div v-if="updateSuccess" class="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-green-800 dark:text-green-200">Profile updated successfully!</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Security Tab -->
            <div v-if="activeTab === 'security'" class="space-y-6">
                <form @submit.prevent="changeUserPassword" class="space-y-6">
                    <div class="space-y-6">
                        <!-- Current Password -->
                        <div>
                            <label for="currentPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Current password</label>
                            <div class="mt-1">
                                <input 
                                    type="password" 
                                    id="currentPassword" 
                                    v-model="passwordForm.currentPassword" 
                                    class="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                                    :class="{'border-red-300 focus:border-red-500 focus:ring-red-500': passwordErrors.currentPassword}"
                                />
                                <p v-if="passwordErrors.currentPassword" class="mt-2 text-sm text-red-600 dark:text-red-400">{{ passwordErrors.currentPassword }}</p>
                            </div>
                        </div>

                        <!-- New Password -->
                        <div>
                            <label for="newPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">New password</label>
                            <div class="mt-1">
                                <input 
                                    type="password" 
                                    id="newPassword" 
                                    v-model="passwordForm.newPassword" 
                                    class="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                                    :class="{'border-red-300 focus:border-red-500 focus:ring-red-500': passwordErrors.newPassword}"
                                />
                                <p v-if="passwordErrors.newPassword" class="mt-2 text-sm text-red-600 dark:text-red-400">{{ passwordErrors.newPassword }}</p>
                            </div>
                        </div>

                        <!-- Confirm New Password -->
                        <div>
                            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm new password</label>
                            <div class="mt-1">
                                <input 
                                    type="password" 
                                    id="confirmPassword" 
                                    v-model="passwordForm.confirmPassword" 
                                    class="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:text-sm"
                                    :class="{'border-red-300 focus:border-red-500 focus:ring-red-500': passwordErrors.confirmPassword}"
                                />
                                <p v-if="passwordErrors.confirmPassword" class="mt-2 text-sm text-red-600 dark:text-red-400">{{ passwordErrors.confirmPassword }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <div class="flex justify-end">
                        <button 
                            type="submit" 
                            class="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors duration-200"
                            :disabled="isChangingPassword"
                        >
                            <span v-if="isChangingPassword" class="inline-flex items-center">
                                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Updating...
                            </span>
                            <span v-else>Change password</span>
                        </button>
                    </div>
                </form>

                <!-- Password Success Message -->
                <div v-if="passwordUpdateSuccess" class="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-green-800 dark:text-green-200">Password updated successfully!</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Notifications Tab -->
            <div v-if="activeTab === 'notifications'" class="space-y-6">
                <!-- Loading indicator for notification settings -->
                <div v-if="notificationLoading" class="flex justify-center py-4">
                    <div class="animate-spin h-6 w-6 border-4 border-primary-500 rounded-full border-t-transparent"></div>
                </div>
                <form @submit.prevent="saveNotificationSettings" class="space-y-6">
                    <div class="space-y-6">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Choose which notifications you'd like to receive.</p>
                        
                        <div class="space-y-4">
                            <!-- Email Notifications -->
                            <div class="flex items-start">
                                <div class="flex items-center h-5">
                                    <input 
                                        id="email-enabled" 
                                        type="checkbox"
                                        v-model="notificationForm.emailEnabled"
                                        class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-primary-400"
                                    />
                                </div>
                                <div class="ml-3 text-sm">
                                    <label for="email-enabled" class="font-medium text-gray-700 dark:text-gray-300">Email notifications</label>
                                    <p class="text-gray-500 dark:text-gray-400">Receive important notifications about your account, projects, and sync events via email.</p>
                                </div>
                            </div>
                            
                            <!-- Marketing -->
                            <div class="flex items-start">
                                <div class="flex items-center h-5">
                                    <input 
                                        id="marketing-enabled" 
                                        type="checkbox"
                                        v-model="notificationForm.marketingEnabled"
                                        class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-primary-400"
                                    />
                                </div>
                                <div class="ml-3 text-sm">
                                    <label for="marketing-enabled" class="font-medium text-gray-700 dark:text-gray-300">Marketing emails</label>
                                    <p class="text-gray-500 dark:text-gray-400">Receive updates about new features, tips, promotions, and other marketing communications.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <div class="flex justify-end">
                        <button 
                            type="submit" 
                            class="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors duration-200"
                            :disabled="isSavingNotifications"
                        >
                            <span v-if="isSavingNotifications" class="inline-flex items-center">
                                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </span>
                            <span v-else>Save preferences</span>
                        </button>
                    </div>
                </form>

                <!-- Notification settings saved success message -->
                <div v-if="notificationUpdateSuccess" class="rounded-md bg-green-50 p-4 dark:bg-green-900/20 mb-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-green-400 dark:text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-green-800 dark:text-green-200">Notification settings updated successfully!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useNotificationSettings } from '~/composables/useNotificationSettings'

definePageMeta({
    layout: 'dashboard-index'
})

// @ts-ignore
useHead({
    title: 'Account settings - PocketSync'
})

const { user, isLoading: authLoading, error: authError, updateProfile, changePassword } = useAuth()
const { settings, isLoading: notificationLoading, error: notificationError, fetchSettings, updateSettings } = useNotificationSettings()

// Combined loading and error states
const isLoading = computed(() => {
    const shouldConsiderNotificationLoading = activeTab.value === 'notifications'
    return authLoading || (shouldConsiderNotificationLoading && notificationLoading)
})
const error = computed(() => {
    if (user.value) {
        return authError
    }
    return authError || notificationError
})

// Helper function to safely get error message
const getErrorMessage = (err: any): string => {
    if (!err) return 'An unexpected error occurred'
    if (typeof err === 'string') return err
    if (err.message) return err.message
    return 'An unexpected error occurred'
}

// Tab state
const activeTab = ref('profile')

// Form state for profile
const profileForm = reactive({
    firstName: '',
    lastName: ''
})

const formErrors = reactive({
    firstName: '',
    lastName: ''
})

const isUpdating = ref(false)
const updateSuccess = ref(false)

// Form state for password
const passwordForm = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
})

const passwordErrors = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
})

const isChangingPassword = ref(false)
const passwordUpdateSuccess = ref(false)

// Form state for notifications
const notificationForm = reactive({
    emailEnabled: true,
    marketingEnabled: false
})

const isSavingNotifications = ref(false)
const notificationUpdateSuccess = ref(false)

// Initialize form with user data when available
watch(() => user.value, (newUser) => {
    if (newUser) {
        profileForm.firstName = newUser.firstName || ''
        profileForm.lastName = newUser.lastName || ''
    }
}, { immediate: true })

// Check if hash in URL to set active tab and fetch notification settings
onMounted(async () => {
    // Set active tab based on URL hash
    const hash = window.location.hash.replace('#', '')
    if (hash === 'security' || hash === 'notifications') {
        activeTab.value = hash
    }
    
    // Only fetch notification settings if we're on the notifications tab
    if (activeTab.value === 'notifications') {
        try {
            await fetchSettings()
            // If we get here, settings.value should be populated from the composable
            if (settings.value) {
                notificationForm.emailEnabled = settings.value.emailEnabled
                notificationForm.marketingEnabled = settings.value.marketingEnabled
            }
        } catch (err) {
            console.error('Error fetching notification settings:', err)
            // Don't propagate the error to prevent the UI from showing an error message
            // for a non-critical feature
        }
    }
})

// Function to switch tabs and update URL
const switchTab = async (tab: string) => {
    activeTab.value = tab
    
    // Update URL with hash
    if (process.client) {
        const url = new URL(window.location.href)
        url.hash = tab === 'profile' ? '' : `#${tab}`
        window.history.pushState({}, '', url.toString())
    }
    
    // Fetch notification settings when switching to notifications tab
    if (tab === 'notifications') {
        try {
            await fetchSettings()
            // If we get here, settings.value should be populated from the composable
            if (settings.value) {
                notificationForm.emailEnabled = settings.value.emailEnabled
                notificationForm.marketingEnabled = settings.value.marketingEnabled
            }
        } catch (err) {
            console.error('Error fetching notification settings:', err)
            // Don't propagate the error to prevent the UI from showing an error message
            // for a non-critical feature
        }
    }
}

// Validate profile form
const validateProfileForm = () => {
    let isValid = true
    
    // Reset errors
    formErrors.firstName = ''
    formErrors.lastName = ''
    
    // Validate first name
    if (!profileForm.firstName.trim()) {
        formErrors.firstName = 'First name is required'
        isValid = false
    }
    
    // Validate last name
    if (!profileForm.lastName.trim()) {
        formErrors.lastName = 'Last name is required'
        isValid = false
    }
    
    return isValid
}

// Update profile
const updateUserProfile = async () => {
    if (!validateProfileForm()) return
    
    isUpdating.value = true
    updateSuccess.value = false
    
    try {
        await updateProfile({ 
            data: { 
                firstName: profileForm.firstName.trim(), 
                lastName: profileForm.lastName.trim() 
            } 
        })
        updateSuccess.value = true
        
        // Hide success message after 3 seconds
        setTimeout(() => {
            updateSuccess.value = false
        }, 3000)
    } catch (err: any) {
        console.error('Error updating profile:', err)
        
        // Handle validation errors from API
        if (err.details) {
            if (err.details.firstName) {
                formErrors.firstName = err.details.firstName[0]
            }
            if (err.details.lastName) {
                formErrors.lastName = err.details.lastName[0]
            }
        }
    } finally {
        isUpdating.value = false
    }
}

// Validate password form
const validatePasswordForm = () => {
    let isValid = true
    
    // Reset errors
    passwordErrors.currentPassword = ''
    passwordErrors.newPassword = ''
    passwordErrors.confirmPassword = ''
    
    // Validate current password
    if (!passwordForm.currentPassword) {
        passwordErrors.currentPassword = 'Current password is required'
        isValid = false
    }
    
    // Validate new password
    if (!passwordForm.newPassword) {
        passwordErrors.newPassword = 'New password is required'
        isValid = false
    } else if (passwordForm.newPassword.length < 8) {
        passwordErrors.newPassword = 'Password must be at least 8 characters'
        isValid = false
    }
    
    // Validate confirm password
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        passwordErrors.confirmPassword = 'Passwords do not match'
        isValid = false
    }
    
    return isValid
}

// Change password
const changeUserPassword = async () => {
    if (!validatePasswordForm()) return
    
    isChangingPassword.value = true
    passwordUpdateSuccess.value = false
    
    try {
        await changePassword({ 
            data: { 
                currentPassword: passwordForm.currentPassword, 
                newPassword: passwordForm.newPassword 
            } 
        })
        
        // Reset form
        passwordForm.currentPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
        
        passwordUpdateSuccess.value = true
        
        // Hide success message after 3 seconds
        setTimeout(() => {
            passwordUpdateSuccess.value = false
        }, 3000)
    } catch (err: any) {
        console.error('Error changing password:', err)
        
        // Handle validation errors from API
        if (err.code === 'INVALID_CREDENTIALS') {
            passwordErrors.currentPassword = 'Current password is incorrect'
        } else if (err.details) {
            if (err.details.currentPassword) {
                passwordErrors.currentPassword = err.details.currentPassword[0]
            }
            if (err.details.newPassword) {
                passwordErrors.newPassword = err.details.newPassword[0]
            }
        }
    } finally {
        isChangingPassword.value = false
    }
}

// Save notification settings
const saveNotificationSettings = async () => {
    isSavingNotifications.value = true
    notificationUpdateSuccess.value = false
    
    try {
        await updateSettings({
            emailEnabled: notificationForm.emailEnabled,
            marketingEnabled: notificationForm.marketingEnabled
        })
        
        notificationUpdateSuccess.value = true
        
        // Hide success message after 3 seconds
        setTimeout(() => {
            notificationUpdateSuccess.value = false
        }, 3000)
    } catch (err) {
        console.error('Error saving notification settings:', err)
    } finally {
        isSavingNotifications.value = false
    }
}
</script>
