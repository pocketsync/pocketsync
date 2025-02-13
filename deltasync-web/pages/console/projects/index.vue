<template>
    <div>
        <div class="sm:flex sm:items-center">
            <div class="sm:flex-auto">
                <h1 class="text-xl font-semibold text-gray-900">Projects</h1>
                <p class="mt-2 text-sm text-gray-700">A list of all your DeltaSync apps and their registered users.</p>
            </div>
            <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button @click="showCreateProjectModal = true"
                    class="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
                    Create project
                </button>
            </div>
        </div>

        <div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="project in projects" :key="project.id"
                class="relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div class="p-6 flex-1">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-medium text-gray-900">{{ project.name }}</h3>
                        <button class="text-gray-400 hover:text-gray-500">
                            <component :is="DotsThreeIcon" weight="bold" class="h-5 w-5" />
                        </button>
                    </div>
                    <div class="mt-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-2">
                                <component :is="UsersIcon" class="h-5 w-5 text-gray-400" />
                                <span class="text-sm text-gray-500">{{ project.users.length }} registered users</span>
                            </div>
                            <span class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                {{ project.activeUsers }} active today
                            </span>
                        </div>
                        <div class="mt-4">
                            <div class="flex justify-between text-sm text-gray-500">
                                <span>Storage used</span>
                                <span>{{ formatStorage(project.storageUsed) }}</span>
                            </div>
                            <div class="mt-1 overflow-hidden rounded-full bg-gray-200">
                                <div class="h-2 rounded-full bg-primary-600"
                                    :style="{ width: (project.storageUsed / project.storageLimit * 100) + '%' }"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-6 py-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2 text-sm text-gray-500">
                            <component :is="DevicesIcon" class="h-5 w-5" />
                            <span>{{ project.devices }} devices</span>
                        </div>
                        <NuxtLink :to="'/console/projects/' + project.id"
                            class="text-sm font-medium text-primary-600 hover:text-primary-500">
                            View details
                        </NuxtLink>
                    </div>
                </div>
            </div>

            <!-- Empty state -->
            <div v-if="projects.length === 0"
                class="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <component :is="FolderIcon" class="mx-auto h-12 w-12 text-gray-400" />
                <span class="mt-2 block text-sm font-semibold text-gray-900">No projects</span>
                <p class="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
                <NuxtLink to="/console/projects/create"
                    class="mt-6 inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
                    Create Project
                </NuxtLink>
            </div>
        </div>

        <!-- Create Project Modal -->
        <CreateProjectModal 
            :show="showCreateProjectModal"
            @close="showCreateProjectModal = false"
            @project-created="handleProjectCreated"
        />
    </div>
</template>

<script setup>
import { PhFolder, PhDotsThree, PhUsers, PhDeviceMobile } from '@phosphor-icons/vue'
import { ref } from 'vue'
import CreateProjectModal from '~/components/projects/create-project-modal.vue'

definePageMeta({
    layout: 'dashboard'
})

const FolderIcon = PhFolder
const DotsThreeIcon = PhDotsThree
const UsersIcon = PhUsers
const DevicesIcon = PhDeviceMobile

const showCreateProjectModal = ref(false)

function handleProjectCreated(project) {
    // Here you would typically refresh the projects list
    // For now, we'll just add the new project to the list
    projects.value.unshift({
        id: project.id,
        name: project.name,
        users: [],
        activeUsers: 0,
        devices: 0,
        storageUsed: 0,
        storageLimit: 5 * 1024 * 1024 * 1024 // 5GB
    })
}

// Sample data - replace with actual API call
const projects = ref([
    {
        id: 1,
        name: 'Mobile App Sync',
        users: Array(1234), // Simulating array length for user count
        activeUsers: 856,
        devices: 2891,
        storageUsed: 2.1 * 1024 * 1024 * 1024, // 2.1GB
        storageLimit: 5 * 1024 * 1024 * 1024 // 5GB
    },
    {
        id: 2,
        name: 'Web Dashboard',
        users: Array(421),
        activeUsers: 198,
        devices: 534,
        storageUsed: 0.8 * 1024 * 1024 * 1024, // 0.8GB
        storageLimit: 5 * 1024 * 1024 * 1024 // 5GB
    }
])

function formatStorage(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
}
</script>