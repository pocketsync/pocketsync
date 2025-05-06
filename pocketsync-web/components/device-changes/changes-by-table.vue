<template>
  <div class="changes-by-table">
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <div class="animate-spin">
        <svg xmlns="http://www.w3.org/2000/svg" class="text-primary-500 h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
    </div>
    
    <div v-else-if="!tablesSummary.length" class="py-8 text-center">
      <p class="text-slate-500 dark:text-slate-400">
        No table change data available.
      </p>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="table in tablesSummary" :key="table.tableName" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="p-5">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">{{ table.tableName }}</h2>
          <div class="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 mb-4">
            <div class="text-sm text-gray-500 dark:text-gray-400">Total Changes</div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ table.counts.total }}</div>
          </div>
          
          <div class="flex flex-wrap gap-2 mt-4">
            <div class="inline-block px-3 py-1 rounded-[999px] text-xs font-medium bg-success-500 text-white">
              {{ table.counts.creates }} Creates
            </div>
            <div class="inline-block px-3 py-1 rounded-[999px] text-xs font-medium bg-warning-500 text-white">
              {{ table.counts.updates }} Updates
            </div>
            <div class="inline-block px-3 py-1 rounded-[999px] text-xs font-medium bg-danger-500 text-white">
              {{ table.counts.deletes }} Deletes
            </div>
          </div>
          
          <div class="flex justify-end mt-4">
            <button 
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800" 
              @click="viewTableChanges(table.tableName)"
            >
              View Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDeviceChangesStore } from '~/stores/deviceChangesStore'
import { storeToRefs } from 'pinia'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['view-table'])

const deviceChangesStore = useDeviceChangesStore()
const { isLoading, changesByTable } = storeToRefs(deviceChangesStore)
const tablesSummary = computed(() => {
  return changesByTable.value && changesByTable.value.tables ? changesByTable.value.tables : []
})

onMounted(async () => {
  await deviceChangesStore.fetchChangesByTable(props.projectId)
})

function viewTableChanges(tableName: string) {
  emit('view-table', tableName)
}
</script>
