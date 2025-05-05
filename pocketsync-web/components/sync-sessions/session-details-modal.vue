<template>
    <Modal v-if="isOpen && selectedSession" fullScreenBackdrop>
        <template #body>
            <div
                class="modal-dialog modal-dialog-scrollable modal-lg no-scrollbar relative flex w-full max-w-[700px] flex-col overflow-y-auto rounded-3xl bg-white p-6 lg:p-11 dark:bg-gray-900">
                <div
                    class="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                        Session details
                    </h3>
                    <button @click="closeSessionDetails"
                        class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                        <span class="sr-only">Close</span>
                        <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="px-4 py-5 sm:p-6">
                    <!-- Session Details Card -->
                    <div class="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6 shadow-sm">
                        <!-- Session Information -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <!-- Left Column -->
                            <div class="space-y-4">

                                <!-- Session ID -->
                                <div class="flex flex-col items-start">
                                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">Session
                                        ID:</span>
                                    <div class="flex flex-col items-start">
                                        <div class="flex items-center">
                                            <span class="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{{
                                                selectedSession.id }}</span>
                                            <button @click="copyToClipboard(selectedSession.id)"
                                                class="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                                                <PhCopy class="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Device ID -->
                                <div class="flex flex-col items-start">
                                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">Device
                                        ID:</span>
                                    <div class="flex flex-col items-start">
                                        <div class="flex items-center">
                                            <span class="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{{ selectedSession.deviceId || 'Unknown' }}</span>
                                            <button @click="copyToClipboard(selectedSession.deviceId)" class="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                                                <PhCopy class="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- User -->
                                <div class="flex flex-col items-start">
                                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">User:</span>
                                    <span class="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[200px] inline-block">{{
                                        selectedSession.userIdentifier || 'Anonymous' }}</span>
                                </div>
                            </div>

                            <!-- Right Column -->
                            <div class="space-y-4">
                                <!-- Start Time -->
                                <div class="flex flex-col items-start">
                                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">Start
                                        Time:</span>
                                    <span class="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[200px] inline-block">{{
                                        formatDateFull(selectedSession.startTime) }}</span>
                                </div>

                                <!-- End Time -->
                                <div class="flex flex-col items-start">
                                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">End
                                        Time:</span>
                                    <span class="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[200px] inline-block">
                                        {{ selectedSession.endTime ? formatDateFull(selectedSession.endTime) : 'In Progress' }}
                                    </span>
                                </div>

                                <!-- Duration -->
                                <div class="flex flex-col items-start">
                                    <span
                                        class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">Duration:</span>
                                    <span class="text-sm text-gray-800 dark:text-gray-200">{{
                                        formatDuration(selectedSession.syncDuration) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex justify-end">
                        <button @click="viewSessionLogs(selectedSession.id)"
                            class="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-white border border-primary-500 rounded-md shadow-sm hover:bg-primary-50 dark:bg-slate-800 dark:text-primary-400 dark:border-primary-500/50 dark:hover:bg-primary-900/20 transition-colors">
                            <PhClipboardText class="w-4 h-4 mr-2" />
                            View Logs
                        </button>
                    </div>
                </div>

                <div class="px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button @click="closeSessionDetails" type="button"
                        class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                        Close
                    </button>
                </div>
            </div>
        </template>
    </Modal>
</template>

<script setup lang="ts">
import Modal from '../Modal.vue'
import type { SyncSessionDto } from '~/api-client/model'
import { useUtils } from '~/composables/useUtils'
import { PhClipboardText, PhCopy } from '@phosphor-icons/vue'

const { formatDuration, formatDateFull } = useUtils()

const props = defineProps({
    isOpen: {
        type: Boolean,
        default: false
    },
    selectedSession: {
        type: Object as () => SyncSessionDto | null,
        required: false,
        default: null
    }
})

const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    useToast().show('Copied to clipboard', 'info')
}

const emit = defineEmits(['close', 'view-logs'])

const closeSessionDetails = () => {
    emit('close')
}

const viewSessionLogs = (sessionId: string) => {
    emit('view-logs', sessionId)
}
</script>