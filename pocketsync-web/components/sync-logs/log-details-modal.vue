<template>
  <Modal v-if="isOpen && selectedLog" fullScreenBackdrop>
    <template #body>
      <div class="flex min-h-screen items-center justify-center p-4 text-center sm:p-0 w-[900px]">
        <div
          class="relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl">
          <!-- Header with log level indicator -->
          <div
            class="px-4 py-4 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
            :class="{
              'border-l-4 border-l-blue-500 dark:border-l-blue-600': selectedLog.level === 'INFO',
              'border-l-4 border-l-yellow-500 dark:border-l-yellow-600': selectedLog.level === 'WARNING',
              'border-l-4 border-l-red-500 dark:border-l-red-600': selectedLog.level === 'ERROR',
              'border-l-4 border-l-gray-400 dark:border-l-gray-500': selectedLog.level === 'DEBUG'
            }">
            <div class="flex items-center">
              <span
                class="inline-block px-2 py-0.5 text-xs font-medium rounded-sm mr-3"
                :class="getLogLevelClass(selectedLog.level)">
                {{ selectedLog.level }}
              </span>
              <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                Log details
              </h3>
            </div>
            <button @click="close" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <span class="sr-only">Close</span>
              <PhX class="h-5 w-5" />
            </button>
          </div>

          <div class="px-4 py-5 sm:p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <!-- Log Message (Highlighted at the top) -->
            <div class="mb-6">
              <div class="font-mono text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap p-4 rounded-lg bg-gray-50 dark:bg-slate-700/30 border-l-4 border-gray-300 dark:border-gray-600">
                {{ selectedLog.message }}
              </div>
            </div>
            
            <!-- Log Information -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <!-- Timestamp Card -->
              <div class="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div class="flex items-center mb-2">
                  <PhClock class="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Timestamp</span>
                </div>
                <p class="text-sm text-gray-800 dark:text-gray-200">
                  {{ formatLogDate(selectedLog.timestamp) }}
                </p>
              </div>
              
              <!-- User Info Card -->
              <div class="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div class="flex items-center mb-2">
                  <PhUser class="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">User</span>
                </div>
                <p class="text-sm text-gray-800 dark:text-gray-200">
                  {{ selectedLog.userIdentifier || 'Anonymous' }}
                </p>
              </div>
              
              <!-- Device Info Card -->
              <div class="bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div class="flex items-center mb-2">
                  <PhDeviceMobile class="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Device</span>
                </div>
                <div class="flex items-center">
                  <p class="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                    {{ selectedLog.deviceId || 'N/A' }}
                  </p>
                  <button v-if="selectedLog.deviceId" @click="copyToClipboard(selectedLog.deviceId)"
                    class="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                    <PhCopy class="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
            
            <!-- IDs Section -->
            <div class="mb-6 bg-white dark:bg-slate-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Log ID -->
                <div>
                  <div class="flex items-center mb-2">
                    <PhIdentificationCard class="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Log ID</span>
                  </div>
                  <div class="flex items-center">
                    <p class="text-xs text-gray-800 dark:text-gray-200 font-mono truncate max-w-[200px]">
                      {{ selectedLog.id }}
                    </p>
                    <button @click="copyToClipboard(selectedLog.id)"
                      class="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                      <PhCopy class="h-3 w-3" />
                    </button>
                  </div>
                </div>
                
                <!-- Project ID -->
                <div>
                  <div class="flex items-center mb-2">
                    <PhFolders class="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Project ID</span>
                  </div>
                  <div class="flex items-center">
                    <p class="text-xs text-gray-800 dark:text-gray-200 font-mono truncate max-w-[200px]">
                      {{ selectedLog.projectId }}
                    </p>
                    <button @click="copyToClipboard(selectedLog.projectId)"
                      class="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                      <PhCopy class="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Metadata -->
            <div v-if="selectedLog.metadata" class="mb-6">
              <div class="flex items-center mb-2">
                <PhDatabase class="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                <h4 class="text-md font-medium text-gray-900 dark:text-white">Metadata</h4>
              </div>
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg">
                <pre class="text-xs bg-gray-50 dark:bg-slate-700/30 p-3 rounded overflow-auto max-h-[300px] custom-scrollbar hljs" v-html="formatJson(selectedLog.metadata)"></pre>
              </div>
            </div>

            <!-- Related Sync Session -->
            <div v-if="selectedLog.syncSessionId" class="mb-6">
              <div class="flex items-center mb-2">
                <PhArrowsClockwise class="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                <h4 class="text-md font-medium text-gray-900 dark:text-white">Related sync session</h4>
              </div>
              <div class="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div class="flex items-center">
                    <span class="text-xs text-gray-800 dark:text-gray-200 font-mono">
                      {{ selectedLog.syncSessionId }}
                    </span>
                    <button @click="copyToClipboard(selectedLog.syncSessionId)"
                      class="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-blue-800/30 transition-colors">
                      <PhCopy class="h-3 w-3" />
                    </button>
                  </div>
                  <button @click="viewSyncSession(selectedLog.syncSessionId)" 
                    class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex items-center">
                    <span>View session details</span>
                    <PhArrowRight class="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 dark:bg-slate-700/30 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button @click="close" type="button"
              class="mt-3 mr-4 inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSyncLogs } from '~/composables/useSyncLogs'
import { useToast } from '~/composables/useToast'
import Modal from '~/components/Modal.vue'
import { PhCopy, PhX, PhClock, PhUser, PhDeviceMobile, PhIdentificationCard, PhFolders, PhDatabase, PhArrowsClockwise, PhArrowRight } from '@phosphor-icons/vue'
import type { SyncLogDto } from '~/api-client/model'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import 'highlight.js/styles/atom-one-dark.css'

const { formatLogDate, getLogLevelClass } = useSyncLogs()
const toast = useToast()

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  selectedLog: {
    type: Object as () => SyncLogDto | null,
    required: false,
    default: null
  }
})

const emit = defineEmits(['close', 'view-session'])

// Register JSON language for highlight.js
onMounted(() => {
  hljs.registerLanguage('json', json)
})

// Format and highlight JSON
const formatJson = (data: any): string => {
  try {
    const formatted = JSON.stringify(data, null, 2)
    return hljs.highlight(formatted, { language: 'json' }).value
  } catch (err) {
    return JSON.stringify(data, null, 2)
  }
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  toast.show('Copied to clipboard', 'info')
}

const close = () => {
  emit('close')
}

const viewSyncSession = (sessionId: string) => {
  emit('view-session', sessionId)
}
</script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 20px;
}

.dark .custom-scrollbar {
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
}

/* Override highlight.js theme for better dark mode compatibility */
.dark .hljs {
  background: transparent;
}

.hljs-attr {
  color: #7ee787;
}

.dark .hljs-attr {
  color: #7ee787;
}

.hljs-string {
  color: #a5d6ff;
}

.dark .hljs-string {
  color: #a5d6ff;
}

.hljs-number {
  color: #f2cc60;
}

.dark .hljs-number {
  color: #f2cc60;
}
</style>
