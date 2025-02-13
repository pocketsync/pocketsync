<template>
    <div>
        <div class="space-y-12">
            <div class="grid grid-cols-1 gap-x-8 gap-y-10 pb-12 md:grid-cols-3">
                <div>
                    <h2 class="text-base font-semibold leading-7 text-gray-900">Project Settings</h2>
                    <p class="mt-1 text-sm leading-6 text-gray-600">Update your project settings and preferences.</p>
                </div>

                <div class="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 md:col-span-2">
                    <div class="sm:col-span-4">
                        <label for="project-name" class="block text-sm font-medium leading-6 text-gray-900">Project name</label>
                        <div class="mt-2">
                            <div class="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-600">
                                <input type="text" name="project-name" id="project-name" v-model="projectName"
                                    class="block flex-1 border-0 bg-transparent py-1.5 pl-2 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                                    :placeholder="project.name" />
                            </div>
                        </div>
                    </div>

                    <div class="col-span-full">
                        <label for="description" class="block text-sm font-medium leading-6 text-gray-900">Description</label>
                        <div class="mt-2">
                            <textarea id="description" name="description" rows="3" v-model="description"
                                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                :placeholder="project.description"></textarea>
                        </div>
                        <p class="mt-3 text-sm leading-6 text-gray-600">Write a few sentences about your project.</p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-x-8 gap-y-10 border-t border-gray-900/10 pt-12 md:grid-cols-3">
                <div>
                    <h2 class="text-base font-semibold leading-7 text-gray-900">Danger Zone</h2>
                    <p class="mt-1 text-sm leading-6 text-gray-600">Destructive actions that cannot be undone.</p>
                </div>

                <div class="max-w-2xl space-y-6 md:col-span-2">
                    <div class="flex items-center justify-between rounded-lg bg-red-50 p-4">
                        <div>
                            <h3 class="text-sm font-medium leading-6 text-red-800">Delete this project</h3>
                            <p class="mt-1 text-sm text-red-700">Once you delete a project, there is no going back. Please be certain.</p>
                        </div>
                        <button type="button" @click="confirmDelete"
                            class="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500">
                            Delete project
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-x-6">
            <button type="button" class="text-sm font-semibold leading-6 text-gray-900">Cancel</button>
            <button type="submit" @click="saveSettings"
                class="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
                Save
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
    project: {
        type: Object,
        required: true
    }
})

const projectName = ref(props.project.name)
const description = ref(props.project.description)

function saveSettings() {
    // Implement save settings functionality
}

function confirmDelete() {
    // Implement delete confirmation functionality
}
</script>