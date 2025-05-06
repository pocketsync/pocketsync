<template>
  <Modal v-if="isOpen && timeline" fullScreenBackdrop>
    <template #body>
      <div class="flex min-h-screen items-center justify-center p-4 text-center sm:p-0 w-[900px]">
        <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl">
          <div class="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Record Timeline
            </h3>
            <button @click="close" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <span class="sr-only">Close</span>
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="px-4 py-5 sm:p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <!-- Record Information -->
            <div class="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6 shadow-sm">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div class="flex flex-col items-start">
                  <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">Table:</span>
                  <span class="text-sm text-gray-800 dark:text-gray-200">{{ timeline.tableName }}</span>
                </div>
                <div class="flex flex-col items-start">
                  <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">Record ID:</span>
                  <div class="flex items-center">
                    <span class="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                      {{ timeline.recordId }}
                    </span>
                    <button @click="copyToClipboard(timeline.recordId)"
                      class="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Timeline -->
            <div v-if="isLoading" class="flex justify-center items-center py-8">
              <div class="animate-spin">
                <svg xmlns="http://www.w3.org/2000/svg" class="text-primary-500 h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
            <div v-else-if="timeline.changes && timeline.changes.length > 0" class="mb-6">
              <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">Change History</h4>
              
              <div class="relative border-l-2 border-gray-300 dark:border-gray-700 ml-6 pl-6 space-y-8">
                <div v-for="(change, index) in timeline.changes" :key="change.id" class="relative">
                  <div class="absolute -left-8 mt-1.5">
                    <div 
                      class="w-4 h-4 rounded-full"
                      :class="{
                        'bg-success-500': change.changeType === 'CREATE',
                        'bg-warning-500': change.changeType === 'UPDATE',
                        'bg-red-500': change.changeType === 'DELETE'
                      }"
                    ></div>
                  </div>
                  <div class="mb-2">
                    <time class="text-xs font-mono text-gray-500 dark:text-gray-400">{{ formatDate(change.clientTimestamp) }}</time>
                    <div class="text-base font-bold text-gray-800 dark:text-white">{{ change.changeType }}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-300">By {{ change.userIdentifier }} on device {{ change.deviceId }}</div>
                    <button 
                      class="mt-2 px-3 py-1 text-xs font-medium text-primary-600 bg-white border border-primary-300 rounded-lg hover:bg-primary-50 focus:ring-2 focus:ring-primary-300 dark:bg-slate-800 dark:text-primary-400 dark:border-primary-800 dark:hover:bg-slate-700" 
                      @click="viewChangeDetails(change)"
                    >
                      View details
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="py-8 text-center">
              <p class="text-slate-500 dark:text-slate-400">
                No timeline data available.
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import type { DeviceChangeDto, DeviceChangeTimelineDto } from '~/api-client/model'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  timeline: {
    type: Object as () => DeviceChangeTimelineDto | null,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'view-change-details'])

function close() {
  emit('close')
}

function viewChangeDetails(change: DeviceChangeDto) {
  emit('view-change-details', change)
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  useToast().show('Copied to clipboard', 'info')
}

function formatDate(dateString: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return format(date, 'MMM dd, yyyy HH:mm:ss')
}
</script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(155, 155, 155, 0.5) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(155, 155, 155, 0.5);
  border-radius: 20px;
  border: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(155, 155, 155, 0.7);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(155, 155, 155, 0.3);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(155, 155, 155, 0.5);
}
</style>
