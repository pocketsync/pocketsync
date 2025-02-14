<template>
    <div v-if="errorMessage || (validationErrors && Object.keys(validationErrors).length > 0)" class="mb-4 rounded-md bg-red-50 p-4">
        <div class="flex">
            <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
            </div>
            <div class="ml-3">
                <p class="text-sm font-medium text-red-800">{{ errorMessage }}</p>
                <ul v-if="validationErrors" class="mt-2 text-sm text-red-700 list-disc list-inside">
                    <li v-for="(errors, field) in validationErrors" :key="field">
                        {{ errors.join(', ') }}
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    error: {
        type: [String, Object],
        default: null
    },
    validationErrors: {
        type: Object,
        default: null
    }
})

const errorMessage = computed(() => {
    if (typeof props.error === 'string') return props.error
    return props.error?.message || ''
})
</script>