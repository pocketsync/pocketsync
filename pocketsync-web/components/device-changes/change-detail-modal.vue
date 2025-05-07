<template>
  <Modal v-if="isOpen && selectedChange" fullScreenBackdrop>
    <template #body>
      <div class="flex min-h-screen items-center justify-center p-4 text-center sm:p-0 w-[900px]">
        <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl">
          <div class="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Change details
            </h3>
            <button @click="close" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <span class="sr-only">Close</span>
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="px-4 py-5 sm:p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <!-- Change Information -->
            <div class="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6 shadow-sm">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Left Column -->
                <div class="space-y-4">
                  <!-- Change ID -->
                  <div class="flex flex-col items-start">
                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">Change ID:</span>
                    <div class="flex flex-col items-start">
                      <div class="flex items-center">
                        <span class="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                          {{ selectedChange.id }}
                        </span>
                        <button @click="copyToClipboard(selectedChange.id)"
                          class="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Table Name -->
                  <div class="flex flex-col items-start">
                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">Table:</span>
                    <span class="text-sm text-gray-800 dark:text-gray-200">{{ selectedChange.tableName }}</span>
                  </div>

                  <!-- Record ID -->
                  <div class="flex flex-col items-start">
                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">Record ID:</span>
                    <div class="flex items-center">
                      <span class="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                        {{ selectedChange.recordId }}
                      </span>
                      <button @click="copyToClipboard(selectedChange.recordId)"
                        class="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Change Type -->
                  <div class="flex flex-col items-start">
                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">Change Type:</span>
                    <span class="inline-block px-3 min-w-[90px] text-center py-1 rounded-full text-xs font-medium"
                      :class="{
                        'bg-success-500 text-white': selectedChange.changeType === 'CREATE',
                        'bg-warning-500 text-white': selectedChange.changeType === 'UPDATE',
                        'bg-danger-500 text-white': selectedChange.changeType === 'DELETE'
                      }">
                      {{ selectedChange.changeType }}
                    </span>
                  </div>
                </div>

                <!-- Right Column -->
                <div class="space-y-4">
                  <!-- User Identifier -->
                  <div class="flex flex-col items-start">
                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">User:</span>
                    <span class="text-sm text-gray-800 dark:text-gray-200">{{ selectedChange.userIdentifier }}</span>
                  </div>

                  <!-- Device ID -->
                  <div class="flex flex-col items-start">
                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">Device ID:</span>
                    <div class="flex items-center">
                      <span class="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                        {{ selectedChange.deviceId }}
                      </span>
                      <button @click="copyToClipboard(selectedChange.deviceId)"
                        class="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Client Timestamp -->
                  <div class="flex flex-col items-start">
                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">Timestamp:</span>
                    <span class="text-sm text-gray-800 dark:text-gray-200">
                      {{ formatDate(selectedChange.clientTimestamp) }}
                    </span>
                  </div>

                  <!-- Client Version -->
                  <div class="flex flex-col items-start">
                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">Version:</span>
                    <span class="text-sm text-gray-800 dark:text-gray-200">
                      {{ selectedChange.clientVersion }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Change Data -->
            <div class="mb-6">
              <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">Change data</h4>
              
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <pre class="text-xs bg-gray-50 dark:bg-slate-700/30 p-3 rounded overflow-auto max-h-[300px] custom-scrollbar hljs" v-html="formatJson(selectedChange.data)"></pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import type { DeviceChangeDto } from '~/api-client/model'
import { onMounted } from 'vue'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import 'highlight.js/styles/github-dark.css'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  selectedChange: {
    type: Object as () => DeviceChangeDto | null,
    default: null
  }
})

const emit = defineEmits(['close'])

function close() {
  emit('close')
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

// Register JSON language for highlighting
hljs.registerLanguage('json', json)

// Format and highlight JSON
const formatJson = (data: any): string => {
  if (!data) return ''
  try {
    const formatted = JSON.stringify(data, null, 2)
    return hljs.highlight(formatted, { language: 'json' }).value
  } catch (err) {
    return JSON.stringify(data || '', null, 2)
  }
}

onMounted(() => {
  // Initialize highlight.js
  hljs.configure({ languages: ['json'] })
})
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
