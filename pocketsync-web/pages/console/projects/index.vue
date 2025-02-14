<template>
    <div>
        <div class="sm:flex sm:items-center">
            <div class="sm:flex-auto">
                <h1 class="text-xl font-semibold text-gray-900">Projects</h1>
                <p class="mt-2 text-sm text-gray-700">A list of all your PocketSync apps and their registered users.</p>
            </div>
            <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button @click="showCreateProjectModal = true" v-if="!isLoading && projects.length > 0"
                    class="block rounded-md bg-primary-600 px-3 py-2 flex flex-inline items-center space-x-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
                    <PhPlus :size="20" />
                    <span>Create project</span>
                </button>
            </div>
        </div>

        <!-- Error Alert -->
        <ErrorAlert v-if="error" :error="error" title="Error loading projects" />

        <!-- Loading State -->
        <div v-if="isLoading && !projects.length" class="mt-8">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div v-for="i in 3" :key="i" class="animate-pulse rounded-lg border border-gray-200 bg-white p-6">
                    <div class="h-4 w-3/4 rounded bg-gray-200"></div>
                    <div class="mt-4 space-y-3">
                        <div class="h-3 w-1/2 rounded bg-gray-200"></div>
                        <div class="h-3 w-1/3 rounded bg-gray-200"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Projects Grid -->
        <div v-else class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ProjectCard v-for="project in projects" :key="project.id" :project="project" />

            <!-- Empty state -->
            <div v-if="!isLoading && projects.length === 0"
                class="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <component :is="FolderIcon" class="mx-auto h-12 w-12 text-gray-400" />
                <span class="mt-2 block text-sm font-semibold text-gray-900">No projects</span>
                <p class="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
                <button @click="showCreateProjectModal = true"
                    class="mt-6 inline-flex items-center rounded-md bg-primary-600 px-3 py-2 space-x-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
                    <PhPlus :size="20" />
                    <span>Create project</span>
                </button>
            </div>
        </div>

        <!-- Create Project Modal -->
        <CreateProjectModal
            :show="showCreateProjectModal" 
            @close="showCreateProjectModal = false"
            @project-created="projects.push($event)"
        />
    </div>
</template>

<script setup>
import { PhFolder, PhPlus } from '@phosphor-icons/vue'
import { ref, onMounted } from 'vue'
import CreateProjectModal from '~/components/projects/create-project-modal.vue'
import ProjectCard from '~/components/projects/project-card.vue'
import { useProjects } from '~/composables/useProjects'
import ErrorAlert from '~/components/common/error-alert.vue'

definePageMeta({
    layout: 'dashboard'
})

const FolderIcon = PhFolder
const showCreateProjectModal = ref(false)

// Initialize projects composable
const { projects, isLoading, error, fetchProjects } = useProjects()

// Load projects on component mount
onMounted(async () => {
    try {
        await fetchProjects()
    } catch (err) {
        // Error is handled by the composable
        console.error('Failed to fetch projects:', err)
    }
})
</script>