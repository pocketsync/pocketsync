<template>
  <div class="device-changes-table">
    <div class="mb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Table</label>
          <select 
            v-model="selectedTable" 
            class="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2 dark:bg-slate-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" 
            @change="applyFilters"
          >
            <option value="">All tables</option>
            <option v-for="table in tableNames" :key="table" :value="table">{{ table }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Change type</label>
          <select 
            v-model="selectedChangeType" 
            class="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2 dark:bg-slate-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" 
            @change="applyFilters"
          >
            <option value="">All types</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Record ID</label>
          <input 
            v-model="recordId" 
            type="text" 
            placeholder="Record ID" 
            class="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2 dark:bg-slate-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" 
            @input="debounceSearch" 
          />
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        <div>
          <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Device ID</label>
          <input 
            v-model="deviceId" 
            type="text" 
            placeholder="Device ID" 
            class="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2 dark:bg-slate-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" 
            @input="debounceSearch" 
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">User Identifier</label>
          <input 
            v-model="userIdentifier" 
            type="text" 
            placeholder="User Identifier" 
            class="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2 dark:bg-slate-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" 
            @input="debounceSearch" 
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Date range</label>
          <div class="flex gap-2">
            <input 
              v-model="startDate" 
              type="date" 
              class="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2 dark:bg-slate-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" 
              @change="applyFilters" 
            />
            <input 
              v-model="endDate" 
              type="date" 
              class="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2 dark:bg-slate-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" 
              @change="applyFilters" 
            />
          </div>
        </div>
      </div>
      <div class="flex justify-end mt-4">
        <button 
          class="px-4 py-2 mr-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-primary-300 dark:bg-slate-800 dark:text-white dark:border-gray-600 dark:hover:bg-slate-700 dark:hover:border-gray-600 dark:focus:ring-primary-800" 
          @click="clearFilters"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <div v-if="isLoading && !deviceChanges.length" class="flex justify-center items-center py-8">
      <div class="animate-spin">
        <svg xmlns="http://www.w3.org/2000/svg" class="text-primary-500 h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
    </div>

    <div v-else-if="!deviceChanges.length" class="py-8 text-center">
      <p class="text-slate-500 dark:text-slate-400">
        {{ selectedTable || selectedChangeType || recordId || deviceId || userIdentifier || startDate || endDate ? 'No matching device changes found. Try adjusting your filters.' : 'No device changes found for this project.' }}
      </p>
    </div>

    <div v-else class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="max-w-full overflow-x-auto custom-scrollbar">
        <table class="min-w-full">
          <thead>
            <tr>
              <th class="px-5 py-3 text-left sm:px-6">
                <p class="font-medium text-gray-500 text-sm dark:text-gray-400">Table</p>
              </th>
              <th class="px-5 py-3 text-left sm:px-6">
                <p class="font-medium text-gray-500 text-sm dark:text-gray-400">Record ID</p>
              </th>
              <th class="px-5 py-3 text-left sm:px-6">
                <p class="font-medium text-gray-500 text-sm dark:text-gray-400">Change type</p>
              </th>
              <th class="px-5 py-3 text-left sm:px-6">
                <p class="font-medium text-gray-500 text-sm dark:text-gray-400">Device ID</p>
              </th>
              <th class="px-5 py-3 text-left sm:px-6">
                <p class="font-medium text-gray-500 text-sm dark:text-gray-400">User identifier</p>
              </th>
              <th class="px-5 py-3 text-left sm:px-6">
                <p class="font-medium text-gray-500 text-sm dark:text-gray-400">Client timestamp</p>
              </th>
              <th class="px-5 py-3 text-left sm:px-6">
                <p class="font-medium text-gray-500 text-sm dark:text-gray-400">Actions</p>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="change in deviceChanges" :key="change.id" class="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-700/30">
              <td class="px-5 py-4 sm:px-6">
                <div class="block font-medium text-gray-800 text-sm dark:text-white/90">
                  {{ change.tableName }}
                </div>
              </td>
              <td class="px-5 py-4 sm:px-6 max-w-[150px] truncate">
                <div class="block font-medium text-gray-800 text-sm dark:text-white/90">
                  {{ change.recordId }}
                </div>
              </td>
              <td class="px-5 py-4 sm:px-6">
                <span 
                  class="inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] text-xs font-medium"
                  :class="{
                    'bg-success-500 text-white': change.changeType === 'CREATE',
                    'bg-warning-500 text-white': change.changeType === 'UPDATE',
                    'bg-red-500 text-white': change.changeType === 'DELETE'
                  }"
                >
                  {{ change.changeType }}
                </span>
              </td>
              <td class="px-5 py-4 sm:px-6 max-w-[150px] truncate">
                <div class="block font-medium text-gray-800 text-sm dark:text-white/90">
                  {{ change.deviceId }}
                </div>
              </td>
              <td class="px-5 py-4 sm:px-6 max-w-[150px] truncate">
                <div class="block font-medium text-gray-800 text-sm dark:text-white/90">
                  {{ change.userIdentifier }}
                </div>
              </td>
              <td class="px-5 py-4 sm:px-6">
                <div class="block font-medium text-gray-800 text-sm dark:text-white/90">
                  {{ formatDate(change.clientTimestamp) }}
                </div>
              </td>
              <td class="px-5 py-4 sm:px-6">
                <div class="flex space-x-3">
                  <button 
                    @click="viewChangeDetails(change)" 
                    class="text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  </button>
                  <button 
                    @click="viewRecordTimeline(change.tableName, change.recordId)" 
                    title="View timeline"
                    class="text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination / Load More -->
        <div v-if="hasMore && !isLoading" class="mt-6 flex justify-center pb-4">
          <button 
            @click="loadMore" 
            class="px-4 py-2 text-primary-600 font-medium hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 flex items-center"
          >
            Load more
          </button>
        </div>

        <!-- Loading indicator when loading more -->
        <div v-if="isLoading && deviceChanges.length" class="py-4 flex justify-center">
          <div class="animate-spin">
            <svg xmlns="http://www.w3.org/2000/svg" class="text-primary-500 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Change Details Modal -->    
    <ChangeDetailModal 
      :is-open="showChangeDetailsModal" 
      :selected-change="selectedChange" 
      @close="showChangeDetailsModal = false" 
    />

    <!-- Timeline Modal -->
    <TimelineModal 
      :is-open="showTimelineModal" 
      :timeline="timeline" 
      :is-loading="isLoadingTimeline" 
      @close="showTimelineModal = false" 
      @view-change-details="viewChangeDetails" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { DeviceChangeDto, DeviceChangeTimelineDto } from '~/api-client/model'
import { useDeviceChangesStore } from '~/stores/deviceChangesStore'
import { storeToRefs } from 'pinia'
import ChangeDetailModal from './change-detail-modal.vue'
import TimelineModal from './timeline-modal.vue'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  }
})

const deviceChangesStore = useDeviceChangesStore()
const { 
  deviceChanges, 
  changesByTable,
  isLoading, 
  paginationState, 
  recordTimeline 
} = storeToRefs(deviceChangesStore)

const tableNames = computed(() => {
  if (changesByTable.value && changesByTable.value.tables) {
    return changesByTable.value.tables.map(table => table.tableName);
  }
  return [];
})

const selectedTable = ref('')
const selectedChangeType = ref('')
const recordId = ref('')
const deviceId = ref('')
const userIdentifier = ref('')
const startDate = ref('')
const endDate = ref('')

const showTimelineModal = ref(false)
const showChangeDetailsModal = ref(false)
const selectedChange = ref<DeviceChangeDto | null>(null)
const timeline = ref<DeviceChangeTimelineDto | null>(null)
const isLoadingTimeline = ref(false)

const hasMore = computed(() => paginationState.value.hasMore)

// Create a simple debounce function
function debounce(fn: Function, delay: number) {
  let timeoutId: NodeJS.Timeout | null = null
  return (...args: any[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

const debounceSearch = debounce(() => {
  applyFilters()
}, 500)

onMounted(async () => {
  await deviceChangesStore.fetchChangesByTable(props.projectId)
  await fetchDeviceChanges()
})

watch(recordTimeline, (newValue) => {
  if (newValue) {
    timeline.value = newValue
  }
})

async function fetchDeviceChanges() {
  await deviceChangesStore.fetchDeviceChanges(props.projectId)
}

async function loadMore() {
  await deviceChangesStore.loadMoreDeviceChanges(props.projectId)
}

function applyFilters() {
  deviceChangesStore.setFilters({
    tableName: selectedTable.value || undefined,
    changeType: selectedChangeType.value || undefined,
    recordId: recordId.value || undefined,
    deviceId: deviceId.value || undefined,
    userIdentifier: userIdentifier.value || undefined,
    startDate: startDate.value || undefined,
    endDate: endDate.value || undefined
  })
  
  fetchDeviceChanges()
}

function clearFilters() {
  selectedTable.value = ''
  selectedChangeType.value = ''
  recordId.value = ''
  deviceId.value = ''
  userIdentifier.value = ''
  startDate.value = ''
  endDate.value = ''
  
  deviceChangesStore.clearFilters()
  fetchDeviceChanges()
}

function viewChangeDetails(change: DeviceChangeDto) {
  showTimelineModal.value = false
  selectedChange.value = change
  showChangeDetailsModal.value = true
}

async function viewRecordTimeline(tableName: string, recordId: string) {
  isLoadingTimeline.value = true
  try {
    await deviceChangesStore.fetchRecordTimeline(props.projectId, tableName, recordId)
    showTimelineModal.value = true
  } catch (error) {
    console.error('Failed to fetch timeline:', error)
  } finally {
    isLoadingTimeline.value = false
  }
}

function formatDate(dateString: string) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
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
