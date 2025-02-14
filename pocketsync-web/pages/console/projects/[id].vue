<template>
    <div>
        <div class="px-4 sm:px-6 lg:px-8">
            <!-- Error Alert -->
            <ErrorAlert v-if="error" :error="error" title="Error loading project" />

            <!-- Loading State -->
            <div v-if="isLoading" class="animate-pulse">
                <div class="md:flex md:items-center md:justify-between">
                    <div class="min-w-0 flex-1">
                        <div class="h-8 w-1/3 bg-gray-200 rounded"></div>
                    </div>
                </div>

                <!-- Stats Grid Loading State -->
                <div class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div v-for="i in 3" :key="i" class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                        <div class="h-4 w-1/3 bg-gray-200 rounded"></div>
                        <div class="mt-1 h-8 w-1/2 bg-gray-200 rounded"></div>
                        <div class="mt-2 flex items-center">
                            <div class="h-5 w-5 bg-gray-200 rounded mr-1.5"></div>
                            <div class="h-4 w-1/4 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content when loaded -->
            <div v-else>
                <div class="md:flex md:items-center md:justify-between">
                    <div class="min-w-0 flex-1">
                        <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">{{ project.name }}</h2>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                        <dt class="truncate text-sm font-medium text-gray-500">Total Users</dt>
                        <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{{ stats.totalUsers }}</dd>
                        <dd class="mt-2 flex items-center text-sm text-gray-600">
                            <component :is="UsersIcon" class="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                            <span>{{ stats.activeUsers }} active today</span>
                        </dd>
                    </div>

                    <div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                        <dt class="truncate text-sm font-medium text-gray-500">Connected Devices</dt>
                        <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{{ stats.totalDevices }}</dd>
                        <dd class="mt-2 flex items-center text-sm text-gray-600">
                            <component :is="DevicesIcon" class="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                            <span>{{ stats.activeDevices }} online now</span>
                        </dd>
                    </div>

                    <div class="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                        <dt class="truncate text-sm font-medium text-gray-500">Changes Today</dt>
                        <dd class="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{{ stats.changesCount }}</dd>
                        <dd class="mt-2 flex items-center text-sm text-gray-600">
                            <component :is="SyncIcon" class="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                            <span>{{ stats.pendingChanges }} pending sync</span>
                        </dd>
                    </div>
                </div>

                <!-- Tabs -->
                <div class="mt-8">
                    <div class="sm:hidden">
                        <label for="tabs" class="sr-only">Select a tab</label>
                        <select id="tabs" v-model="currentTab"
                            class="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500">
                            <option v-for="tab in tabs" :key="tab.name" :value="tab.value">{{ tab.name }}</option>
                        </select>
                    </div>
                    <div class="hidden sm:block">
                        <div class="border-b border-gray-200">
                            <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                                <button v-for="tab in tabs" :key="tab.name" @click="currentTab = tab.value" :class="[
                            currentTab === tab.value
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                            'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
                        ]">
                                    {{ tab.name }}
                                    <span v-if="tab.count !== undefined" :class="[
                            currentTab === tab.value ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-900',
                            'ml-3 hidden rounded-full py-0.5 px-2.5 text-xs font-medium md:inline-block'
                        ]">{{ tab.count }}</span>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>

                <!-- Tab Panels -->
                <div class="mt-8">
                    <OverviewTab v-if="currentTab === 'overview'" :project="project" :recent-changes="recentChanges" />
                    <UsersTab v-if="currentTab === 'users'" :users="users" />
                    <div v-if="currentTab === 'tokens'">
                        <AuthTokensTab :auth-tokens="authTokens" @create-token="showCreateTokenModal = true" />
                    </div>
                    <SettingsTab v-if="currentTab === 'settings'" :project="project" />
                </div>
            </div>
        </div>

        <!-- Modals -->
        <CreateTokenModal :show="showCreateTokenModal" :project-id="project.id" @close="showCreateTokenModal = false"
            @token-created="handleTokenCreated" />

    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import OverviewTab from '~/components/projects/overview-tab.vue'
import UsersTab from '~/components/projects/users-tab.vue'
import AuthTokensTab from '~/components/projects/auth-tokens-tab.vue'
import SettingsTab from '~/components/projects/settings-tab.vue'
import CreateTokenModal from '~/components/projects/create-token-modal.vue'
import { PhKey, PhCopy, PhUsers, PhDeviceMobile, PhArrowsClockwise } from '@phosphor-icons/vue'
import ErrorAlert from '~/components/common/error-alert.vue'

definePageMeta({
    layout: 'dashboard'
})

const UsersIcon = PhUsers
const DevicesIcon = PhDeviceMobile
const SyncIcon = PhArrowsClockwise

const showCreateTokenModal = ref(false)

const route = useRoute()
const { fetchProjectById, currentProject, isLoading, error } = useProjects()

// Fetch project data when component mounts
onMounted(async () => {
    try {
        await fetchProjectById(route.params.id as string)
    } catch (err) {
        // Error handling is managed by the composable
        console.error('Failed to fetch project:', err)
    }
})

// Use the currentProject from the composable
const project = computed(() => currentProject.value || { id: '', name: '' })

// Define authTokens as a computed property that derives from project data
const authTokens = computed(() => currentProject.value?.authTokens || [])


const stats = ref({
    totalUsers: 1234,
    activeUsers: 856,
    totalDevices: 2891,
    activeDevices: 1567,
    changesCount: 45892,
    pendingChanges: 123
})

const recentChanges = ref([
    {
        id: 1,
        device_id: 'iphone13-xyz',
        user_identifier: 'user123',
        received_at: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        processed_at: new Date(Date.now() - 1000 * 60 * 4) // 4 minutes ago
    },
    {
        id: 2,
        device_id: 'pixel6-abc',
        user_identifier: 'user456',
        received_at: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        processed_at: null
    }
])

const users = ref([
    {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar_url: null,
        devices_count: 3,
        last_active_at: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
    },
    {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        avatar_url: null,
        devices_count: 2,
        last_active_at: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
    }
])

const currentTab = ref('overview')
const tabs = [
    { name: 'Overview', value: 'overview' },
    { name: 'Users', value: 'users', count: users.value.length },
    { name: 'Auth Tokens', value: 'tokens', count: authTokens.value.length },
    { name: 'Settings', value: 'settings' }
]

function formatDate(date) {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
        Math.round((date - new Date()) / (1000 * 60)),
        'minute'
    )
}

function maskToken(token) {
    return `${token.slice(0, 8)}...${token.slice(-4)}`
}

function copyToken(token) {
    navigator.clipboard.writeText(token)
    // You might want to add a toast notification here
}

function getUserInitials(user) {
    return `${user.first_name[0]}${user.last_name[0]}`
}

function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
}

function revokeToken(tokenId) {
    // Implement token revocation logic
    console.log('Revoking token:', tokenId)
}

function handleTokenCreated() {
    // Here you would refresh the tokens list
    // For now, we'll just add a simulated token
    const newToken = {
        id: Date.now().toString(),
        token: `auth_tok_${Math.random().toString(36).substring(2)}${Date.now()}`,
        created_at: new Date(),
        user: {
            first_name: 'Current',
            last_name: 'User',
            avatar_url: null
        }
    }
    authTokens.value.unshift(newToken)
}

function showUserDevices(user) {
    // Here you would implement the logic to show user devices
    // This could be a modal or a new page
    console.log('Show devices for user:', user.id)
}
</script>