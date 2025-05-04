<template>
    <div>
        <!-- Loading State -->
        <div v-if="isLoading" class="mt-8 flow-root">
            <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <div class="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div class="px-4 sm:px-6 lg:px-8 py-4">
                            <div class="animate-pulse space-y-4">
                                <div v-for="i in 3" :key="i" class="flex items-center space-x-4">
                                    <div class="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    <div class="flex-1 space-y-2">
                                        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                                        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- User List -->
        <div v-else class="mt-8 flow-root">
            <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <div class="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div class="px-4 sm:px-6 lg:px-8 py-4">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col"
                                            class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                            User identifier
                                        </th>
                                        <th scope="col"
                                            class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Devices
                                        </th>
                                        <th scope="col"
                                            class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Last
                                            active</th>
                                        <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                            <span class="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                    <tr v-for="user in users" :key="user.id">
                                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {{ user.userIdentifier }}
                                        </td>
                                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            <button @click="showUserDevices(user)"
                                                class="text-primary-600 hover:text-primary-500">
                                                {{ user.devices.length }} {{ user.devices.length === 1 ? 'device' :
            'devices' }}
                                            </button>
                                        </td>
                                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {{ formatDate(user.lastSeenAt) }}
                                        </td>
                                        <td
                                            class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                            <button @click="showUserDevices(user)"
                                                class="text-primary-600 hover:text-primary-500 cursor-pointer">
                                                View devices
                                            </button>
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

    <UserDevicesModal
        :show="showDevicesModal"
        :user="selectedUser"
        @close="closeDevicesModal"
    />
</template>

<script setup>
import { formatDistanceToNow } from 'date-fns'
import { ref } from 'vue'
import UserDevicesModal from './user-devices-modal.vue'

defineProps({
    users: {
        type: Array,
        required: true
    },
    isLoading: {
        type: Boolean,
        default: false
    }
})

const selectedUser = ref(null)
const showDevicesModal = ref(false)

function formatDate(date) {
    if (!date) return 'Never'
    return formatDistanceToNow(new Date(date), { addSuffix: true })
}

function showUserDevices(user) {
    selectedUser.value = user
    showDevicesModal.value = true
}

function closeDevicesModal() {
    showDevicesModal.value = false
}
</script>