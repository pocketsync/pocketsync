<template>
    <div>
        <!-- Recent Activity Section -->
        <div class="mt-8">
            <div class="sm:flex sm:items-center">
                <div class="sm:flex-auto">
                    <h2 class="text-base font-semibold leading-6 text-gray-900">Recent Activity</h2>
                    <p class="mt-2 text-sm text-gray-700">A list of all recent activity in your project.</p>
                </div>
            </div>

            <div class="mt-8 flow-root">
                <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div class="overflow-hidden border border-gray-200 rounded-lg">
                            <div class="px-4 sm:px-6 lg:px-8 py-4">
                            <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Event</th>
                                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">User</th>
                                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                <tr v-for="activity in recentActivity" :key="activity.id">
                                    <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-0">
                                        <div class="flex items-center">
                                            <component :is="activity.icon" class="h-5 w-5 text-gray-400 mr-3" />
                                            {{ activity.event }}
                                        </div>
                                    </td>
                                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        <div class="flex items-center">
                                            <img v-if="activity.user.avatar_url" :src="activity.user.avatar_url" class="h-6 w-6 rounded-full" :alt="activity.user.first_name" />
                                            <div v-else class="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                                                <span class="text-xs font-medium text-primary-600">
                                                    {{ getUserInitials(activity.user) }}
                                                </span>
                                            </div>
                                            <span class="ml-2 text-sm text-gray-900">{{ activity.user.first_name }} {{ activity.user.last_name }}</span>
                                        </div>
                                    </td>
                                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        {{ formatDate(activity.date) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { PhUsers, PhDevices, PhKey, PhUserPlus, PhDownload } from '@phosphor-icons/vue'

const stats = [
    { name: 'Total Users', stat: '71,897', icon: PhUsers },
    { name: 'Total Devices', stat: '58.16%', icon: PhDevices },
    { name: 'Active Auth Tokens', stat: '24.57%', icon: PhKey },
]

const recentActivity = [
    {
        id: 1,
        event: 'New user joined',
        user: {
            first_name: 'John',
            last_name: 'Doe',
            avatar_url: null
        },
        date: '2024-01-23T12:00:00Z',
        icon: PhUserPlus
    },
    {
        id: 2,
        event: 'Data synced',
        user: {
            first_name: 'Jane',
            last_name: 'Smith',
            avatar_url: null
        },
        date: '2024-01-22T15:30:00Z',
        icon: PhDownload
    },
]

function getUserInitials(user) {
    return `${user.first_name[0]}${user.last_name[0]}`
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}
</script>