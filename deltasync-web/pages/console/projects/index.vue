<template>
    <div>
        <div class="sm:flex sm:items-center">
            <div class="sm:flex-auto">
                <h1 class="text-xl font-semibold text-gray-900">Projects</h1>
                <p class="mt-2 text-sm text-gray-700">A list of all your DeltaSync apps and their registered users.</p>
            </div>
            <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button @click="showCreateProjectModal = true"
                    class="block rounded-md bg-primary-600 px-3 py-2 flex flex-inline items-center space-x-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
                    <PhPlus :size="20" />
                    <span>Create project</span>
                </button>
            </div>
        </div>

        <div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ProjectCard v-for="project in projects" :key="project.id" :project="project" />

            <!-- Empty state -->
            <div v-if="projects.length === 0"
                class="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <component :is="FolderIcon" class="mx-auto h-12 w-12 text-gray-400" />
                <span class="mt-2 block text-sm font-semibold text-gray-900">No projects</span>
                <p class="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
                <NuxtLink to="/console/projects/create"
                    class="mt-6 inline-flex items-center rounded-md bg-primary-600 px-3 py-2 space-x-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
                    <PhPlus :size="20" />

                    <span>Create project</span>
                </NuxtLink>
            </div>
        </div>

        <!-- Create Project Modal -->
        <CreateProjectModal :show="showCreateProjectModal" @close="showCreateProjectModal = false"
            @project-created="handleProjectCreated" />
    </div>
</template>

<script setup>
import { PhFolder, PhPlus } from '@phosphor-icons/vue'
import { ref } from 'vue'
import CreateProjectModal from '~/components/projects/create-project-modal.vue'
import ProjectCard from '~/components/projects/project-card.vue'

definePageMeta({
    layout: 'dashboard'
})

const FolderIcon = PhFolder

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
</script>