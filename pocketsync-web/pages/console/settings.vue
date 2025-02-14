<template>
    <div>
        <div class="space-y-6">
            <!-- Account Preferences -->
            <div class="bg-white shadow-sm rounded-lg border border-gray-200">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg font-medium leading-6 text-gray-900">Account Preferences</h3>
                    <div class="mt-5 space-y-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <label class="text-sm font-medium text-gray-700">Language</label>
                                <p class="text-sm text-gray-500">Select your preferred language for the interface</p>
                            </div>
                            <select v-model="settings.language" class="rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6">
                                <option value="en">English</option>
                                <option value="fr">Français</option>
                                <option value="es">Español</option>
                            </select>
                        </div>
                        <div class="flex items-center justify-between">
                            <div>
                                <label class="text-sm font-medium text-gray-700">Time Zone</label>
                                <p class="text-sm text-gray-500">Choose your local time zone</p>
                            </div>
                            <select v-model="settings.timezone" class="rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6">
                                <option value="UTC">UTC</option>
                                <option value="America/New_York">Eastern Time</option>
                                <option value="America/Los_Angeles">Pacific Time</option>
                                <option value="Europe/London">London</option>
                                <option value="Europe/Paris">Paris</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 text-right sm:px-6 border-t border-gray-100">
                    <button class="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                        Save preferences
                    </button>
                </div>
            </div>

            <!-- Notification Settings -->
            <div class="bg-white shadow-sm rounded-lg border border-gray-200">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg font-medium leading-6 text-gray-900">Notification Settings</h3>
                    <div class="mt-5 space-y-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <label class="text-sm font-medium text-gray-700">Email Notifications</label>
                                <p class="text-sm text-gray-500">Receive important updates via email</p>
                            </div>
                            <div class="relative inline-block w-10 mr-2 align-middle select-none">
                                <input type="checkbox" v-model="settings.emailNotifications" class="sr-only" />
                                <div class="block h-6 bg-gray-200 rounded-full w-10"></div>
                                <div :class="[settings.emailNotifications ? 'translate-x-4' : 'translate-x-0', 'absolute left-1 top-1 inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out']"></div>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <div>
                                <label class="text-sm font-medium text-gray-700">Push Notifications</label>
                                <p class="text-sm text-gray-500">Get real-time notifications in your browser</p>
                            </div>
                            <div class="relative inline-block w-10 mr-2 align-middle select-none">
                                <input type="checkbox" v-model="settings.pushNotifications" class="sr-only" />
                                <div class="block h-6 bg-gray-200 rounded-full w-10"></div>
                                <div :class="[settings.pushNotifications ? 'translate-x-4' : 'translate-x-0', 'absolute left-1 top-1 inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out']"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 text-right sm:px-6 border-t border-gray-100">
                    <button class="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                        Update notifications
                    </button>
                </div>
            </div>

            <!-- Security Options -->
            <div class="bg-white shadow-sm rounded-lg border border-gray-200">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg font-medium leading-6 text-gray-900">Security Options</h3>
                    <div class="mt-5 space-y-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <label class="text-sm font-medium text-gray-700">Two-Factor Authentication</label>
                                <p class="text-sm text-gray-500">Add an extra layer of security to your account</p>
                            </div>
                            <div class="relative inline-block w-10 mr-2 align-middle select-none">
                                <input type="checkbox" v-model="settings.twoFactorEnabled" class="sr-only" />
                                <div class="block h-6 bg-gray-200 rounded-full w-10"></div>
                                <div :class="[settings.twoFactorEnabled ? 'translate-x-4' : 'translate-x-0', 'absolute left-1 top-1 inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out']"></div>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <div>
                                <label class="text-sm font-medium text-gray-700">Session Management</label>
                                <p class="text-sm text-gray-500">Manage your active sessions</p>
                            </div>
                            <button class="text-sm text-primary-600 hover:text-primary-500 font-medium">
                                View active sessions
                            </button>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 text-right sm:px-6 border-t border-gray-100">
                    <button class="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                        Save security settings
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

// Settings data
const settings = ref({
    language: 'en',
    timezone: 'UTC',
    emailNotifications: true,
    pushNotifications: false,
    twoFactorEnabled: false
})
</script>