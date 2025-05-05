<template>
    <div class="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 dark:border-gray-700 dark:bg-gray-800">
        <div class="p-6 flex-1">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">{{ project.name }}</h3>
                <span class="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-400">
                    <span class="h-1.5 w-1.5 rounded-full bg-success-600 dark:bg-success-400"></span>
                    {{ project.stats.activeUsersToday }} active today
                </span>
            </div>
            <div class="space-y-3">
                <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <PhUsers class="h-4.5 w-4.5 text-gray-500 dark:text-gray-400 mr-2.5" />
                    <span>{{ project.stats.totalUsers }} registered users</span>
                </div>
                <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <PhDeviceMobile class="h-4.5 w-4.5 text-gray-500 dark:text-gray-400 mr-2.5" />
                    <span>{{ project.stats.onlineDevices }}/{{ project.stats.totalDevices }} devices online</span>
                </div>
                <div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <PhArrowsClockwise class="h-4.5 w-4.5 text-gray-500 dark:text-gray-400 mr-2.5" />
                    <span>{{ project.stats.totalChanges }} total changes</span>
                </div>
            </div>
        </div>
        <div class="bg-gray-50 px-6 py-3.5 border-t border-gray-100 dark:border-gray-700 dark:bg-gray-900/30">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <PhClock class="h-4 w-4" />
                    <span>Updated {{ formatDate(project.updatedAt) }}</span>
                </div>
                <NuxtLink :to="'/console/projects/' + project.id"
                    class="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 transition-colors">
                    View details
                    <svg class="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clip-rule="evenodd" />
                    </svg>
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { PhDeviceMobile, PhUsers, PhArrowsClockwise, PhClock } from '@phosphor-icons/vue'
import type { ProjectResponseDto } from '~/api-client'

const props = defineProps<{
    project: ProjectResponseDto
}>()

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString()
}
</script>