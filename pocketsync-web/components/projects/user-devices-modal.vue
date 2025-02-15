<template>
    <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-gray-500/60 transition-opacity"></div>
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div
                class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div class="absolute right-0 top-0 pr-4 pt-4">
                    <button @click="close" type="button"
                        class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer">
                        <span class="sr-only">Close</span>
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="sm:flex sm:items-start">
                    <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                        <h3 class="text-lg font-semibold leading-6 text-gray-900">User Devices</h3>
                        <div class="mt-4 border-t border-gray-200 pt-4">
                            <div v-if="user" class="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                <div v-for="device in user.devices" :key="device.id"
                                    class="flex items-start justify-between space-x-4 p-4 border border-gray-200 rounded-lg">
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-medium text-gray-900">{{ device.name || 'Unnamed Device'
                                            }}</p>
                                        <p class="mt-1 text-sm text-gray-500">Last seen: {{
        formatDate(device.lastSeenAt) }}</p>
                                        <p class="mt-1 text-sm text-gray-500">Device ID: {{ device.deviceId }}</p>
                                    </div>
                                    <div class="flex-shrink-0">
                                        <span
                                            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                            :class="{
        'bg-green-100 text-green-800': isDeviceActive(device),
        'bg-gray-100 text-gray-800': !isDeviceActive(device)
                                        }">
                                            {{ isDeviceActive(device) ? 'Active' : 'Inactive' }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { formatDistanceToNow } from 'date-fns'

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    user: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['close'])

function close() {
    emit('close')
}

function formatDate(date) {
    if (!date) return 'Never'
    return formatDistanceToNow(new Date(date), { addSuffix: true })
}

function isDeviceActive(device) {
    if (!device.lastSeenAt) return false
    const lastSeen = new Date(device.lastSeenAt)
    const now = new Date()
    const diffInMinutes = (now - lastSeen) / (1000 * 60)
    return diffInMinutes < 5 // Consider device active if seen in last 5 minutes
}
</script>