<template>
    <div class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt class="truncate text-sm font-medium text-gray-500">Total Users</dt>
            <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{{ stats.totalUsers || 0 }}</dd>
            <dd class="mt-2 flex items-center text-sm text-gray-600">
                <PhUsers class="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                <span>{{ stats.activeUsersToday || 0 }} active today</span>
            </dd>
        </div>

        <div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt class="truncate text-sm font-medium text-gray-500">Connected Devices</dt>
            <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{{ stats.totalDevices || 0 }}</dd>
            <dd class="mt-2 flex items-center text-sm text-gray-600">
                <PhDeviceMobile class="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                <span>{{ stats.onlineDevices || 0 }} online now</span>
            </dd>
        </div>

        <div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt class="truncate text-sm font-medium text-gray-500">Changes</dt>
            <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{{ stats.totalChanges || 0 }}</dd>
            <dd class="mt-2 flex items-center text-sm text-gray-600">
                <PhArrowsClockwise class="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                <span>{{ stats.pendingChanges || 0 }} pending sync</span>
            </dd>
        </div>
    </div>
</template>

<script setup lang="ts">
import { PhUsers, PhDeviceMobile, PhArrowsClockwise } from '@phosphor-icons/vue'

const props = defineProps<{
    stats: {
        totalUsers: number
        activeUsersToday: number
        totalDevices: number
        onlineDevices: number
        totalChanges: number
        pendingChanges: number,
    }
}>()
</script>