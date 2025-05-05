<template>
  <Modal v-if="isOpen" fullScreenBackdrop>
    <template #body>
      <div class="flex min-h-screen items-center justify-center p-4 text-center sm:p-0 w-[900px]">
        <div
          class="relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl">
          <div
            class="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Session logs
            </h3>
            <button @click="close" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <span class="sr-only">Close</span>
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Search and Filters -->
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-700/30">
            <div class="flex flex-col sm:flex-row gap-3">
              <!-- Search Input -->
              <div class="relative flex-1">
                <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <PhMagnifyingGlass class="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  v-model="searchQuery"
                  class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-800 dark:text-white"
                  placeholder="Search logs..."
                />
              </div>

              <!-- Level Filter -->
              <div class="sm:w-40">
                <select
                  v-model="levelFilter"
                  class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-800 dark:text-white"
                >
                  <option value="all">All levels</option>
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="ERROR">Error</option>
                </select>
              </div>

              <!-- Time Filter -->
              <div class="sm:w-48">
                <select
                  v-model="timeFilter"
                  class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-800 dark:text-white"
                >
                  <option value="all">All time</option>
                  <option value="last_hour">Last hour</option>
                  <option value="last_day">Last 24 hours</option>
                  <option value="last_week">Last week</option>
                </select>
              </div>
            </div>
          </div>

          <div class="px-4 py-5 sm:p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div v-if="isLoading" class="flex justify-center items-center py-8">
              <div class="animate-spin">
                <PhArrowsClockwise class="text-primary-500 h-8 w-8" />
              </div>
            </div>

            <div v-else-if="!currentLogs || currentLogs.logs.length === 0" class="text-center py-8">
              <p class="text-gray-500 dark:text-gray-400">No logs available for this session.</p>
            </div>

            <div v-else-if="filteredLogs.length === 0" class="text-center py-8">
              <p class="text-gray-500 dark:text-gray-400">No logs match your search criteria.</p>
              <button @click="resetFilters" class="mt-2 text-primary-500 hover:text-primary-600 text-sm">
                Reset filters
              </button>
            </div>

            <div v-else class="space-y-2">
              <div v-for="log in filteredLogs" :key="log.id" class="p-3 rounded-md text-sm" :class="{
                'bg-slate-100 dark:bg-slate-700': log.level === 'INFO',
                'bg-yellow-50 dark:bg-yellow-900/20': log.level === 'WARNING',
                'bg-red-50 dark:bg-red-900/20': log.level === 'ERROR',
              }">
                <div class="flex items-start">
                  <span class="font-medium mr-2" :class="{
                    'text-blue-600 dark:text-blue-400': log.level === 'INFO',
                    'text-yellow-600 dark:text-yellow-400': log.level === 'WARNING',
                    'text-red-600 dark:text-red-400': log.level === 'ERROR',
                  }">
                    [{{ log.level }}]
                  </span>
                  <span class="text-slate-600 dark:text-slate-300 flex-1">{{ log.message }}</span>
                  <span class="text-xs text-slate-500 ml-2 whitespace-nowrap">{{ formatDate(log.timestamp) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 dark:bg-slate-700/30 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button @click="exportLogs" type="button"
              class="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none sm:w-auto sm:text-sm">
              Export Logs
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
import { ref, computed, watch } from 'vue'
import { format, subHours, subDays, subWeeks } from 'date-fns'
import { PhArrowsClockwise, PhMagnifyingGlass } from '@phosphor-icons/vue'
import type { SyncLogResponseDto } from '~/api-client/model'
import Modal from '~/components/Modal.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  logs: {
    type: Object as () => SyncLogResponseDto | null,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

// Search and filter state
const searchQuery = ref('')
const levelFilter = ref('all')
const timeFilter = ref('all')
const currentLogs = ref<SyncLogResponseDto | null>(null)

// Watch for changes in props.logs and update currentLogs
watch(() => props.logs, (newLogs) => {
  currentLogs.value = newLogs
}, { immediate: true, deep: true })

// Computed property for filtered logs
const filteredLogs = computed(() => {
  if (!currentLogs.value || !currentLogs.value.logs) return []
  
  let result = [...currentLogs.value.logs]
  
  // Apply search filter
  if (searchQuery.value.trim() !== '') {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(log => {
      return log.message.toLowerCase().includes(query)
    })
  }
  
  // Apply level filter
  if (levelFilter.value !== 'all') {
    result = result.filter(log => log.level === levelFilter.value)
  }
  
  // Apply time filter
  if (timeFilter.value !== 'all') {
    const now = new Date()
    let cutoffDate
    
    switch (timeFilter.value) {
      case 'last_hour':
        cutoffDate = subHours(now, 1)
        break
      case 'last_day':
        cutoffDate = subDays(now, 1)
        break
      case 'last_week':
        cutoffDate = subWeeks(now, 1)
        break
      default:
        cutoffDate = null
    }
    
    if (cutoffDate) {
      result = result.filter(log => {
        const logDate = new Date(log.timestamp)
        return logDate >= cutoffDate
      })
    }
  }
  
  // Sort by timestamp (newest first)
  result.sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })
  
  return result
})

// Reset all filters
const resetFilters = () => {
  searchQuery.value = ''
  levelFilter.value = 'all'
  timeFilter.value = 'all'
}

// Export logs to CSV
const exportLogs = () => {
  if (!currentLogs.value || !currentLogs.value.logs.length) return
  
  // Prepare CSV content
  const headers = ['Timestamp', 'Level', 'Message']
  const rows = filteredLogs.value.map(log => [
    formatDate(log.timestamp),
    log.level,
    `"${log.message.replace(/"/g, '""')}"`  // Escape quotes in CSV
  ])
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `session-logs-${new Date().toISOString().slice(0, 10)}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const close = () => {
  emit('close')
}

// Format date for display
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return format(date, 'MMM d, yyyy h:mm a')
  } catch (e) {
    return dateString
  }
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
  border-radius: 3px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(75, 85, 99, 0.5);
}
</style>
