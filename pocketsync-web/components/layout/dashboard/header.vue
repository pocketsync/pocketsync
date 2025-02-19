<template>
    <div class="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow">
        <button type="button" @click="sidebarOpen = true"
            class="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden">
            <span class="sr-only">Open sidebar</span>
            <Bars3Icon class="h-6 w-6" aria-hidden="true" />
        </button>
        <div class="flex flex-1 justify-between px-4">
            <div class="flex flex-1">
                <!-- Search bar if needed -->
            </div>
            <div class="ml-4 flex items-center md:ml-6">
                <ProfileDropdown />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Bars3Icon } from '@heroicons/vue/24/outline'
import { useAuth } from '#auth'
import ProfileDropdown from './profile-dropdown.vue'

const sidebarOpen = defineModel('sidebarOpen')
</script>