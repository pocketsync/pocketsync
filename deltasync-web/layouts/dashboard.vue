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
                <div
                    class="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-gradient-to-b from-white to-gray-50">
                    <div class="flex flex-1 flex-col overflow-y-auto pt-6 pb-4">
                        <div class="flex flex-shrink-0 items-center px-6">
                            <span
                                class="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">DeltaSync</span>
                        </div>
                        <nav class="mt-6 flex-1 space-y-1.5 px-3">
                            <NuxtLink v-for="item in navigationLinks" :key="item.name" :to="item.to" :class="[
            route.path === item.to
                ? 'bg-primary-50/80 text-primary-600 shadow-sm ring-1 ring-primary-100'
                : 'text-gray-600 hover:bg-gray-50/80 hover:text-gray-900',
            'group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out'
        ]">
                                <component :is="item.icon" :class="[
            route.path === item.to ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500',
            'mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200 ease-in-out'
        ]" />
                                {{ item.name }}
                                <component v-if="item.external" :is="ExternalLinkIcon"
                                    class="ml-2 h-4 w-4 text-gray-400" />
                            </NuxtLink>
                        </nav>
                    </div>
                </div>
            </div>
        </div>

        <!-- Static sidebar for desktop -->
        <DashboardSidebar />

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
            <DashboardHeader />

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

import DashboardSidebar from '~/components/layout/dashboard/sidebar.vue'
import DashboardHeader from '~/components/layout/dashboard/header.vue'

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

useHead({
    title: 'DeltaSync Console'
})
</script>