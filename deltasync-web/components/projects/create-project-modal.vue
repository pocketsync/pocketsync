<template>
    <div v-if="show" class="fixed inset-0 z-[100]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-500/60 transition-opacity"></div>

        <!-- Modal panel -->
        <div class="fixed inset-0 z-[100] overflow-y-auto">
            <div class="flex min-h-full items-center justify-center p-4 sm:p-0">
                <div class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                
                    <div>
                        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                            <component :is="FolderIcon" class="h-6 w-6 text-primary-600" />
                        </div>
                        <div class="mt-3 text-center sm:mt-5">
                            <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">Create New
                                Project</h3>
                            <div class="mt-2">
                                <p class="text-sm text-gray-500">
                                    Create a new DeltaSync project to start syncing your app's data.
                                </p>
                            </div>
                        </div>

                        <div class="mt-5">
                            <div class="space-y-4">
                                <div>
                                    <label for="project-name"
                                        class="block text-sm font-medium leading-6 text-gray-900">Project
                                        name</label>
                                    <div class="mt-2">
                                        <input type="text" id="project-name" v-model="projectName"
                                            class="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                            :class="{ 'ring-red-300': errors.name }" placeholder="My Awesome App" />
                                        <p v-if="errors.name" class="mt-2 text-sm text-red-600">{{ errors.name }}
                                        </p>
                                        <p class="mt-2 text-sm text-gray-500">Choose a name that represents your
                                            application.
                                            This will help you identify your project later.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button type="button" @click="createProject" :disabled="isLoading"
                            class="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:col-start-2">
                            <component :is="LoadingIcon" v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                            {{ isLoading ? 'Creating...' : 'Create project' }}
                        </button>
                        <button type="button" @click="closeModal" :disabled="isLoading"
                            class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { PhFolder, PhSpinner } from '@phosphor-icons/vue'

const props = defineProps({
    show: {
        type: Boolean,
        required: true
    }
})

const emit = defineEmits(['close', 'project-created'])

const FolderIcon = PhFolder
const LoadingIcon = PhSpinner

const projectName = ref('')
const isLoading = ref(false)
const errors = ref({})

async function createProject() {
    if (!validateForm()) return

    isLoading.value = true
    errors.value = {}

    try {
        // Here you would make an API call to create the project
        // For now, we'll simulate it with a timeout
        await new Promise(resolve => setTimeout(resolve, 1000))

        emit('project-created', {
            id: Date.now().toString(),
            name: projectName.value,
            created_at: new Date()
        })
        closeModal()
    } catch (error) {
        console.error('Failed to create project:', error)
        errors.value.submit = 'Failed to create project. Please try again.'
    } finally {
        isLoading.value = false
    }
}

function validateForm() {
    errors.value = {}
    let isValid = true

    if (!projectName.value.trim()) {
        errors.value.name = 'Project name is required'
        isValid = false
    } else if (projectName.value.length > 255) {
        errors.value.name = 'Project name must be less than 255 characters'
        isValid = false
    }

    return isValid
}

function closeModal() {
    projectName.value = ''
    errors.value = {}
    emit('close')
}
</script>