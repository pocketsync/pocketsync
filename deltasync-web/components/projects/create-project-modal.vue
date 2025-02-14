<template>
    <div v-if="show" class="fixed inset-0 z-[100]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-500/60 transition-opacity"></div>

        <!-- Modal panel -->
        <div class="fixed inset-0 z-[100] overflow-y-auto">
            <div class="flex min-h-full items-center justify-center p-4 sm:p-0">
                <div
                    class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">

                    <div>
                        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                            <PhFolder class="h-6 w-6 text-primary-600" />
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
                                            :class="{ 'ring-red-300': errors.name }" placeholder="My Awesome App"
                                            required maxlength="255" @blur="validateForm"
                                            :aria-invalid="errors.name ? 'true' : 'false'"
                                            :aria-describedby="errors.name ? 'project-name-error' : undefined" />
                                        <p class="mt-2 text-sm text-gray-500">Choose a name that represents your
                                            application.
                                            This will help you identify your project later.</p>
                                        <p v-if="errors.name" id="project-name-error" class="mt-2 text-sm text-red-600">{{ errors.name.join('\n') }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Error Alert -->
                    <ErrorAlert v-if="error" :error="error" title="Error creating project" class="mt-4" />

                    <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button type="button" @click="createProject" :disabled="isLoading"
                            class="inline-flex w-full justify-center cursor-pointer rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:col-start-2">
                            <PhSpinner v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
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
import { useProjects } from '~/composables/useProjects'
import { useValidation } from '~/composables/useValidation'
import ErrorAlert from '~/components/common/error-alert.vue'

const props = defineProps({
    show: {
        type: Boolean,
        required: true
    }
})

const emit = defineEmits(['close'])

const projectName = ref('')
const isLoading = ref(false)
const error = ref('')

const { createProject: createProjectApi } = useProjects()
const { validate, rules, errors } = useValidation()

async function createProject() {
    errors.value = { name: '', submit: '' } // Reset errors before validation
    error.value = '' // Reset API error
    
    const isValid = validateForm()

    if (!isValid) {
        return
    }

    isLoading.value = true

    try {
        const project = await createProjectApi({ name: projectName.value })
        emit('project-created', project)
        closeModal()
    } catch (err) {
        error.value = err.message || 'Failed to create project'
    } finally {
        isLoading.value = false
    }
}

function validateForm() {
    const validationRules = {
        name: [
            rules.required('Project name is required'),
            rules.maxLength(255, 'Project name must be less than 255 characters')
        ]
    }

    const validationResult = validate({ name: projectName.value.trim() }, validationRules)
    if (!validationResult) {
        return false
    }
    return true
}

function closeModal() {
    projectName.value = ''
    errors.value = {}
    emit('close')
}
</script>