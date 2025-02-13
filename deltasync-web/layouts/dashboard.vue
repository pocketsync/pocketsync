<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Mobile sidebar overlay -->
        <div v-if="sidebarOpen" class="fixed inset-0 z-40 flex md:hidden">
            <div class="fixed inset-0 bg-gray-600 bg-opacity-75" @click="sidebarOpen = false"></div>
            <div class="relative flex w-full max-w-xs flex-1 flex-col bg-white">
                <div class="absolute top-0 right-0 -mr-12 pt-2">
                    <button @click="sidebarOpen = false"
                        class="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                        <component :is="CloseMenuIcon" weight="bold" class="h-6 w-6 text-white" />
                    </button>
                </div>
                <LayoutDashboardSidebar />
            </div>
        </div>

        <!-- Static sidebar for desktop -->
        <LayoutDashboardSidebar />

        <div class="flex flex-1 flex-col md:pl-64">
            <!-- Top header -->
            <div class="sticky top-0 z-10 bg-white pl-1 pt-1 sm:pl-3 sm:pt-3 md:hidden">
                <button @click="sidebarOpen = true"
                    class="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
                    <span class="sr-only">Open sidebar</span>
                    <component :is="OpenMenuIcon" weight="bold" class="h-6 w-6" />
                </button>
            </div>

            <!-- Header -->
            <header class="bg-white shadow">
                <div class="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <h1 class="text-lg font-semibold text-gray-900">Dashboard</h1>
                    <div class="ml-4 flex items-center md:ml-6">
                        <!-- Profile dropdown -->
                        <div class="relative ml-3">
                            <div>
                                <button @click="userMenuOpen = !userMenuOpen" type="button"
                                    class="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                                    <span class="sr-only">Open user menu</span>
                                    <div
                                        class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                                        JS
                                    </div>
                                </button>
                            </div>
                            <div v-if="userMenuOpen"
                                class="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <NuxtLink to="/console/profile"
                                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile
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

            <main class="flex-1">
                <div class="py-6">
                    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <slot />
                    </div>
                </div>
            </main>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { PhList, PhX } from '@phosphor-icons/vue'
import { PhBook, PhCode, PhFolder, PhArrowSquareOut } from '@phosphor-icons/vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const OpenMenuIcon = PhList
const CloseMenuIcon = PhX
const sidebarOpen = ref(false)
const userMenuOpen = ref(false)

const navigationLinks = [
    {
        name: 'Dashboard',
        to: '/console',
        icon: PhCode
    },
    {
        name: 'Projects',
        to: '/console/projects',
        icon: PhFolder
    },
    {
        name: 'Documentation',
        to: 'https://docs.deltasync.io',
        icon: PhBook,
        external: true
    }
]

const ExternalLinkIcon = PhArrowSquareOut

// Close menus when clicking outside
onMounted(() => {
    document.addEventListener('click', (event) => {
        const target = event.target
        if (!target.closest('.user-menu')) {
            userMenuOpen.value = false
        }
    })
})

async function handleSignOut() {
    try {
        // TODO: Implement sign out logic
        console.log('Sign out clicked')
    } catch (error) {
        console.error('Sign out error:', error)
    }
}
</script>