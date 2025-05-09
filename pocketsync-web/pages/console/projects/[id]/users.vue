<template>
    <div class="space-y-6">
        <PageBreadcrumb :items="[
                { name: 'Projects', to: '/console/projects' },
                { name: projectId, to: `/console/projects/${projectId}` },
                { name: 'Users', to: `/console/projects/${projectId}/users` },
            ]" pageTitle="App users" />

        <div class="mb-4 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
            <div class="relative w-full sm:w-64">
                <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input type="text" v-model="searchQuery"
                    class="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    placeholder="Search users..." />
            </div>
            <button @click="refreshUsers"
                class="inline-flex items-center justify-center rounded-lg border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
            </button>
        </div>

        <div>
            <div v-if="isLoading && filteredUsers.length === 0" class="flex justify-center items-center py-8">
                <div class="animate-spin">
                    <svg xmlns="http://www.w3.org/2000/svg" class="text-primary-500 h-8 w-8" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </div>
            </div>

            <div v-else-if="!appUsers?.data?.length" class="py-8 text-center">
                <p class="text-slate-500 dark:text-slate-400">
                    {{ searchQuery ? 'No matching users found.' : 'No users found for this project.' }}
                </p>
            </div>

            <div v-else>
                <div
                    class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                    <div class="max-w-full overflow-x-auto custom-scrollbar">
                        <table class="min-w-full">
                            <thead>
                                <tr>
                                    <th class="px-5 py-3 text-left sm:px-6">
                                        <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">User
                                            Identifier</p>
                                    </th>
                                    <th class="px-5 py-3 text-left sm:px-6">
                                        <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Devices
                                        </p>
                                    </th>
                                    <th class="px-5 py-3 text-left sm:px-6">
                                        <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Created At
                                        </p>
                                    </th>
                                    <th class="px-5 py-3 text-left sm:px-6">
                                        <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Status</p>
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                <tr v-for="user in filteredUsers" :key="user.userIdentifier"
                                    class="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                                    <td class="px-5 py-4 sm:px-6">
                                        <div class="flex items-center">
                                            <div class="flex-1 text-start">
                                                <h4
                                                    class="text-sm font-medium text-slate-700 whitespace-nowrap dark:text-slate-300">
                                                    {{ user.userIdentifier }}</h4>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4 sm:px-6">
                                        <div class="flex items-center space-x-2">
                                            <span
                                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-800/20 dark:text-primary-400">
                                                {{ user.devices.length }} device{{ user.devices.length !== 1 ? 's' : ''
                                                }}
                                            </span>
                                            <button v-if="user.devices.length > 0"
                                                @click="toggleDeviceDetails(user.userIdentifier)"
                                                class="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-xs font-medium">
                                                {{ expandedUsers.includes(user.userIdentifier) ? 'Hide' : 'View' }}
                                            </button>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4 sm:px-6">
                                        <div class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                            {{ formatDate(user.createdAt) }}
                                        </div>
                                    </td>
                                    <td class="px-5 py-4 sm:px-6">
                                        <div>
                                            <span v-if="!user.deletedAt"
                                                class="inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400">
                                                Active
                                            </span>
                                            <span v-else
                                                class="inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400">
                                                Deleted
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                                <!-- Device details expansion -->
                                <tr v-for="user in filteredUsers" :key="`${user.userIdentifier}-details`"
                                    v-show="expandedUsers.includes(user.userIdentifier)"
                                    class="bg-gray-50 dark:bg-slate-700/30">
                                    <td colspan="5" class="px-5 py-4 sm:px-6">
                                        <div class="space-y-3">
                                            <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300">Device
                                                details
                                            </h4>
                                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <div v-for="device in user.devices" :key="device.deviceId"
                                                    class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                                    <div class="flex justify-between items-start">
                                                        <div class="flex items-center gap-2">
                                                            <div class="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]"
                                                                :title="device.deviceId">{{ device.deviceId }}</div>
                                                            <button @click="copyToClipboard(device.deviceId)"
                                                                class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-150">
                                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4"
                                                                    fill="none" viewBox="0 0 24 24"
                                                                    stroke="currentColor">
                                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                                        stroke-width="2"
                                                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                        <span :class="{
            'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400': device.lastSyncStatus === 'SUCCESS',
            'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400': device.lastSyncStatus === 'FAILED',
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400': device.lastSyncStatus === 'IN_PROGRESS'
        }" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-black dark:text-white">
                                                            {{ device.lastSyncStatus || 'UNKNOWN' }}
                                                        </span>
                                                    </div>
                                                    <div class="mt-2 grid grid-cols-2 gap-2 text-xs">
                                                        <div>
                                                            <span class="text-gray-500 dark:text-gray-400">Last
                                                                Seen:</span>
                                                            <div class="text-gray-900 dark:text-white">{{
                                                                device.lastSeenAt
                                                                ? formatDate(device.lastSeenAt) : 'Never' }}</div>
                                                        </div>
                                                        <div>
                                                            <span class="text-gray-500 dark:text-gray-400">Last
                                                                Change:</span>
                                                            <div class="text-gray-900 dark:text-white">{{
                                                                device.lastChangeAt ? formatDate(device.lastChangeAt) :
                                                                'Never' }}</div>
                                                        </div>
                                                        <div class="col-span-2">
                                                            <span
                                                                class="text-gray-500 dark:text-gray-400">Created:</span>
                                                            <div class="text-gray-900 dark:text-white">{{
                                                                formatDate(device.createdAt) }}</div>
                                                        </div>
                                                        <div class="col-span-2">
                                                            <span class="text-gray-500 dark:text-gray-400">Device
                                                                Info:</span>
                                                            <div v-if="device.deviceInfo"
                                                                class="mt-1 grid grid-cols-1 gap-1">
                                                                <template v-if="typeof device.deviceInfo === 'object'">
                                                                    <div v-for="(value, key) in device.deviceInfo"
                                                                        :key="key" class="flex">
                                                                        <span
                                                                            class="font-medium mr-2 text-gray-700 dark:text-gray-300">{{
                                                                            formatInfoKey(key) }}:</span>
                                                                        <span
                                                                            class="text-gray-900 dark:text-white truncate">{{
                                                                            value }}</span>
                                                                    </div>
                                                                </template>
                                                                <div v-else
                                                                    class="text-gray-900 dark:text-white truncate">
                                                                    {{ device.deviceInfo }}
                                                                </div>
                                                            </div>
                                                            <div v-else class="text-gray-900 dark:text-white">
                                                                No info available
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div v-if="appUsers && appUsers.totalPages && appUsers.totalPages > 1"
                        class="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 px-4 py-3 sm:px-6">
                        <!-- Load More Button (similar to conflicts table) -->
                        <div v-if="appUsers && appUsers.totalPages > 1" class="mt-6 flex justify-center pb-4">
                            <button @click="prevPage" :disabled="currentPage === 1"
                                class="px-4 py-2 text-primary-600 font-medium hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 flex items-center mr-2"
                                :class="currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 19l-7-7 7-7" />
                                </svg>
                                Previous
                            </button>
                            <div class="flex items-center px-4">
                                <span class="text-sm text-gray-700 dark:text-gray-300">
                                    Page {{ currentPage }} of {{ appUsers.totalPages }}
                                </span>
                            </div>
                            <button @click="nextPage" :disabled="currentPage === appUsers.totalPages"
                                class="px-4 py-2 text-primary-600 font-medium hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 flex items-center"
                                :class="currentPage === appUsers.totalPages ? 'opacity-50 cursor-not-allowed' : ''">
                                Next
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        <!-- Loading indicator when loading more -->
                        <div v-if="isLoading && filteredUsers.length > 0" class="py-4 flex justify-center">
                            <div class="animate-spin">
                                <svg xmlns="http://www.w3.org/2000/svg" class="text-primary-500 h-6 w-6" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted } from 'vue';
    import PageBreadcrumb from '~/components/common/page-breadcrumb.vue';
    import { useProjectsStore } from '~/stores/projectsStore';
    import type { AppUserDto } from '~/api-client';

    const route = useRoute();
    const projectId = route.params.id as string;
    const projectsStore = useProjectsStore();
    const isLoading = computed(() => projectsStore.isLoading);
    const appUsers = computed(() => projectsStore.appUsers);

    const currentPage = ref(1);
    const pageSize = ref(10);
    const searchQuery = ref('');
    const expandedUsers = ref < string[] > ([]);

    const filteredUsers = computed(() => {
        if (!appUsers.value?.data) return [];
        if (!searchQuery.value) return appUsers.value.data;

        const query = searchQuery.value.toLowerCase();
        return appUsers.value.data.filter(user => {
            return user.userIdentifier.toLowerCase().includes(query) ||
                user.devices.some(device => device.deviceId.toLowerCase().includes(query));
        });
    });

    const paginationRange = computed(() => {
        if (!appUsers.value || !appUsers.value.totalPages) return [];

        const totalPages = appUsers.value.totalPages;
        const current = currentPage.value;
        const delta = 1; // Number of pages to show before and after current page

        let range = [];

        for (let i = Math.max(2, current - delta); i <= Math.min(totalPages - 1, current + delta); i++) {
            range.push(i);
        }

        if (current - delta > 2) range.unshift('...');
        if (current + delta < totalPages - 1) range.push('...');

        range.unshift(1);
        if (totalPages > 1) range.push(totalPages);

        return range;
    });

    const fetchUsers = async () => {
        try {
            await projectsStore.getAppUsers(projectId, currentPage.value, pageSize.value);
        } catch (error) {
            console.error('Error fetching app users:', error);
        }
    };

    const refreshUsers = () => {
        fetchUsers();
    };

    const prevPage = () => {
        if (currentPage.value > 1) {
            currentPage.value--;
            fetchUsers();
        }
    };

    const nextPage = () => {
        if (appUsers.value && currentPage.value < appUsers.value.totalPages!) {
            currentPage.value++;
            fetchUsers();
        }
    };

    const goToPage = (page: number | string) => {
        if (typeof page === 'number') {
            currentPage.value = page;
            fetchUsers();
        }
    };

    const toggleDeviceDetails = (userId: string) => {
        if (expandedUsers.value.includes(userId)) {
            expandedUsers.value = expandedUsers.value.filter(id => id !== userId);
        } else {
            expandedUsers.value.push(userId);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    onMounted(() => {
        fetchUsers();
    });

    definePageMeta({
        layout: 'dashboard',
        middleware: 'auth'
    });

    function formatInfoKey(key: string): string {
        return key.replace(/([A-Z])/g, ' $1').trim().replace(/\s+/g, '-').toLowerCase();
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        useToast().success('Device ID copied to clipboard');
    }
</script>