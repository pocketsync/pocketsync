<template>
    <div>
        <!-- Auth Tokens Section -->
        <div class="mt-8">
            <div class="sm:flex sm:items-center">
                <div class="sm:flex-auto">
                    <h2 class="text-base font-semibold leading-6 text-gray-900">Authentication Tokens</h2>
                    <p class="mt-2 text-sm text-gray-700">Manage authentication tokens for your application.</p>
                </div>
                <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button @click="$emit('create-token')"
                        class="block rounded-md bg-primary-600 px-3 py-2 space-x-2 flex flex-inline text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-500">
                        <PhPlus :size="20" />
                        <span>Create auth token</span>
                    </button>
                </div>
            </div>

            <div class="mt-8 flow-root">
                <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div class="overflow-hidden border border-gray-200 rounded-lg">
                            <div class="px-4 sm:px-6 lg:px-8 py-4">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th scope="col"
                                                class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                                Token</th>
                                            <th scope="col"
                                                class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Created At</th>
                                            <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                                <span class="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200">
                                        <tr v-for="token in authTokens" :key="token.id">
                                            <td class="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-0">
                                                <div class="flex items-center">
                                                    <div class="flex-shrink-0">
                                                        <component :is="KeyIcon" class="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <div class="ml-4 flex items-center space-x-2">
                                                        <code
                                                            class="text-sm text-gray-600">{{ maskToken(token.token) }}</code>
                                                        <button @click="copyToken(token.token)"
                                                            class="text-primary-600 hover:text-primary-500 cursor-pointer">
                                                            <component :is="CopyIcon" class="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {{ formatDate(token.createdAt) }}
                                            </td>
                                            <td
                                                class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <button @click="revokeToken(token.id)"
                                                    class="text-red-600 hover:text-red-900 cursor-pointer">Revoke</button>
                                            </td>
                                        </tr>

                                        <tr v-if="authTokens.length === 0">
                                            <td colspan="4" class="px-6 py-8 text-center">
                                                <component :is="KeyIcon" class="mx-auto h-12 w-12 text-gray-400" />
                                                <h3 class="mt-2 text-sm font-semibold text-gray-900">No authentication
                                                    tokens</h3>
                                                <p class="mt-1 text-sm text-gray-500">Get started by creating a new
                                                    authentication token.</p>
                                                <div class="mt-6">
                                                    <button @click="$emit('create-token')"
                                                        class="inline-flex items-center rounded-md bg-primary-600 space-x-2 flex flex-inline px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500">
                                                        <PhPlus :size="20" />
                                                        Create auth token
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Token Modal -->
        <CreateTokenModal v-if="showCreateTokenModal" @close="showCreateTokenModal = false" />

        <!-- Confirmation Dialog -->
        <ConfirmationDialog v-if="showConfirmDialog" show title="Revoke Authentication Token"
            message="Are you sure you want to revoke this authentication token? This action cannot be undone. Note if you are using this token in your application, this will break sync for all users."
            confirm-text="Revoke Token" cancel-text="Cancel" @confirm="handleConfirmRevoke"
            @cancel="handleCancelRevoke" />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PhKey, PhCopy, PhPlus } from '@phosphor-icons/vue'
import CreateTokenModal from './create-token-modal.vue'
import ConfirmationDialog from '../common/confirmation-dialog.vue'
import { AuthTokenResponseDto } from '~/api-client'

const KeyIcon = PhKey
const CopyIcon = PhCopy
const showCreateTokenModal = ref(false)
const showConfirmDialog = ref(false)
const tokenToRevoke = ref<string | null>(null)

const emit = defineEmits<{
    'create-token': []
}>()

const props = defineProps<{
    authTokens: AuthTokenResponseDto[]
}>()

const { success } = useToast()

function maskToken(token) {
    return `${token.slice(0, 4)}...${token.slice(-4)}`
}

function copyToken(token) {
    navigator.clipboard.writeText(token)
    success('Token copied to clipboard')
}

function revokeToken(id: string) {
    tokenToRevoke.value = id
    showConfirmDialog.value = true
}

function handleConfirmRevoke() {
    if (tokenToRevoke.value) {
        // Implement token revocation
        success('Token revoked successfully')
        tokenToRevoke.value = null
    }
    showConfirmDialog.value = false
}

function handleCancelRevoke() {
    tokenToRevoke.value = null
    showConfirmDialog.value = false
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}
</script>