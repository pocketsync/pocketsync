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
                            <component :is="KeyIcon" class="h-6 w-6 text-primary-600" />
                        </div>
                        <div class="mt-3 text-center sm:mt-5">
                            <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">Create
                                Authentication
                                Token</h3>
                            <div class="mt-2">
                                <p class="text-sm text-gray-500">
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
                                        class="block text-sm font-medium leading-6 text-gray-900">Token
                                        Name</label>
                                    <div class="mt-2">
                                        <input type="text" id="token-name" v-model="tokenName"
                                            class="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                            placeholder="e.g., Production API Token" />
                                    </div>
                                    <p class="mt-2 text-sm text-gray-500">A descriptive name to help you identify this
                                        token
                                        later.
                                    </p>
                                </div>

                                <div v-if="createdToken">
                                    <div class="rounded-md bg-yellow-50 p-4">
                                        <div class="flex">
                                            <div class="flex-shrink-0">
                                                <component :is="WarningIcon" class="h-5 w-5 text-yellow-400" />
                                            </div>
                                            <div class="ml-3">
                                                <h3 class="text-sm font-medium text-yellow-800">Important</h3>
                                                <div class="mt-2 text-sm text-yellow-700">
                                                    <p>
                                                        Make sure to copy your token now. You won't be able to see it
                                                        again!
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mt-4">
                                        <label class="block text-sm font-medium text-gray-700">Your New Token</label>
                                        <div class="mt-1 flex rounded-md shadow-sm">
                                            <div class="relative flex flex-grow items-stretch focus-within:z-10">
                                                <input type="text" :value="createdToken" readonly
                                                    class="block w-full rounded-none rounded-l-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6" />
                                            </div>
                                            <button type="button" @click="copyToken"
                                                class="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                                <component :is="CopyIcon" class="-ml-0.5 h-5 w-5 text-gray-400" />
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button v-if="!createdToken" type="button" @click="createToken"
                            class="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:col-start-2"
                            :disabled="!tokenName">
                            Create Token
                        </button>
                        <button type="button" @click="closeModal"
                            class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0">
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
import { PhKey, PhCopy, PhWarning } from '@phosphor-icons/vue'

const KeyIcon = PhKey
const CopyIcon = PhCopy
const WarningIcon = PhWarning

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

const tokenName = ref('')
const createdToken = ref('')

function closeModal() {
    if (createdToken.value) {
        emit('token-created')
    }
    emit('close')
    // Reset the form
    tokenName.value = ''
    createdToken.value = ''
}

async function createToken() {
    try {
        // Here you would make an API call to create the token
        // For now, we'll simulate it
        createdToken.value = `auth_tok_${Math.random().toString(36).substring(2)}${Date.now()}`
    } catch (error) {
        console.error('Failed to create token:', error)
    }
}

function copyToken() {
    navigator.clipboard.writeText(createdToken.value)
    // You might want to add a toast notification here
}
</script>