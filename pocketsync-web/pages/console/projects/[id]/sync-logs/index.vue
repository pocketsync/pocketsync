<template>
  <PageBreadcrumb page-title="Sync logs" :items="[
    { label: 'Projects', path: '/console/projects' },
    { label: 'Sync logs', path: `/console/projects/${projectId}/sync-logs` }
  ]" />

  <div>

    <div class="mt-6 grid grid-cols-1 gap-6">
      <!-- Filters Panel (mobile collapsible) -->
      <div class="lg:hidden">
        <details class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <summary class="p-4 font-medium text-gray-900 dark:text-white cursor-pointer flex items-center">
            <h3 class="text-base">Filters</h3>
            <div class="ml-auto">
              <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </summary>
          <div class="p-4 pt-0 border-t border-gray-200 dark:border-gray-800">
            <!-- Filter content for mobile -->
            <div class="space-y-4">
              <!-- Log Level Filter -->
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Log Level</label>
                <div class="grid grid-cols-2 gap-2">
                  <div v-for="level in logLevels" :key="level.value" class="flex items-center">
                    <div x-data="{ checkboxToggle: selectedLevels.includes(level.value) }">
                      <label :for="`mobile-level-${level.value}`"
                        class="flex cursor-pointer items-center text-sm font-medium text-gray-700 select-none dark:text-gray-400">
                        <div class="relative">
                          <input type="checkbox" :id="`mobile-level-${level.value}`" v-model="selectedLevels"
                            :value="level.value" class="sr-only" @change="selectedLevels = selectedLevels.includes(level.value) ? selectedLevels.filter(l => l !== level.value) : [...selectedLevels, level.value]">
                          <div
                            :class="selectedLevels.includes(level.value) ? 'border-primary-600 bg-primary-600' : 'bg-transparent border-gray-300 dark:border-gray-700'"
                            class="hover:border-primary-500 dark:hover:border-primary-500 mr-3 flex h-5 w-5 items-center justify-center rounded-md border-[1.25px] bg-transparent border-gray-300 dark:border-gray-700">
                            <span :class="selectedLevels.includes(level.value) ? '' : 'opacity-0'" class="opacity-0">
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="white" stroke-width="1.94437"
                                  stroke-linecap="round" stroke-linejoin="round"></path>
                              </svg>
                            </span>
                          </div>
                        </div>
                        {{ level.label }}
                      </label>
                    </div>
                  </div>
                </div>
              </div>


              <!-- User, Device, Session Filters -->
              <div class="space-y-4">
                <div>
                  <label for="mobile-user-filter"
                    class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">User Identifier</label>
                  <input id="mobile-user-filter" v-model="userIdentifier" type="text" placeholder="Filter by user"
                    class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-slate-800 dark:text-white dark:focus:border-primary-500" />
                </div>
                <div>
                  <label for="mobile-device-filter"
                    class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Device ID</label>
                  <input id="mobile-device-filter" v-model="deviceId" type="text" placeholder="Filter by device"
                    class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-slate-800 dark:text-white dark:focus:border-primary-500" />
                </div>
                <div>
                  <label for="mobile-session-filter"
                    class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Sync Session ID</label>
                  <input id="mobile-session-filter" v-model="syncSessionId" type="text" placeholder="Filter by session"
                    class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-slate-800 dark:text-white dark:focus:border-primary-500" />
                </div>
              </div>

              <div class="flex space-x-3 pt-2">
                <button 
                  @click="clearAllFilters"
                  class="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  :class="{ 'opacity-50 cursor-not-allowed': isLoading || !hasActiveFilters }"
                  :disabled="!hasActiveFilters"
                >
                  <span class="flex items-center justify-center">
                    <PhEraser class="mr-2 h-4 w-4" />
                    Reset
                  </span>
                </button>
                <button 
                  @click="applyFilters"
                  class="flex-1 rounded-md bg-primary-500 px-3 py-2 text-sm text-white shadow-sm hover:bg-primary-600 focus:outline-none transition-colors"
                  :class="{ 'opacity-50 cursor-not-allowed': isLoading }"
                  :disabled="isLoading"
                >
                  <span class="flex items-center justify-center">
                    <PhFunnel v-if="!isLoading" class="mr-2 h-4 w-4" />
                    <PhSpinner v-else class="mr-2 h-4 w-4 animate-spin" />
                    Apply
                  </span>
                </button>
              </div>
            </div>
          </div>
        </details>
      </div>

      <div class="lg:grid lg:grid-cols-4 lg:gap-6">
        <!-- Desktop Filters Panel -->
        <div class="hidden lg:block lg:col-span-1">
          <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-slate-800/50 shadow-sm overflow-hidden">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
              <PhFunnel class="h-4 w-4 mr-2 text-primary-500 dark:text-primary-400" />
              <h3 class="text-base font-medium text-gray-900 dark:text-white">Filters</h3>
            </div>
            
            <div class="p-5 bg-gray-50 dark:bg-slate-800/30 space-y-5">
              <!-- Log Level Filter -->
              <div>
                <div class="flex items-center mb-2">
                  <PhList class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Log Level</span>
                </div>
                <div class="flex flex-wrap gap-2 mt-2">
                  <div v-for="level in logLevels" :key="level.value" class="flex-shrink-0">
                    <button
                      @click="toggleLevel(level.value)"
                      :class="{
                        'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30': level.value === 'INFO' && selectedLevels.includes(level.value),
                        'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800/30': level.value === 'WARNING' && selectedLevels.includes(level.value),
                        'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30': level.value === 'ERROR' && selectedLevels.includes(level.value),
                        'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700/30': level.value === 'DEBUG' && selectedLevels.includes(level.value),
                        'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600': !selectedLevels.includes(level.value)
                      }"
                      class="px-3 py-1.5 text-xs font-medium rounded-md border transition-colors"
                    >
                      {{ level.label }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- User Filter -->
              <div>
                <div class="flex items-center mb-2">
                  <PhUser class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">User Identifier</span>
                </div>
                <div class="relative">
                  <input id="user-filter" v-model="userIdentifier" type="text" placeholder="Filter by user"
                    class="w-full rounded-md border border-gray-300 bg-white pl-3 pr-8 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-slate-800 dark:text-white dark:focus:border-primary-500" />
                  <button 
                    v-if="userIdentifier" 
                    @click="userIdentifier = ''" 
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <PhX class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <!-- Device Filter -->
              <div>
                <div class="flex items-center mb-2">
                  <PhDeviceMobile class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Device ID</span>
                </div>
                <div class="relative">
                  <input id="device-filter" v-model="deviceId" type="text" placeholder="Filter by device"
                    class="w-full rounded-md border border-gray-300 bg-white pl-3 pr-8 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-slate-800 dark:text-white dark:focus:border-primary-500" />
                  <button 
                    v-if="deviceId" 
                    @click="deviceId = ''" 
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <PhX class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <!-- Session Filter -->
              <div>
                <div class="flex items-center mb-2">
                  <PhArrowsClockwise class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Sync Session ID</span>
                </div>
                <div class="relative">
                  <input id="session-filter" v-model="syncSessionId" type="text" placeholder="Filter by session"
                    class="w-full rounded-md border border-gray-300 bg-white pl-3 pr-8 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-slate-800 dark:text-white dark:focus:border-primary-500" />
                  <button 
                    v-if="syncSessionId" 
                    @click="syncSessionId = ''" 
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <PhX class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex space-x-3 pt-2">
                <button 
                  @click="clearAllFilters"
                  class="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  :class="{ 'opacity-50 cursor-not-allowed': isLoading || !hasActiveFilters }"
                  :disabled="isLoading || !hasActiveFilters"
                >
                  <span class="flex items-center justify-center">
                    <PhEraser class="mr-2 h-4 w-4" />
                    Reset
                  </span>
                </button>
                <button 
                  @click="applyFilters"
                  class="flex-1 rounded-md bg-primary-500 px-3 py-2 text-sm text-white shadow-sm hover:bg-primary-600 focus:outline-none transition-colors"
                  :class="{ 'opacity-50 cursor-not-allowed': isLoading }"
                  :disabled="isLoading"
                >
                  <span class="flex items-center justify-center">
                    <PhFunnel v-if="!isLoading" class="mr-2 h-4 w-4" />
                    <PhSpinner v-else class="mr-2 h-4 w-4 animate-spin" />
                    Apply
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="col-span-1 lg:col-span-3">
          <div class="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <LogsTable :logs="filteredLogs" :is-loading="isLoading" :pagination="pagination" @load-more="loadMoreLogs"
              @filter-change="handleTableFilterChange" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { PhFunnel, PhSpinner, PhX, PhUser, PhDeviceMobile, PhArrowsClockwise, PhList, PhEraser } from '@phosphor-icons/vue'
import { useSyncLogs } from '~/composables/useSyncLogs'
import { useSyncLogsStore } from '~/stores/syncLogsStore'
import LogsTable from '~/components/sync-logs/logs-table.vue'
import PageBreadcrumb from '~/components/common/page-breadcrumb.vue'

definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)

// Composables
const {
  logs: syncLogs,
  filteredLogs,
  isLoading,
  pagination,
  filters,
  getLogsByProject,
  setFilters,
  clearFilters
} = useSyncLogs()

// Store
const syncLogsStore = useSyncLogsStore()

// Filter state
const selectedLevels = ref<string[]>([])
const userIdentifier = ref('')
const deviceId = ref('')
const syncSessionId = ref('')
const startDate = ref<Date | null>(null)
const endDate = ref<Date | null>(null)
const tableFilters = ref({
  searchQuery: '',
  level: undefined as string | undefined,
  timeFilter: 'all'
})

// Log levels for filter
const logLevels = [
  { label: 'Info', value: 'INFO' },
  { label: 'Warning', value: 'WARNING' },
  { label: 'Error', value: 'ERROR' },
  { label: 'Debug', value: 'DEBUG' }
]

// Computed properties
const hasActiveFilters = computed(() => {
  return (
    selectedLevels.value.length > 0 ||
    userIdentifier.value.trim() !== '' ||
    deviceId.value.trim() !== '' ||
    syncSessionId.value.trim() !== '' ||
    startDate.value !== null ||
    endDate.value !== null ||
    tableFilters.value.searchQuery !== ''
  )
})

// Methods
const fetchLogs = async (page = 1) => {
  try {
    await getLogsByProject(projectId.value, page)
  } catch (err) {
    console.error('Error fetching logs:', err)
  }
}

const applyFilters = async () => {
  // Convert selected levels to a single level if only one is selected
  const level = selectedLevels.value.length === 1 ? selectedLevels.value[0] : undefined

  // Format dates to ISO strings if they exist
  const formattedStartDate = startDate.value ? startDate.value.toISOString() : undefined
  const formattedEndDate = endDate.value ? endDate.value.toISOString() : undefined

  // Set filters in the composable
  setFilters({
    level,
    userIdentifier: userIdentifier.value || undefined,
    deviceId: deviceId.value || undefined,
    syncSessionId: syncSessionId.value || undefined,
    startDate: formattedStartDate,
    endDate: formattedEndDate,
    searchQuery: tableFilters.value.searchQuery
  })

  // Fetch logs with new filters
  await fetchLogs()
}

const clearAllFilters = () => {
  selectedLevels.value = []
  userIdentifier.value = ''
  deviceId.value = ''
  syncSessionId.value = ''
  startDate.value = null
  endDate.value = null
  tableFilters.value.searchQuery = ''

  clearFilters()
  fetchLogs()
}

const toggleLevel = (level: string) => {
  if (selectedLevels.value.includes(level)) {
    selectedLevels.value = selectedLevels.value.filter(l => l !== level)
  } else {
    selectedLevels.value.push(level)
  }
}

const loadMoreLogs = async () => {
  await fetchLogs(pagination.value.page + 1)
}

const handleTableFilterChange = (newFilters: any) => {
  tableFilters.value = { ...tableFilters.value, ...newFilters }

  // If the filter is a level filter, update the checkboxes
  if (newFilters.level) {
    selectedLevels.value = [newFilters.level]
  }

  // Apply filters immediately for search queries
  if ('searchQuery' in newFilters) {
    setFilters({ searchQuery: newFilters.searchQuery })
  }
}

// Lifecycle hooks
onMounted(async () => {
  await fetchLogs()
})

// Clean up when component is unmounted
onUnmounted(() => {
  syncLogsStore.reset()
})
</script>
