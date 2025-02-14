<template>
    <div class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt class="truncate text-sm font-medium text-gray-500">Total Users</dt>
            <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{{ stats.totalUsers }}</dd>
            <dd class="mt-2 flex items-center text-sm text-gray-600">
                <component :is="UsersIcon" class="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                <span>{{ stats.activeUsers }} active today</span>
            </dd>
        </div>

        <div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt class="truncate text-sm font-medium text-gray-500">Connected Devices</dt>
            <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{{ stats.totalDevices }}</dd>
            <dd class="mt-2 flex items-center text-sm text-gray-600">
                <component :is="DevicesIcon" class="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                <span>{{ stats.activeDevices }} online now</span>
            </dd>
        </div>

        <div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt class="truncate text-sm font-medium text-gray-500">Changes Today</dt>
            <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{{ stats.changesCount }}</dd>
            <dd class="mt-2 flex items-center text-sm text-gray-600">
                <component :is="SyncIcon" class="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                <span>{{ stats.pendingChanges }} pending sync</span>
            </dd>
        </div>
    </div>
</template>

<script setup lang="ts">
import { PhUsers, PhDeviceMobile, PhArrowsClockwise } from '@phosphor-icons/vue'

const UsersIcon = PhUsers
const DevicesIcon = PhDeviceMobile
const SyncIcon = PhArrowsClockwise

defineProps<{
    stats: {
        totalUsers: number
        activeUsers: number
        totalDevices: number
        activeDevices: number
        changesCount: number
        pendingChanges: number
    }
}>()
</script>