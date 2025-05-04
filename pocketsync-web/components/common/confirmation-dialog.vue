<template>
    <div v-if="show" class="fixed inset-0 z-[100]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="fixed inset-0 bg-gray-500/60 dark:bg-gray-900/60 transition-opacity"></div>

        <div class="fixed inset-0 z-[100] overflow-y-auto">
            <div class="flex min-h-full items-center justify-center p-4 sm:p-0">
                <div
                    class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                    <div class="sm:flex sm:items-start">
                        <div class="mt-3 text-center sm:mt-0 sm:text-left">
                            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-gray-100" id="modal-title">{{ title }}
                            </h3>
                            <div class="mt-2">
                                <p class="text-sm text-gray-500 dark:text-gray-400">{{ message }}</p>
                                <div v-if="verificationText" class="mt-4">
                                    <label for="verification" class="block text-sm font-medium text-gray-900 dark:text-gray-100">Please
                                        type "{{ verificationText }}" to confirm</label>
                                    <div class="mt-2">
                                        <input type="text" id="verification" v-model="userInput"
                                            class="block w-full rounded-md border-0 py-2 px-3 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                            :class="{ 'ring-red-300': showError }" @input="validateInput"
                                            :disabled="loading" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button type="button" @click="handleConfirm()"
                            class="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto cursor-pointer"
                            :disabled="loading || (verificationText ? userInput !== verificationText : false)">
                            <PhSpinner v-if="loading" :size="20" class="animate-spin" />
                            {{ confirmText }}
                        </button>
                        <button type="button" @click="$emit('cancel')"
                            class="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto cursor-pointer"
                            :disabled="loading">
                            {{ cancelText }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { PhSpinner } from '@phosphor-icons/vue'
import { ref, watch } from 'vue'

const props = defineProps({
    show: {
        type: Boolean,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    confirmText: {
        type: String,
        default: 'Confirm'
    },
    cancelText: {
        type: String,
        default: 'Cancel'
    },
    loading: {
        type: Boolean,
        default: false
    },
    verificationText: {
        type: String,
        default: ''
    }
})
const emit = defineEmits(['confirm', 'cancel'])

const userInput = ref('')
const showError = ref(false)

function validateInput() {
    showError.value = userInput.value.length > 0 && userInput.value !== props.verificationText
}

function handleConfirm() {
    if (!props.verificationText || userInput.value === props.verificationText) {
        emit('confirm')
    }
}

watch(() => props.show, (newValue) => {
    if (!newValue) {
        userInput.value = ''
        showError.value = false
    }
})
</script>