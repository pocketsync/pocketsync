<template>
    <div class="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <!-- Sidebar component -->
        <div class="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-gradient-to-b from-white to-gray-50">
            <div class="flex flex-1 flex-col overflow-y-auto pt-6 pb-4">
                <div class="flex flex-shrink-0 items-center px-6">
                    <span
                        class="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">DeltaSync</span>
                </div>
                <nav class="mt-6 flex-1 space-y-1.5 px-3">
                    <NuxtLink v-for="item in navigation" :key="item.name" :to="item.href" :class="[
                        isActive(item.href)
                            ? 'bg-primary-50/80 text-primary-600 shadow-sm ring-1 ring-primary-100'
                            : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900',
                        'group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out'
                    ]">
                        <component :is="item.icon" :class="[
                        isActive(item.href) ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200 ease-in-out'
                    ]" />
                        {{ item.name }}
                    </NuxtLink>
                </nav>
            </div>
            <div class="flex flex-shrink-0 border-t border-gray-200 p-4">
                <div class="group block w-full flex-shrink-0">
                    <div class="flex items-center">
                        <div>
                            <div v-if="user.avatar_url" class="inline-block h-9 w-9 rounded-full">
                                <img :src="user.avatar_url" :alt="user.name" class="h-full w-full rounded-full" />
                            </div>
                            <div v-else
                                class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-100">
                                <span class="text-sm font-medium text-primary-600">{{ getUserInitials(user) }}</span>
                            </div>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-gray-700 group-hover:text-gray-900">{{ user.name }}</p>
                            <button @click="handleSignOut"
                                class="text-xs font-medium text-gray-500 group-hover:text-gray-700">Sign out</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import {
    PhBook,
    PhHouse,
} from '@phosphor-icons/vue'

const route = useRoute()

const navigation = [
    { name: 'Dashboard', href: '/console', icon: PhHouse },
    { name: 'Projects', href: '/console/projects', icon: PhBook },
]

// Sample user data - replace with actual user data from your auth system
const user = ref({
    name: 'John Doe',
    email: 'john@example.com',
    avatar_url: null
})

function isActive(href) {
    if (href === '/console') {
        // Dashboard should only be active when exactly on /console
        return route.path === href
    }
    // For other routes, check if the current path starts with the href
    return route.path.startsWith(href)
}

function getUserInitials(user) {
    return user.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
}

async function handleSignOut() {
    // Implement your sign out logic here
    console.log('Signing out...')
}
</script>