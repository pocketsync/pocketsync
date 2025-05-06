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
          placeholder="Search conflicts..."
        />
      </div>
      <div class="flex space-x-2 w-full sm:w-auto">
        <select
          v-model="statusFilter"
          class="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2 dark:bg-slate-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500">
          <option value="all">All statuses</option>
          <option value="resolved">Resolved</option>
          <option value="unresolved">Unresolved</option>
        </select>
        <select
          v-model="sortOption"
          class="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2 dark:bg-slate-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="table">Table name</option>
        </select>
      </div>
    </div>

    <!-- Conflicts Table -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div ref="tableContainer" class="max-w-full overflow-x-auto custom-scrollbar">
        <div v-if="isLoading && filteredConflicts.length === 0" class="flex justify-center items-center py-8">
          <div class="animate-spin">
            <PhArrowsClockwise class="text-primary-500 h-8 w-8" />
          </div>
        </div>

        <div v-else-if="filteredConflicts.length === 0" class="py-8 text-center">
          <p class="text-slate-500 dark:text-slate-400">
            {{ searchQuery || statusFilter !== 'all' ? 'No matching conflicts found.' : 'No conflicts found for this project.' }}
          </p>
        </div>

        <div v-else>
          <table class="min-w-full">
            <thead>
              <tr>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Table</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Record ID</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">User</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Device</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Detected</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Strategy</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Status</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Actions</p>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="conflict in filteredConflicts" :key="conflict.id" class="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                <td class="px-5 py-4 sm:px-6">
                  <div class="flex items-center">
                    <div class="flex-1 text-start">
                      <h4 class="text-sm font-medium text-slate-700 whitespace-nowrap dark:text-slate-300">
                        {{ conflict.tableName }}
                      </h4>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <div class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {{ truncateId(conflict.recordId) }}
                  </div>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <div class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {{ conflict.userIdentifier || 'Anonymous' }}
                  </div>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <div class="flex items-center">
                    <PhDeviceMobile class="mr-2 text-slate-500" />
                    <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {{ truncateId(conflict.deviceId) }}
                    </span>
                  </div>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <div class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {{ formatDate(conflict.detectedAt) }}
                  </div>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <div class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {{ formatResolutionStrategy(conflict.resolutionStrategy) }}
                  </div>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <div>
                    <span class="inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] text-xs font-medium"
                      :class="getStatusClass(conflict)">
                      {{ getConflictStatus(conflict) }}
                    </span>
                  </div>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <div class="flex space-x-3">
                    <button @click="viewConflictDetails(conflict.id)" class="text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400">
                      <PhInfo size="20" />
                    </button>
                    <button v-if="!isResolved(conflict)" @click="resolveConflict(conflict.id)" class="text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400">
                      <PhCheck size="20" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination / Load More -->
        <div v-if="pagination.hasMore && !isLoading && !hasFilters" class="mt-6 flex justify-center pb-4">
          <button @click="loadMoreConflicts"
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

    <!-- Conflict Details Modal -->
    <ConflictDetailModal 
      :is-open="isDetailsModalOpen" 
      :selected-conflict="selectedConflict" 
      @resolve="resolveConflict"
      @close="isDetailsModalOpen = false" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { format } from 'date-fns'
import { PhDeviceMobile, PhArrowsClockwise, PhMagnifyingGlass, PhInfo, PhCheck } from '@phosphor-icons/vue'
import { useUtils } from '~/composables/useUtils'
import { useConflicts } from '~/composables/useConflicts'
import type { ConflictDto } from '~/api-client/model'
import ConflictDetailModal from './conflict-detail-modal.vue'

const props = defineProps({
  conflicts: {
    type: Array as () => ConflictDto[],
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

const emit = defineEmits(['load-more', 'resolve', 'view-details'])

const { truncateId } = useUtils()
// Table container ref for scroll position
const tableContainer = ref<HTMLElement | null>(null)
const scrollPosition = ref(0)

// UI state
const searchQuery = ref('')
const statusFilter = ref('all')
const sortOption = ref('newest')
const isDetailsModalOpen = ref(false)
const selectedConflict = ref<ConflictDto | null>(null)
const isLoadingMore = ref(false)

// Composables
const { formatDateFull } = useUtils()
const { formatResolutionStrategy, isResolved, getConflictStatus, getStatusClass } = useConflicts()

// Format date for display
const formatDate = (dateString: string) => {
  return formatDateFull(dateString)
}

// Computed properties
const hasFilters = computed(() => {
  return searchQuery.value.trim() !== '' || statusFilter.value !== 'all'
})

const filteredConflicts = computed(() => {
  if (!props.conflicts) return []
  
  let result = [...props.conflicts]
  
  // Apply search filter
  if (searchQuery.value.trim() !== '') {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(conflict => {
      return (
        conflict.tableName.toLowerCase().includes(query) ||
        conflict.recordId.toLowerCase().includes(query) ||
        conflict.userIdentifier.toLowerCase().includes(query) ||
        conflict.deviceId.toLowerCase().includes(query)
      )
    })
  }
  
  // Apply status filter
  if (statusFilter.value !== 'all') {
    if (statusFilter.value === 'resolved') {
      result = result.filter(conflict => isResolved(conflict))
    } else if (statusFilter.value === 'unresolved') {
      result = result.filter(conflict => !isResolved(conflict))
    }
  }
  
  // Apply sorting
  result.sort((a, b) => {
    switch (sortOption.value) {
      case 'newest':
        return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
      case 'oldest':
        return new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime()
      case 'table':
        return a.tableName.localeCompare(b.tableName)
      default:
        return 0
    }
  })
  
  return result
})

const viewConflictDetails = (conflictId: string) => {
  const conflict = props.conflicts.find(c => c.id === conflictId)
  if (conflict) {
    selectedConflict.value = conflict
    isDetailsModalOpen.value = true
  }
}

const resolveConflict = (conflictId: string) => {
  emit('resolve', conflictId)
}

const loadMoreConflicts = () => {
  saveScrollPosition()
  
  isLoadingMore.value = true
  emit('load-more')
}

const saveScrollPosition = () => {
  if (tableContainer.value) {
    scrollPosition.value = tableContainer.value.scrollTop
  }
}

// Restore scroll position after loading more conflicts
watch(() => props.conflicts.length, async () => {
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
</style>
