<template>
    <div class="container mx-auto px-4 py-6">
        <PageBreadcrumb :pageTitle="currentProject?.name || 'Project details'" :items="[
            { label: 'Projects', path: '/console' },
            { label: 'Project details', path: '#' }
        ]" />

        <div v-if="isLoading" class="animate-pulse space-y-6 mt-6">
            <div class="h-8 w-1/3 bg-gray-200 rounded dark:bg-gray-700"></div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div v-for="i in 3" :key="i" class="h-32 bg-gray-200 rounded dark:bg-gray-700"></div>
            </div>
        </div>

        <div v-else-if="error" class="mt-6">
            <ErrorAlert :error="error" title="Error loading project details" />
        </div>

        <div v-else-if="currentProject" class="mt-6 space-y-8">
            <!-- Key Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] rounded-lg shadow">
                    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">App users</h3>
                    <p class="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{{
                        currentProject.stats.totalUsers || 0 }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        <span class="text-green-500">+{{ currentProject.stats.activeUsersToday || 0 }}</span> in last 7
                        days
                    </p>
                </div>

                <div class="border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] rounded-lg shadow">
                    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Online devices</h3>
                    <p class="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{{
                        currentProject.stats.onlineDevices || 0 }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        {{ currentProject.stats.totalDevices || 0 }} total devices
                    </p>
                </div>

                <div class="border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] rounded-lg shadow">
                    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Last sync</h3>
                    <p class="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                        {{ currentProject.stats.lastSync ? formatDistanceToNow(new Date(currentProject.stats.lastSync))
                        : 'Never' }}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        {{ currentProject.stats.lastSync ? format(new Date(currentProject.stats.lastSync), 'MMM d, yyyy HH:mm') : 'No sync data' }}
                    </p>
                </div>
            </div>

            <!-- Sync Stats -->
            <div class="border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] rounded-lg shadow">
                <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Sync performance</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div class="flex justify-between mb-2">
                            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Success rate</h3>
                            <span class="text-sm font-medium text-green-600 dark:text-green-400">{{
                                currentProject.stats.syncSuccessRate || 0 }}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div class="bg-green-600 h-2.5 rounded-full"
                                :style="`width: ${currentProject.stats.syncSuccessRate || 0}%`"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between mb-2">
                            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Failure rate</h3>
                            <span class="text-sm font-medium text-red-600 dark:text-red-400">{{
                                currentProject.stats.syncFailureRate || 0 }}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div class="bg-red-600 h-2.5 rounded-full"
                                :style="`width: ${currentProject.stats.syncFailureRate || 0}%`"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sync Activity Chart -->
            <div
                class="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
                <div class="flex flex-wrap items-start justify-between gap-5">
                    <div>
                        <h3 class="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
                            Sync activity
                        </h3>
                        <span class="block text-theme-sm text-gray-500 dark:text-gray-400">
                            Sync activity of last {{ timeRange }}
                        </span>
                    </div>

                    <div x-data="{selected: '24h'}"
                        class="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
                        <button v-for="timeRangeOption in timeRangeOptions" :key="timeRangeOption.value" @click="timeRange = timeRangeOption.value"
                            :class="timeRange === timeRangeOption.value ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800' : 'text-gray-500 dark:text-gray-400'"
                            class=":hover:text-white rounded-md px-3 py-2 text-theme-sm font-medium hover:text-gray-900 text-gray-500 dark:text-gray-400">
                            {{ timeRangeOption.label }}
                        </button>
                    </div>
                </div>
                <div :class="{'custom-scrollbar max-w-full overflow-x-auto': syncActivity, 'flex items-center justify-center': !syncActivity}" class="h-80 mt-4">
                    <SyncActivityChart 
                        v-if="syncActivity" 
                        :activity-data="getSyncActivityData(timeRange)" 
                        :time-range="timeRange"
                    />
                    <div v-if="isLoadingActivity" class="flex items-center justify-center h-full">
                        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { format, formatDistanceToNow } from 'date-fns';
import PageBreadcrumb from '~/components/common/page-breadcrumb.vue';
import { useProjectsStore } from '~/stores/projectsStore';
import ErrorAlert from '~/components/common/error-alert.vue';
import SyncActivityChart from '~/components/charts/SyncActivityChart.vue';

definePageMeta({
    layout: 'dashboard',
    middleware: 'auth'
});

enum TimeRange {
    H24 = '24h',
    D7 = '7d',
    D30 = '30d'
}

const route = useRoute();
const projectsStore = useProjectsStore();
const timeRange = ref<TimeRange>(TimeRange.H24);
const isLoadingActivity = ref(false);

const timeRangeOptions = [
    { value: TimeRange.H24, label: '24 hours' },
    { value: TimeRange.D7, label: '7 days' },
    { value: TimeRange.D30, label: '30 days' }
];

const projectId = route.params.id as string;
const { isLoading, error, currentProject, syncActivity } = storeToRefs(projectsStore);

// Function to get the appropriate sync activity data based on the selected time range
const getSyncActivityData = (selectedRange: TimeRange) => {
    if (!syncActivity.value) return [];
    
    switch (selectedRange) {
        case TimeRange.H24:
            return syncActivity.value.last24h.data;
        case TimeRange.D7:
            return syncActivity.value.last7d.data;
        case TimeRange.D30:
            return syncActivity.value.last30d.data;
        default:
            return syncActivity.value.last24h.data;
    }
};

onMounted(async () => {
    try {
        isLoadingActivity.value = true;
        await projectsStore.fetchProjectById(projectId);
        await projectsStore.getSyncActivity(projectId);
    } catch (err) {
        console.error('Error loading project data:', err);
    } finally {
        isLoadingActivity.value = false;
    }
});
</script>
