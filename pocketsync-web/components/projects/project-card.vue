<template>
    <div class="relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div class="p-6 flex-1">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ project.name }}</h3>
                <span
                    class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    {{ project.stats.activeUsersToday }} active today
                </span>
            </div>
            <div class="mt-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <PhUsers class="h-5 w-5 text-gray-400 dark:text-gray-600" />
                        <span class="text-sm text-gray-500 dark:text-gray-400">{{ project.stats.totalUsers }} registered users</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="bg-gray-50 px-6 py-4 dark:bg-gray-700">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <PhDeviceMobile class="h-5 w-5" />
                    <span>{{ project.stats.totalDevices }} devices</span>
                </div>
                <NuxtLink :to="'/console/projects/' + project.id"
                    class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
                    View details
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { PhDeviceMobile, PhUsers } from '@phosphor-icons/vue'

const props = defineProps<{
    project: ProjectResponseDto
}>()
</script>