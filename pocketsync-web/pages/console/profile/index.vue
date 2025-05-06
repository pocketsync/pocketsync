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
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">View and manage your account information</p>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="animate-pulse space-y-6">
            <div class="flex items-center space-x-6">
                <div class="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div class="space-y-3 flex-1">
                    <div class="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div class="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
            </div>
            <div class="space-y-4">
                <div class="h-10 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                <div class="h-10 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                <div class="h-10 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
            </div>
        </div>

        <!-- Error Alert -->
        <div v-else-if="error" class="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400 dark:text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error loading profile</h3>
                    <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                        <p>{{ error.message }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Profile Content -->
        <div v-else-if="user" class="space-y-8">
            <!-- Profile Header with Avatar -->
            <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div
                    class="h-24 w-24 overflow-hidden rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-600 text-3xl font-medium">
                    <img v-if="user.avatarUrl" :src="user.avatarUrl" alt="Profile picture"
                        class="h-full w-full object-cover" />
                    <span v-else>{{ getUserInitials(user) }}</span>
                </div>

                <div class="text-center sm:text-left">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ user.firstName }} {{ user.lastName }}
                    </h2>
                    <div class="mt-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div
                            class="flex items-center justify-center sm:justify-start gap-1 text-gray-500 dark:text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20"
                                fill="currentColor">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            <span>{{ user.email }}</span>
                        </div>
                        <div v-if="user.isEmailVerified"
                            class="flex items-center justify-center sm:justify-start gap-1 text-green-600 dark:text-green-400 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20"
                                fill="currentColor">
                                <path fill-rule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clip-rule="evenodd" />
                            </svg>
                            <span>Verified</span>
                        </div>
                        <div v-else
                            class="flex items-center justify-center sm:justify-start gap-1 text-yellow-600 dark:text-yellow-400 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20"
                                fill="currentColor">
                                <path fill-rule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clip-rule="evenodd" />
                            </svg>
                            <span>Not verified</span>
                            <button @click="sendVerification"
                                class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline text-xs ml-1">
                                Resend verification
                            </button>
                        </div>
                    </div>
                    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Account created on {{ formatDate(user.createdAt) }}
                    </p>
                </div>
            </div>

            <!-- Action Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Edit Profile Card -->
                <div
                    class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div class="flex items-center">
                        <div
                            class="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center dark:bg-primary-900/30">
                            <svg xmlns="http://www.w3.org/2000/svg"
                                class="h-5 w-5 text-primary-600 dark:text-primary-400" viewBox="0 0 20 20"
                                fill="currentColor">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                    clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-base font-medium text-gray-900 dark:text-white">Edit Profile</h3>
                            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Update your name and personal
                                information</p>
                        </div>
                    </div>
                    <div class="mt-4">
                        <NuxtLink to="/console/profile/settings"
                            class="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-600">
                            Edit profile
                        </NuxtLink>
                    </div>
                </div>

                <!-- Security Card -->
                <div
                    class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div class="flex items-center">
                        <div
                            class="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center dark:bg-primary-900/30">
                            <svg xmlns="http://www.w3.org/2000/svg"
                                class="h-5 w-5 text-primary-600 dark:text-primary-400" viewBox="0 0 20 20"
                                fill="currentColor">
                                <path fill-rule="evenodd"
                                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                    clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-base font-medium text-gray-900 dark:text-white">Security</h3>
                            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your password and account
                                security</p>
                        </div>
                    </div>
                    <div class="mt-4">
                        <NuxtLink to="/console/profile/settings#security"
                            class="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-600">
                            Security settings
                        </NuxtLink>
                    </div>
                </div>

                <!-- Notifications Card -->
                <div
                    class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div class="flex items-center">
                        <div
                            class="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center dark:bg-primary-900/30">
                            <svg xmlns="http://www.w3.org/2000/svg"
                                class="h-5 w-5 text-primary-600 dark:text-primary-400" viewBox="0 0 20 20"
                                fill="currentColor">
                                <path
                                    d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-base font-medium text-gray-900 dark:text-white">Notifications</h3>
                            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Customize your notification
                                preferences</p>
                        </div>
                    </div>
                    <div class="mt-4">
                        <NuxtLink to="/console/profile/settings#notifications"
                            class="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-600">
                            Notification settings
                        </NuxtLink>
                    </div>
                </div>
            </div>

            <!-- Verification Email Sent Alert -->
            <div v-if="verificationEmailSent" class="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-green-800 dark:text-green-200">Verification email sent
                            successfully!</p>
                        <p class="mt-2 text-sm text-green-700 dark:text-green-300">Please check your inbox and follow
                            the instructions to verify your email address.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useUtils } from '~/composables/useUtils'

definePageMeta({
    layout: 'dashboard-index'
})

useHead({
    title: 'Profile - PocketSync'
})

const { user, isLoading, error, sendEmailVerification } = useAuth()
const { getUserInitials, formatDate } = useUtils()
const verificationEmailSent = ref(false)

const sendVerification = async () => {
    try {
        await sendEmailVerification()
        verificationEmailSent.value = true

        setTimeout(() => {
            verificationEmailSent.value = false
        }, 5000)
    } catch (err) {
        console.error('Error sending verification email:', err)
    }
}
</script>