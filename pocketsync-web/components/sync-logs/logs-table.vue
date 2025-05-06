<template>
  <div>
    <!-- Search and Quick Filters -->
    <div class="mb-4 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
      <div class="relative w-full sm:w-64">
        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <PhMagnifyingGlass class="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </div>
        <input
          type="text"
          v-model="searchQuery"
          class="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
          placeholder="Search logs..."
        />
      </div>
      <div class="flex flex-wrap gap-2">
        <!-- Log Level Quick Filters -->
        <div class="flex gap-1">
          <button 
            @click="setLevelFilter('all')"
            class="px-3 py-1 text-xs font-medium rounded-full transition-colors"
            :class="levelFilter === 'all' ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'"
          >
            All
          </button>
          <button 
            @click="setLevelFilter('INFO')"
            class="px-3 py-1 text-xs font-medium rounded-full transition-colors"
            :class="levelFilter === 'INFO' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'"
          >
            Info
          </button>
          <button 
            @click="setLevelFilter('WARNING')"
            class="px-3 py-1 text-xs font-medium rounded-full transition-colors"
            :class="levelFilter === 'WARNING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'"
          >
            Warning
          </button>
          <button 
            @click="setLevelFilter('ERROR')"
            class="px-3 py-1 text-xs font-medium rounded-full transition-colors"
            :class="levelFilter === 'ERROR' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'"
          >
            Error
          </button>
          <button 
            @click="setLevelFilter('DEBUG')"
            class="px-3 py-1 text-xs font-medium rounded-full transition-colors"
            :class="levelFilter === 'DEBUG' ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'"
          >
            Debug
          </button>
        </div>
        
        <!-- Time Range Quick Filters -->
        <select
          v-model="timeFilter"
          class="bg-white border border-gray-300 text-gray-900 text-xs rounded-full focus:ring-primary-500 focus:border-primary-500 block px-3 py-1 dark:bg-slate-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500">
          <option value="all">All time</option>
          <option value="last_hour">Last hour</option>
          <option value="last_day">Last 24 hours</option>
          <option value="last_week">Last week</option>
        </select>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div ref="tableContainer" class="max-w-full overflow-x-auto custom-scrollbar">
        <div v-if="isLoading && filteredLogs.length === 0" class="flex justify-center items-center py-8">
          <div class="animate-spin">
            <PhArrowsClockwise class="text-primary-500 h-8 w-8" />
          </div>
        </div>

        <div v-else-if="filteredLogs.length === 0" class="py-8 text-center">
          <p class="text-slate-500 dark:text-slate-400">
            {{ searchQuery || levelFilter !== 'all' || timeFilter !== 'all' ? 'No matching logs found.' : 'No logs found for this project.' }}
          </p>
        </div>

        <div v-else class="logs-container">
          <!-- Logs in modern list format -->
          <div class="logs-list">
            <div 
              v-for="log in filteredLogs" 
              :key="log.id" 
              class="log-entry group border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-700/20 px-4 py-2 cursor-pointer"
              :class="{
                'border-l-4 border-l-blue-500 dark:border-l-blue-600': log.level === 'INFO',
                'border-l-4 border-l-yellow-500 dark:border-l-yellow-600': log.level === 'WARNING',
                'border-l-4 border-l-red-500 dark:border-l-red-600': log.level === 'ERROR',
                'border-l-4 border-l-gray-400 dark:border-l-gray-500': log.level === 'DEBUG'
              }"
              @click="viewLogDetails(log)"
            >
              <!-- Log Header -->
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center space-x-2">
                  <span 
                    class="inline-block px-2 py-0.5 text-xs font-medium rounded-sm"
                    :class="getLogLevelClass(log.level)"
                  >
                    {{ log.level }}
                  </span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatLogDate(log.timestamp) }}
                  </span>
                </div>
                
                <div class="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    class="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                    @click.stop="viewLogDetails(log)"
                    title="View details"
                  >
                    <PhInfo size="16" />
                  </button>
                </div>
              </div>
              
              <!-- Log Message -->
              <div class="text-sm text-gray-800 dark:text-white/90 mb-1 font-mono">
                {{ log.message }}
              </div>
              
              <!-- Log Context -->
              <div class="flex flex-wrap gap-2 mt-1">
                <div v-if="log.userIdentifier" class="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <PhUser class="w-3 h-3 mr-1" />
                  <span>{{ log.userIdentifier }}</span>
                </div>
                
                <div v-if="log.deviceId" class="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <PhDeviceMobile class="w-3 h-3 mr-1" />
                  <span>{{ truncateId(log.deviceId) }}</span>
                </div>
                
                <div v-if="log.syncSessionId" class="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <PhArrowsClockwise class="w-3 h-3 mr-1" />
                  <span>Session: {{ truncateId(log.syncSessionId) }}</span>
                </div>
                
                <div v-if="log.metadata" class="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <PhDatabase class="w-3 h-3 mr-1" />
                  <span>Has metadata</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination / Load More -->
        <div v-if="pagination.hasMore && !isLoading && !hasFilters" class="mt-6 flex justify-center pb-4">
          <button @click="loadMoreLogs"
            class="px-4 py-2 text-primary-600 font-medium hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 flex items-center"
            :disabled="isLoadingMore">
            <span v-if="isLoadingMore" class="animate-spin mr-2">
              <PhArrowsClockwise class="h-4 w-4" />
            </span>
            Load more
          </button>
        </div>

        <!-- Loading indicator when loading more -->
        <div v-if="isLoadingMore" class="py-4 flex justify-center">
          <div class="animate-spin">
            <PhArrowsClockwise class="text-primary-500 h-6 w-6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Log Details Modal -->
    <LogDetailsModal 
      :is-open="isDetailsModalOpen" 
      :selected-log="selectedLog" 
      @view-session="viewSession"
      @close="isDetailsModalOpen = false" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { subHours, subDays, subWeeks } from 'date-fns'
import { PhDeviceMobile, PhArrowsClockwise, PhMagnifyingGlass, PhInfo, PhUser, PhDatabase } from '@phosphor-icons/vue'
import { useSyncLogs } from '~/composables/useSyncLogs'
import type { SyncLogDto } from '~/api-client/model'
import LogDetailsModal from '~/components/sync-logs/log-details-modal.vue'
import { useUtils } from '~/composables/useUtils'

const { truncateId } = useUtils()

const props = defineProps({
  logs: {
    type: Array as () => SyncLogDto[],
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  pagination: {
    type: Object as () => {
      total: number
      page: number
      limit: number
      hasMore: boolean
    },
    required: true
  }
})

const emit = defineEmits(['load-more', 'filter-change'])

// Table container ref for scroll position
const tableContainer = ref<HTMLElement | null>(null)
const scrollPosition = ref(0)

// UI state
const searchQuery = ref('')
const levelFilter = ref('all')
const timeFilter = ref('all')
const isDetailsModalOpen = ref(false)
const selectedLog = ref<SyncLogDto | null>(null)
const isLoadingMore = ref(false)

// Composables
const { formatLogDate, getLogLevelClass } = useSyncLogs()

// Computed properties
const hasFilters = computed(() => {
  return searchQuery.value.trim() !== '' || levelFilter.value !== 'all' || timeFilter.value !== 'all'
})

const filteredLogs = computed(() => {
  if (!props.logs) return []
  
  let result = [...props.logs]
  
  // Apply search filter
  if (searchQuery.value.trim() !== '') {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(log => {
      return (
        log.message.toLowerCase().includes(query) ||
        (log.userIdentifier && log.userIdentifier.toLowerCase().includes(query)) ||
        (log.deviceId && log.deviceId.toLowerCase().includes(query))
      )
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

const viewSession = (syncSessionId: string) => {
  const projectId = useRoute().params.id as string
  navigateTo(`/console/projects/${projectId}/monitoring/sessions?syncSessionId=${syncSessionId}`)
}

const viewLogDetails = (log: SyncLogDto) => {
  selectedLog.value = log
  isDetailsModalOpen.value = true
}

const loadMoreLogs = () => {
  saveScrollPosition()
  
  isLoadingMore.value = true
  emit('load-more')
}

const setLevelFilter = (level: string) => {
  levelFilter.value = level
  emit('filter-change', { level: level === 'all' ? undefined : level })
}

const saveScrollPosition = () => {
  if (tableContainer.value) {
    scrollPosition.value = tableContainer.value.scrollTop
  }
}

// Watch for filter changes
watch([searchQuery, levelFilter, timeFilter], () => {
  emit('filter-change', {
    searchQuery: searchQuery.value,
    level: levelFilter.value === 'all' ? undefined : levelFilter.value,
    timeFilter: timeFilter.value
  })
})

// Restore scroll position after loading more logs
watch(() => props.logs.length, async () => {
  if (isLoadingMore.value) {
    await nextTick()
    if (tableContainer.value) {
      tableContainer.value.scrollTop = scrollPosition.value
    }
    isLoadingMore.value = false
  }
})

// Save scroll position when component is unmounted
onMounted(() => {
  if (tableContainer.value) {
    tableContainer.value.addEventListener('scroll', saveScrollPosition)
  }
})
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

.logs-container {
  max-height: 70vh;
  overflow-y: auto;
}

.log-entry {
  transition: background-color 0.15s ease;
}

.log-entry:hover {
  transition: background-color 0.05s ease;
}
</style>
