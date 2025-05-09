<template>
  <div class="p-6 pb-16 space-y-6">
    <PageBreadcrumb :pageTitle="'Sync conflicts'" :items="[
      { label: 'Projects', path: '/console/projects' },
      { label: currentProject?.name || 'Project', path: `/console/projects/${projectId}` },
      { label: 'Sync conflicts', path: `/console/projects/${projectId}/conflicts` }
    ]" />

    <ErrorAlert v-if="error" :message="error?.message" class="mb-4" />
    
    <!-- Filters and Actions -->
    <div class="flex flex-col md:flex-row justify-between gap-4 mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <PhTable class="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
          <select
            v-model="tableFilter"
            @change="handleFilterChange"
            class="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2.5 dark:bg-slate-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
          >
            <option value="">All tables</option>
            <option v-for="table in availableTables" :key="table" :value="table">{{ table }}</option>
          </select>
        </div>
        
        <div class="relative">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <PhDeviceMobile class="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
          <select
            v-model="deviceFilter"
            @change="handleFilterChange"
            class="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2.5 dark:bg-slate-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
          >
            <option value="">All devices</option>
            <option v-for="device in availableDevices" :key="device" :value="device">{{ device }}</option>
          </select>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <button 
          @click="refreshConflicts"
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-white border border-primary-500 rounded-md shadow-sm hover:bg-primary-50 dark:bg-slate-800 dark:text-primary-400 dark:border-primary-500/50 dark:hover:bg-primary-900/20 transition-colors"
        >
          <PhArrowsClockwise class="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>
    </div>
    
    <!-- Conflicts Table -->
    <ConflictsTable 
      :conflicts="conflicts" 
      :isLoading="isLoading" 
      :pagination="pagination"
      @load-more="handleLoadMore"
      @view-details="handleViewDetails"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useConflicts } from '~/composables/useConflicts'
import { useProjectsStore } from '~/stores/projectsStore'
import { useConflictsStore } from '~/stores/conflictsStore'
import { useToast } from '~/composables/useToast'
import PageBreadcrumb from '~/components/common/page-breadcrumb.vue'
import ErrorAlert from '~/components/common/error-alert.vue'
import ConflictsTable from '~/components/conflicts/conflicts-table.vue'
import { PhTable, PhDeviceMobile, PhArrowsClockwise } from '@phosphor-icons/vue'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const route = useRoute()
const projectId = route.params.id as string
const projectsStore = useProjectsStore()
const conflictsStore = useConflictsStore()
const toast = useToast()

const { 
  conflicts, 
  isLoading, 
  error, 
  pagination,
  filters,
  getConflictsByProject,
  setFilters,
  clearFilters
} = useConflicts()

const tableFilter = ref('')
const deviceFilter = ref('')

const availableTables = computed(() => {
  const tables = new Set<string>()
  conflicts.value.forEach(conflict => {
    if (conflict.tableName) {
      tables.add(conflict.tableName)
    }
  })
  return Array.from(tables).sort()
})

const availableDevices = computed(() => {
  const devices = new Set<string>()
  conflicts.value.forEach(conflict => {
    if (conflict.deviceId) {
      devices.add(conflict.deviceId)
    }
  })
  return Array.from(devices).sort()
})

onMounted(async () => {
  if (projectId) {
    await projectsStore.fetchProjectById(projectId)
    await getConflictsByProject(projectId)
  }
})

const handleFilterChange = () => {
  setFilters({
    tableName: tableFilter.value || undefined,
    deviceId: deviceFilter.value || undefined
  })
  getConflictsByProject(projectId)
}

const refreshConflicts = async () => {
  await getConflictsByProject(projectId)
  toast.show('Conflicts refreshed', 'success')
}

const handleLoadMore = async () => {
  await getConflictsByProject(projectId, pagination.value.page + 1, pagination.value.limit)
}

const handleViewDetails = (conflictId: string) => {
  console.log('Viewing details for conflict:', conflictId)
}
</script>
