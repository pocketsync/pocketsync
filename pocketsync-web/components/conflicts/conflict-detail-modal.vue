<template>
  <Modal v-if="isOpen && selectedConflict" fullScreenBackdrop>
    <template #body>
      <div class="flex min-h-screen items-center justify-center p-4 text-center sm:p-0 w-[900px]">
        <div
          class="relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl">
          <div
            class="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Conflict details
            </h3>
            <button @click="close" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <span class="sr-only">Close</span>
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="px-4 py-5 sm:p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <!-- Conflict Information -->
            <div class="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6 shadow-sm">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Left Column -->
                <div class="space-y-4">
                  <!-- Conflict ID -->
                  <div class="flex flex-col items-start">
                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">Conflict ID:</span>
                    <div class="flex flex-col items-start">
                      <div class="flex items-center">
                        <span class="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                          {{ selectedConflict.id }}
                        </span>
                        <button @click="copyToClipboard(selectedConflict.id)"
                          class="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                          <PhCopy class="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Table Name -->
                  <div class="flex flex-col items-start">
                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">Table:</span>
                    <span class="text-sm text-gray-800 dark:text-gray-200">{{ selectedConflict.tableName }}</span>
                  </div>

                  <!-- Record ID -->
                  <div class="flex flex-col items-start">
                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">Record ID:</span>
                    <div class="flex items-center">
                      <span class="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                        {{ selectedConflict.recordId }}
                      </span>
                      <button @click="copyToClipboard(selectedConflict.recordId)"
                        class="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                        <PhCopy class="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <!-- User Identifier -->
                  <div class="flex flex-col items-start">
                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">User:</span>
                    <span class="text-sm text-gray-800 dark:text-gray-200">{{ selectedConflict.userIdentifier }}</span>
                  </div>
                </div>

                <!-- Right Column -->
                <div class="space-y-4">
                  <!-- Device ID -->
                  <div class="flex flex-col items-start">
                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">Device ID:</span>
                    <span class="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                      {{ selectedConflict.deviceId }}
                    </span>
                  </div>

                  <!-- Detection Time -->
                  <div class="flex flex-col items-start">
                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">Detected:</span>
                    <span class="text-sm text-gray-800 dark:text-gray-200">
                      {{ formatDateFull(selectedConflict.detectedAt) }}
                    </span>
                  </div>

                  <!-- Resolution Strategy -->
                  <div class="flex flex-col items-start">
                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">Strategy:</span>
                    <span class="text-sm text-gray-800 dark:text-gray-200">
                      {{ formatResolutionStrategy(selectedConflict.resolutionStrategy) }}
                    </span>
                  </div>

                  <!-- Status -->
                  <div class="flex flex-col items-start">
                    <span class="w-28 text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
                    <span class="text-sm px-2 py-1 rounded-full" :class="getStatusClass(selectedConflict)">
                      {{ getConflictStatus(selectedConflict) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Data Comparison -->
            <div class="mb-6">
              <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">Data comparison</h4>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Client Data -->
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Client data</h5>
                  <pre
                    class="text-xs bg-gray-50 dark:bg-slate-700/30 p-3 rounded overflow-auto max-h-[300px] custom-scrollbar hljs"
                    v-html="formatJson(selectedConflict.clientData?.new || selectedConflict.clientData)"></pre>
                </div>

                <!-- Server Data -->
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Server data</h5>
                  <pre
                    class="text-xs bg-gray-50 dark:bg-slate-700/30 p-3 rounded overflow-auto max-h-[300px] custom-scrollbar hljs"
                    v-html="formatJson(selectedConflict.serverData?.new || selectedConflict.serverData)"></pre>
                </div>
              </div>
            </div>

            <!-- Visual Diff -->
            <div class="mb-6">
              <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">Visual Diff</h4>

              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div v-if="Object.keys(dataDiff.changed).length > 0 || 
               Object.keys(dataDiff.added).length > 0 || 
               Object.keys(dataDiff.removed).length > 0">
                  <div class="space-y-3">
                    <!-- Changed fields -->
                    <div v-for="(diff, key) in dataDiff.changed" :key="`changed-${key}`" class="diff-block">
                      <div
                        class="diff-header bg-gray-100 dark:bg-slate-700 p-2 rounded-t border border-gray-200 dark:border-gray-600 flex justify-between items-center">
                        <span class="font-medium text-gray-800 dark:text-gray-200">{{ key }}</span>
                      </div>
                      <div
                        class="diff-content border border-t-0 border-gray-200 dark:border-gray-600 rounded-b overflow-hidden">
                        <div class="bg-red-100 dark:bg-red-900/20 p-2 border-l-4 border-red-500">
                          <span class="text-xs font-mono text-red-800 dark:text-red-200">- {{ JSON.stringify(diff.server) }}</span>
                        </div>
                        <div class="bg-green-100 dark:bg-green-900/20 p-2 border-l-4 border-green-500">
                          <span class="text-xs font-mono text-green-800 dark:text-green-200">+ {{ JSON.stringify(diff.client) }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Added fields -->
                    <div v-for="(value, key) in dataDiff.added" :key="`added-${key}`" class="diff-block">
                      <div
                        class="diff-header bg-gray-100 dark:bg-slate-700 p-2 rounded-t border border-gray-200 dark:border-gray-600">
                        <span class="font-medium">{{ key }}</span>
                      </div>
                      <div
                        class="diff-content border border-t-0 border-gray-200 dark:border-gray-600 rounded-b overflow-hidden">
                        <div class="bg-green-100 dark:bg-green-900/20 p-2 border-l-4 border-green-500">
                          <span class="text-xs font-mono text-green-800 dark:text-green-200">+ {{ JSON.stringify(value) }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Removed fields -->
                    <div v-for="(value, key) in dataDiff.removed" :key="`removed-${key}`" class="diff-block">
                      <div
                        class="diff-header bg-gray-100 dark:bg-slate-700 p-2 rounded-t border border-gray-200 dark:border-gray-600">
                        <span class="font-medium">{{ key }}</span>
                      </div>
                      <div
                        class="diff-content border border-t-0 border-gray-200 dark:border-gray-600 rounded-b overflow-hidden">
                        <div class="bg-red-100 dark:bg-red-900/20 p-2 border-l-4 border-red-500">
                          <span class="text-xs font-mono text-red-800 dark:text-red-200">- {{ JSON.stringify(value) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="text-center py-4 text-gray-500 dark:text-gray-400">
                  No differences found
                </div>
              </div>
            </div>

            <!-- Resolved Data (if resolved) -->
            <div v-if="isResolved(selectedConflict)" class="mb-6">
              <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">Resolution</h4>

              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div class="flex justify-between items-center mb-2">
                  <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300">Resolved data</h5>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    Resolved at: {{ formatDateFull(selectedConflict.resolvedAt) }}
                  </span>
                </div>
                <pre
                  class="text-xs bg-gray-50 dark:bg-slate-700/30 p-3 rounded overflow-auto max-h-[300px] custom-scrollbar hljs"
                  v-html="formatJson(selectedConflict.resolvedData?.new || selectedConflict.resolvedData)"></pre>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 dark:bg-slate-700/30 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button v-if="!isResolved(selectedConflict)" @click="resolveConflict" type="button"
              class="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none sm:w-auto sm:text-sm">
              Resolve conflict
            </button>
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
  import { computed, onMounted } from 'vue'
  import { useUtils } from '~/composables/useUtils'
  import { useConflicts } from '~/composables/useConflicts'
  import { useToast } from '~/composables/useToast'
  import Modal from '~/components/Modal.vue'
  import { PhCopy } from '@phosphor-icons/vue'
  import type { ConflictDto } from '~/api-client/model'
  import hljs from 'highlight.js/lib/core'
  import json from 'highlight.js/lib/languages/json'
  import 'highlight.js/styles/atom-one-dark.css'

  const { formatDateFull } = useUtils()
  const { formatResolutionStrategy, isResolved, getConflictStatus, getStatusClass, getDataDiff } = useConflicts()
  const toast = useToast()

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

  const props = defineProps({
    isOpen: {
      type: Boolean,
      default: false
    },
    selectedConflict: {
      type: Object as () => ConflictDto | null,
      required: false,
      default: null
    }
  })

  const emit = defineEmits(['close', 'resolve'])

  const dataDiff = computed(() => {
    if (!props.selectedConflict) return { added: {}, removed: {}, changed: {} }
    return getDataDiff(props.selectedConflict.clientData['new'], props.selectedConflict.serverData['new'])
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.show('Copied to clipboard', 'info')
  }

  const close = () => {
    emit('close')
  }

  const resolveConflict = () => {
    if (!props.selectedConflict) return
    emit('resolve', props.selectedConflict.id)
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

  pre {
    overflow-x: auto;
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