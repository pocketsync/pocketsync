<template>
    <PageBreadcrumb :pageTitle="'Data exploration'" :items="[
        { label: 'Projects', path: '/console/projects' },
        { label: currentProject?.name || 'Project', path: `/console/projects/${projectId}` },
        { label: 'Data exploration', path: `/console/projects/${projectId}/data-exploration` }
    ]" />

    <div class="container mx-auto px-4 py-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div class="flex space-x-2 mt-4 md:mt-0">
                <button 
                    class="px-4 py-2 text-sm font-medium rounded-lg focus:ring-4 focus:outline-none"
                    :class="{
                        'text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800': activeTab === 'table-summary',
                        'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-primary-300 dark:bg-slate-800 dark:text-white dark:border-gray-600 dark:hover:bg-slate-700 dark:hover:border-gray-600 dark:focus:ring-primary-800': activeTab !== 'table-summary'
                    }"
                    @click="activeTab = 'table-summary'"
                >
                    Table Summary
                </button>
                <button 
                    class="px-4 py-2 text-sm font-medium rounded-lg focus:ring-4 focus:outline-none"
                    :class="{
                        'text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800': activeTab === 'device-changes',
                        'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-primary-300 dark:bg-slate-800 dark:text-white dark:border-gray-600 dark:hover:bg-slate-700 dark:hover:border-gray-600 dark:focus:ring-primary-800': activeTab !== 'device-changes'
                    }"
                    @click="activeTab = 'device-changes'"
                >
                    Device Changes
                </button>
            </div>
        </div>

        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <div v-if="activeTab === 'table-summary'">
                    <ChangesByTable 
                        :projectId="projectId" 
                        @view-table="handleViewTable"
                    />
                </div>
                <div v-else-if="activeTab === 'device-changes'">
                    <DeviceChangesTable :projectId="projectId" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import PageBreadcrumb from '~/components/common/page-breadcrumb.vue';
import DeviceChangesTable from '~/components/device-changes/device-changes-table.vue';
import ChangesByTable from '~/components/device-changes/changes-by-table.vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useProjectsStore } from '~/stores/projectsStore';
import { useDeviceChangesStore } from '~/stores/deviceChangesStore';

definePageMeta({
    layout: 'dashboard'
})

const route = useRoute()
const projectId = route.params.id as string
const activeTab = ref('table-summary')

const projectsStore = useProjectsStore()
const deviceChangesStore = useDeviceChangesStore()
const { currentProject } = storeToRefs(projectsStore)

onMounted(async () => {
    if (projectId) {
        await projectsStore.fetchProjectById(projectId)
    }
})

function handleViewTable(tableName: string) {
    activeTab.value = 'device-changes'
    deviceChangesStore.setFilters({ tableName })
}
</script>
