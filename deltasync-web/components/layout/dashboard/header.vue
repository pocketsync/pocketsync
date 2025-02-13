<template>
    <header class="bg-gradient-to-r from-white to-gray-50 shadow-sm border-b border-gray-200">
        <div class="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <h1 class="text-xl font-bold text-gray-900">Dashboard</h1>
            <div class="ml-4 flex items-center md:ml-6">
                <!-- Profile dropdown -->
                <div class="relative ml-3">
                    <div>
                        <button @click="userMenuOpen = !userMenuOpen" type="button"
                            class="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                            <span class="sr-only">Open user menu</span>
                            <div
                                class="h-8 w-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-600 font-medium transform transition-all duration-200 hover:scale-105 hover:shadow-sm">
                                JS
                            </div>
                        </button>
                    </div>
                    <div v-if="userMenuOpen"
                        class="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transform transition-all duration-200 ease-out">
                        <div class="px-4 py-2 border-b border-gray-100">
                            <p class="text-sm font-medium text-gray-900">John Smith</p>
                            <p class="text-xs text-gray-500">john@example.com</p>
                        </div>
                        <NuxtLink to="/console/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Your Profile
                        </NuxtLink>
                        <NuxtLink to="/console/settings"
                            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</NuxtLink>
                        <button @click="handleSignOut"
                            class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">Sign
                            out</button>
                    </div>
                </div>
            </div>
        </div>
    </header>
</template>

<script setup>
import { ref } from 'vue'

const userMenuOpen = ref(false)

async function handleSignOut() {
    try {
        // TODO: Implement sign out logic
        console.log('Sign out clicked')
    } catch (error) {
        console.error('Sign out error:', error)
    }
}
</script>