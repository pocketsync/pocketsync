<template>
    <div v-if="show" class="fixed inset-0 z-[100]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-500/60 transition-opacity"></div>

        <!-- Modal panel -->
        <div class="fixed inset-0 z-[100] overflow-y-auto">
            <div class="flex min-h-full items-center justify-center p-4 sm:p-0">
                <div
                    class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">

                    <div>
                        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                            <PhKey class="h-6 w-6 text-primary-600" />
                        </div>
                        <div class="mt-3 text-center sm:mt-5">
                            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-gray-100" id="modal-title">Create
                                Authentication
                                Token</h3>
                            <div class="mt-2">
                                <p class="text-sm text-gray-500 dark:text-gray-400">
                                    Create a new authentication token for your application. This token will be used to
                                    authenticate
                                    your app's requests.
                                </p>
                            </div>
                        </div>

                        <div class="mt-5">
                            <div class="space-y-4">
                                <div>
                                    <label for="token-name"
                                        class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Token
                                        Name</label>
                                    <div class="mt-2">
                                        <input type="text" id="token-name" v-model="tokenName"
                                            class="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                            :class="{ 'ring-red-300 ring-2': showError }"
                                            placeholder="e.g., Production API Token" />
                                        <p v-if="errors.tokenName" class="mt-2 text-sm text-red-600">
                                            {{ errors.tokenName.join(', ') }}
                                        </p>
                                    </div>
                                    <p class="mt-2 text-sm text-gray-500">A descriptive name to help you identify this
                                        token later.
                                    </p>
                                </div>

                                <div v-if="createdToken">
                                    <div class="rounded-md bg-blue-50 p-4">
                                        <div class="flex">
                                            <div class="ml-3">
                                                <h3 class="text-sm font-medium text-blue-800 flex items-center gap-x-1">
                                                    <PhInfo class="h-5 w-5 text-blue-400" />
                                                    <span>Yay!</span>
                                                </h3>
                                                <div class="mt-2 text-sm text-blue-700">
                                                    <p>
                                                        Your authentication token is ready! You can now use this token
                                                        in your client application to authenticate API requests. Make
                                                        sure to copy it now as it won't be displayed again.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mt-4">
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-100">Your new token</label>
                                        <div class="mt-1 flex rounded-md shadow-sm">
                                            <div class="relative flex flex-grow items-stretch focus-within:z-10">
                                                <input type="password" :value="createdToken" readonly
                                                    class="block w-full rounded-none rounded-l-md border-0 px-3 py-2 text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                                            </div>
                                            <button type="button" @click="copyToken"
                                                class="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                                <PhCopy class="-ml-0.5 h-5 w-5 text-gray-400" />
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button v-if="!createdToken" type="button" @click.prevent="createToken"
                            class="inline-flex w-full justify-center rounded-md bg-primary-600 dark:bg-primary-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:col-start-2">
                            <span v-if="isLoading" class="inline-flex items-center">
                                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                        stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                    </path>
                                </svg>
                                Creating...
                            </span>
                            <span v-else>Create Token</span>
                        </button>

                        <button type="button" @click="closeModal"
                            class="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:col-start-1 sm:mt-0"
                            :disabled="isLoading">
                            {{ createdToken ? 'Close' : 'Cancel' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { PhKey, PhCopy, PhInfo } from '@phosphor-icons/vue'
import { useProjects } from '~/composables/useProjects'
import { useToast } from '~/composables/useToast'
import { useValidation } from '~/composables/useValidation'

const props = defineProps({
    show: {
        type: Boolean,
        required: true
    },
    projectId: {
        type: String,
        required: true
    }
})

const emit = defineEmits(['close', 'token-created'])
const { generateAuthToken } = useProjects()
const { success } = useToast()
const { validate, rules, errors, clearErrors } = useValidation()

const tokenName = ref('')
const createdToken = ref('')
const isLoading = ref(false)
const showError = ref(false)

function closeModal() {
    emit('close')
    // Reset the form
    tokenName.value = ''
    createdToken.value = ''
    showError.value = false
    clearErrors()
}

async function createToken() {
    clearErrors()

    const isValid = validate(
        { tokenName: tokenName.value },
        { tokenName: [rules.required('Please enter a token name')] }
    )

    if (!isValid || errors.value.tokenName) {
        showError.value = true
        return
    }

    isLoading.value = true
    try {
        const response = await generateAuthToken(props.projectId, { name: tokenName.value })

        if (response) {
            createdToken.value = response.token
            emit('token-created')
            success('Token created successfully')
        }
    } catch (error) {
    } finally {
        isLoading.value = false
    }
}

function copyToken() {
    navigator.clipboard.writeText(createdToken.value)
    success('Token copied to clipboard')
}
</script>