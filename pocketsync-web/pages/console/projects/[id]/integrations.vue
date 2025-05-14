<template>
    <PageBreadcrumb page-title="Integrations" :items="[
        { label: 'Projects', path: '/console/projects' },
        { label: 'Integrations', path: `/console/projects/${projectId}/integrations` }
    ]" />

    <div class="w-full px-4 py-4 space-y-6">
        <!-- SDK Integration Credentials -->
        <div class="w-full">
            <div class="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
                <div class="px-6 py-5">
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">SDK Integration</h2>

                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        Use these credentials to integrate PocketSync SDK in your application. Keep these values secure
                        and never expose them in client-side code.
                    </p>

                    <div class="grid md:grid-cols-3 gap-6">
                        <!-- Server URL -->
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Server URL</label>
                            <div class="mt-1 flex rounded-md shadow-sm">
                                <input type="text" readonly value="https://api.pocketsync.dev"
                                    class="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white focus:outline-none" />
                                <button type="button" @click="copyToClipboard('https://api.pocketsync.dev')"
                                    class="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md bg-gray-50 dark:bg-slate-600 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-500 transition-colors duration-150">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Project ID -->
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Project ID</label>
                            <div class="mt-1 flex rounded-md shadow-sm">
                                <input type="text" readonly :value="projectId"
                                    class="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white focus:outline-none" />
                                <button type="button" @click="copyToClipboard(projectId)"
                                    class="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md bg-gray-50 dark:bg-slate-600 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-500 transition-colors duration-150">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Auth Token -->
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Authentication
                                Token</label>
                            <div class="mt-1 flex">
                                <div v-if="authTokens.length > 0" class="flex rounded-md shadow-sm">
                                    <input type="text" readonly :value="'••••••••' + authTokens[0].token.slice(-4)"
                                        class="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white focus:outline-none" />
                                    <button type="button" @click="copyToClipboard(authTokens[0].token)"
                                        class="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md bg-gray-50 dark:bg-slate-600 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-500 transition-colors duration-150">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                </div>
                                <button v-else @click="showCreateTokenModal = true"
                                    class="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-slate-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors duration-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create token
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="mt-6 bg-gray-50 dark:bg-slate-700/30 p-4 rounded-md">

                        <!-- SDK Code Tabs -->
                        <div class="code-tabs">
                            <div class="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                                <button v-for="(tab, index) in codeTabs" :key="index" @click="activeCodeTab = index"
                                    :class="[
                                        'px-4 py-2 text-sm font-medium border-b-2 focus:outline-none transition-colors duration-200',
                                        activeCodeTab === index
                                            ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    ]">
                                    <div class="flex items-center gap-2">
                                        <span v-html="tab.icon"></span>
                                        <span>{{ tab.label }}</span>
                                    </div>
                                </button>
                            </div>

                            <div v-for="(tab, index) in codeTabs" :key="index" v-show="activeCodeTab === index">
                                <div class="bg-gray-800 rounded-md overflow-hidden">
                                    <pre class="p-4 overflow-x-auto text-xs text-gray-200">
                                        <code>{{ tab.code }}</code>
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Auth Tokens Section -->
        <div class="w-full">
            <div class="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
                <div class="px-6 py-5">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Authentication Tokens</h2>
                        <button @click="showCreateTokenModal = true"
                            class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 4v16m8-8H4" />
                            </svg>
                            Create token
                        </button>
                    </div>

                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        Authentication tokens are used to authenticate your applications with the PocketSync API when
                        syncing changes.
                        Keep your tokens secure and never share them in public repositories or client-side code.
                    </p>

                    <div v-if="isLoading" class="flex justify-center py-8">
                        <svg class="animate-spin h-8 w-8 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                            </circle>
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                            </path>
                        </svg>
                    </div>

                    <div v-else-if="authTokens.length === 0"
                        class="flex flex-col items-center justify-center py-8 px-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 dark:text-gray-600 mb-4"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <p class="text-sm text-gray-700 dark:text-gray-300 mb-4">No authentication tokens found</p>
                        <button @click="showCreateTokenModal = true"
                            class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors duration-200">
                            Create your first token
                        </button>
                    </div>

                    <div v-else class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead>
                                <tr>
                                    <th scope="col"
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Name</th>
                                    <th scope="col"
                                        class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Created</th>
                                    <th scope="col"
                                        class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                                <tr v-for="token in authTokens" :key="token.id"
                                    class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
                                    <td
                                        class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {{ token.name }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{
                                        formatDate(token.createdAt) }}</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <button @click="openRevokeTokenModal(token)"
                                            class="inline-flex items-center justify-center rounded-md bg-red-100 dark:bg-red-900/20 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200">
                                            Revoke
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modals -->
    <CreateTokenModal :is-open="showCreateTokenModal" :is-creating="isCreatingToken"
        @close="showCreateTokenModal = false" @create="handleCreateToken" />

    <TokenCreatedModal :is-open="showTokenCreatedModal" :token="createdToken" @close="showTokenCreatedModal = false" />

    <RevokeTokenModal :is-open="showRevokeTokenModal" :token="tokenToRevoke" :is-revoking="isRevokingToken"
        @close="showRevokeTokenModal = false" @revoke="handleRevokeToken" />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import PageBreadcrumb from '~/components/common/page-breadcrumb.vue';
import { useRoute } from 'vue-router';
import { onMounted, ref, computed } from 'vue';
import { useProjectsStore } from '~/stores/projectsStore';
import { useProjects } from '~/composables/useProjects';
import { useToast } from '~/composables/useToast';
import { useUtils } from '~/composables/useUtils';
import { useClipboard } from '~/composables/useClipboard';
// No syntax highlighting imports needed
import type { AuthTokenResponseDto, CreateAuthTokenDto } from '~/api-client';

// Import modal components
import CreateTokenModal from '~/components/auth-tokens/create-token-modal.vue';
import TokenCreatedModal from '~/components/auth-tokens/token-created-modal.vue';
import RevokeTokenModal from '~/components/auth-tokens/revoke-token-modal.vue';

definePageMeta({
    layout: 'dashboard',
    middleware: 'auth'
})

const route = useRoute()
const projectId = computed(() => {
    return (route.params.id as string) || 'default';
})

const { formatDate } = useUtils()
const { copy, copied } = useClipboard()

// Code examples tabs
const activeCodeTab = ref(0)

// Generate code examples with the correct project ID
const getCodeExamples = computed(() => [
    {
        label: 'Flutter',
        language: 'dart',
        icon: `
        <svg height="16" viewBox=".29 .22 77.26 95.75" width="24" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><path d="m48.75 95.97-25.91-25.74 14.32-14.57 40.39 40.31z" fill="#02539a"/><g fill="#45d1fd"><path d="m22.52 70.25 25.68-25.68h28.87l-39.95 39.95z" fill-opacity=".85"/><path d="m.29 47.85 14.58 14.57 62.2-62.2h-29.02z"/></g></g></svg>
        `,
        code: `// Dart/Flutter Example
// Initialize PocketSync
await PocketSync.instance.initialize(
  options: PocketSyncOptions(
    projectId: '${projectId.value}',
    authToken: 'your-auth-token',
    serverUrl: 'https://api.pocketsync.dev',
  ),
  databaseOptions: DatabaseOptions(
    dbPath: 'path',
    onCreate: (db, version) async {
      await db.execute(
        'CREATE TABLE todos(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, isCompleted INTEGER)',
      );
    },
  ),
);

// Set user ID - In a real app, this would come from your auth system
await PocketSync.instance.setUserId(userId: 'your-user-id');

// Start syncing
await PocketSync.instance.start();`
    }
])

const codeTabs = computed(() => getCodeExamples.value)
// No highlighting needed

const projectsStore = useProjectsStore()
const { currentProject } = storeToRefs(projectsStore)
const { generateAuthToken, revokeToken: revokeAuthToken } = useProjects()
const { success, error: errorToast } = useToast()

const authTokens = ref<AuthTokenResponseDto[]>([])
const isLoading = ref(false)
const isCreatingToken = ref(false)
const isRevokingToken = ref(false)
const createdToken = ref<AuthTokenResponseDto | null>(null)
const tokenToRevoke = ref<AuthTokenResponseDto | null>(null)

// Modal visibility states
const showCreateTokenModal = ref(false)
const showTokenCreatedModal = ref(false)
const showRevokeTokenModal = ref(false)

onMounted(async () => {
    if (projectId) {
        await projectsStore.fetchProjectById(projectId.value)
        authTokens.value = currentProject.value?.authTokens || []
    }
})

watch(() => currentProject.value, () => {
    authTokens.value = currentProject.value?.authTokens || []
})

const handleCreateToken = async (tokenData: CreateAuthTokenDto) => {
    isCreatingToken.value = true
    try {
        const result = await generateAuthToken(projectId.value, tokenData)
        if (result) {
            showCreateTokenModal.value = false
            createdToken.value = result
            await projectsStore.fetchProjectById(projectId.value)
            showTokenCreatedModal.value = true
        }
    } finally {
        isCreatingToken.value = false
    }
}

const openRevokeTokenModal = (token: AuthTokenResponseDto) => {
    tokenToRevoke.value = token
    showRevokeTokenModal.value = true
}
const copyToClipboard = async (text: string) => {
    await copy(text)
    success('Copied to clipboard')
}

const handleRevokeToken = async (token: AuthTokenResponseDto) => {
    isRevokingToken.value = true
    try {
        const result = await revokeAuthToken(token.id)
        if (result) {
            showRevokeTokenModal.value = false
            await projectsStore.fetchProjectById(projectId.value)
            success('Token revoked successfully')
        }
    } finally {
        isRevokingToken.value = false
    }
}
</script>
