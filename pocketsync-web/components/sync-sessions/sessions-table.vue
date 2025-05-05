<template>
  <div>
    <!-- Search and Filters -->
    <div class="mb-4 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
      <div class="relative w-full sm:w-64">
        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <PhMagnifyingGlass class="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </div>
        <input
          type="text"
          v-model="searchQuery"
          class="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
          placeholder="Search sessions..."
        />
      </div>
      <div class="flex space-x-2 w-full sm:w-auto">
        <select
          v-model="statusFilter"
          class="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2 dark:bg-slate-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500">
          <option value="all">All Statuses</option>
          <option value="SUCCESS">Success</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="FAILED">Failed</option>
        </select>
        <select
          v-model="sortOption"
          class="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2 dark:bg-slate-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="duration">Duration</option>
          <option value="changes">Changes</option>
        </select>
      </div>
    </div>

    <!-- Sessions Table -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div ref="tableContainer" class="max-w-full overflow-x-auto custom-scrollbar">
        <div v-if="isLoading && filteredSessions.length === 0" class="flex justify-center items-center py-8">
          <div class="animate-spin">
            <PhArrowsClockwise class="text-primary-500 h-8 w-8" />
          </div>
        </div>

        <div v-else-if="filteredSessions.length === 0" class="py-8 text-center">
          <p class="text-slate-500 dark:text-slate-400">
            {{ searchQuery || statusFilter !== 'all' ? 'No matching sessions found.' : 'No sync sessions found for this project.' }}
          </p>
        </div>

        <div v-else>
          <table class="min-w-full">
            <thead>
              <tr>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Session ID</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Device ID</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">User</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Start Time</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Duration</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Status</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Changes</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Actions</p>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="session in filteredSessions" :key="session.id" class="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                <td class="px-5 py-4 sm:px-6">
                  <div class="flex items-center">
                    <div class="flex-1 text-start">
                      <h4 class="text-sm font-medium text-slate-700 whitespace-nowrap dark:text-slate-300">
                        {{ truncateId(session.id) }}
                      </h4>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <div class="flex items-center">
                    <PhDeviceMobile class="mr-2 text-slate-500" />
                    <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {{ truncateId(session.deviceId) }}
                    </span>
                  </div>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <div class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {{ session.userIdentifier || 'Anonymous' }}
                  </div>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <div class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {{ formatDate(session.startTime) }}
                  </div>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <div class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {{ formatDuration(session.syncDuration) }}
                  </div>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <div>
                    <span class="inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] text-xs font-medium"
                      :class="{
                        'bg-success-500 text-white': session.status === 'SUCCESS',
                        'bg-warning-500 text-white': session.status === 'IN_PROGRESS',
                        'bg-danger-500 text-white': session.status === 'FAILED',
                      }">
                      {{ formatStatus(session.status) }}
                    </span>
                  </div>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <div class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {{ session.changesCount }}
                  </div>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <div class="flex space-x-3">
                    <button @click="viewSessionDetails(session.id)" class="text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400">
                      <PhInfo size="20" />
                    </button>
                    <button @click="viewSessionLogs(session.id)" class="text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400">
                      <PhListBullets size="20" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination / Load More -->
        <div v-if="props.pagination.hasMore && !isLoading && !hasFilters" class="mt-6 flex justify-center pb-4">
          <button @click="loadMoreSessions"
            class="px-4 py-2 text-primary-600 font-medium hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 flex items-center"
            :disabled="isLoadingMore">
            <span v-if="isLoadingMore" class="animate-spin mr-2">
              <PhArrowsClockwise class="h-4 w-4" />
            </span>
            Load More
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

    <!-- Session Details Modal -->
    <SessionDetailsModal 
      :is-open="isDetailsModalOpen" 
      :selected-session="selectedSession" 
      @view-logs="viewSessionLogs"
      @close="isDetailsModalOpen = false" 
    />

    <!-- Session Logs Modal -->
    <SessionLogsModal 
      :is-open="isLogsModalOpen" 
      :logs="selectedSessionLogs" 
      :is-loading="isLoadingSelectedLogs"
      @close="isLogsModalOpen = false" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { format } from 'date-fns'
import { PhDeviceMobile, PhArrowsClockwise, PhMagnifyingGlass, PhInfo, PhListBullets } from '@phosphor-icons/vue'
import { useUtils } from '~/composables/useUtils'
import type { SyncSessionDto, SyncLogResponseDto } from '~/api-client/model'
import SessionLogsModal from './session-logs-modal.vue'
import SessionDetailsModal from './session-details-modal.vue'

const props = defineProps({
  sessions: {
    type: Array as () => SyncSessionDto[],
    required: true
  },
  sessionLogs: {
    type: Object as () => Record<string, SyncLogResponseDto>,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  isLoadingLogs: {
    type: Boolean,
    default: false
  },
  pagination: {
    type: Object as () => {
      total: number;
      page: number;
      limit: number;
      hasMore: boolean;
    },
    required: true
  }
})

const emit = defineEmits(['load-logs', 'load-more'])

// Local state
const isLoadingMore = ref(false)
const selectedSession = ref<SyncSessionDto | null>(null)
const isLogsModalOpen = ref(false)
const isLoadingSelectedLogs = ref(false)
const isDetailsModalOpen = ref(false)
const searchQuery = ref('')
const statusFilter = ref('all')
const sortOption = ref('newest')
const tableContainer = ref<HTMLElement | null>(null)
const scrollPosition = ref(0)
const { formatDuration, truncateId: utilsTruncateId } = useUtils()

// Computed properties
const hasFilters = computed(() => {
  return searchQuery.value.trim() !== '' || statusFilter.value !== 'all'
})

const filteredSessions = computed(() => {
  let result = [...props.sessions]
  
  // Apply search filter
  if (searchQuery.value.trim() !== '') {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(session => {
      return (
        session.id.toLowerCase().includes(query) ||
        session.deviceId.toLowerCase().includes(query) ||
        (session.userIdentifier && session.userIdentifier.toLowerCase().includes(query))
      )
    })
  }
  
  // Apply status filter
  if (statusFilter.value !== 'all') {
    result = result.filter(session => session.status === statusFilter.value)
  }
  
  // Apply sorting
  result.sort((a, b) => {
    switch (sortOption.value) {
      case 'newest':
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      case 'oldest':
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      case 'duration':
        return (b.syncDuration || 0) - (a.syncDuration || 0)
      case 'changes':
        return (b.changesCount || 0) - (a.changesCount || 0)
      default:
        return 0
    }
  })
  
  return result
})

const selectedSessionLogs = computed(() => {
  if (!selectedSession.value) return null
  return props.sessionLogs[selectedSession.value.id] || null
})

// Watch for changes in the table container to save scroll position
onMounted(() => {
  if (tableContainer.value) {
    tableContainer.value.addEventListener('scroll', saveScrollPosition)
  }
})

// Save scroll position when scrolling
const saveScrollPosition = () => {
  if (tableContainer.value) {
    scrollPosition.value = tableContainer.value.scrollTop
  }
}

// Restore scroll position after loading more sessions
watch(() => props.sessions.length, async () => {
  if (isLoadingMore.value) {
    await nextTick()
    if (tableContainer.value) {
      tableContainer.value.scrollTop = scrollPosition.value
    }
    isLoadingMore.value = false
  }
})

// Format date for display
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return format(date, 'MMM d, yyyy h:mm a')
  } catch (e) {
    return dateString
  }
}

// Format status for display
const formatStatus = (status: string) => {
  switch (status) {
    case 'SUCCESS':
      return 'Success'
    case 'FAILED':
      return 'Failed'
    case 'IN_PROGRESS':
      return 'In Progress'
    default:
      return status
  }
}

// Truncate IDs for display
const truncateId = (id: string) => {
  if (!id) return ''
  return utilsTruncateId(id) + '...'
}

// View session details in modal
const viewSessionDetails = (sessionId: string) => {
  const session = props.sessions.find(s => s.id === sessionId)
  if (session) {
    selectedSession.value = session
    isDetailsModalOpen.value = true
    isLogsModalOpen.value = false
  }
}

// View session logs in modal
const viewSessionLogs = async (sessionId: string) => {
  // Find the session
  const session = props.sessions.find(s => s.id === sessionId)
  if (!session) return
  
  // Set the selected session for logs
  selectedSession.value = session
  
  // Check if we need to load logs
  if (!props.sessionLogs[sessionId]) {
    isLoadingSelectedLogs.value = true
    try {
      await emit('load-logs', sessionId)
    } finally {
      isLoadingSelectedLogs.value = false
    }
  }
  
  // Open the logs modal without affecting the details modal
  isLogsModalOpen.value = true
  isDetailsModalOpen.value = false
}

// Load more sessions
const loadMoreSessions = async () => {
  if (isLoadingMore.value || !props.pagination.hasMore) return
  
  // Save scroll position before loading more
  if (tableContainer.value) {
    scrollPosition.value = tableContainer.value.scrollTop
  }
  
  isLoadingMore.value = true
  emit('load-more')
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
