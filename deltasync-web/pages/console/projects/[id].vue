<template>
    <div>
        <div class="md:flex md:items-center md:justify-between">
            <div class="min-w-0 flex-1">
                <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">{{ project.name }}</h2>
            </div>
            <div class="mt-4 flex md:ml-4 md:mt-0">
                <button @click="showCreateTokenModal = true"
                    class="ml-3 inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
                    Create auth token
                </button>
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
                        <button v-for="tab in tabs" :key="tab.name"
                            @click="currentTab = tab.value"
                            :class="[
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
            <div v-show="currentTab === 'overview'">
                <div class="px-4 sm:px-6 lg:px-8">
                    <div class="sm:flex sm:items-center">
                        <div class="sm:flex-auto">
                            <h3 class="text-base font-semibold leading-6 text-gray-900">Recent Activity</h3>
                        </div>
                    </div>
                    <div class="mt-6 overflow-hidden rounded-xl border border-gray-200">
                        <div class="min-w-full divide-y divide-gray-200">
                            <div class="bg-gray-50 px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Latest Changes
                            </div>

                            <div class="divide-y divide-gray-200 bg-white">
                                <div v-for="log in recentChanges" :key="log.id" class="px-6 py-4">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center space-x-3">
                                            <div class="flex-shrink-0">
                                                <component :is="DevicesIcon" 
                                                    :class="[
                                                        'h-5 w-5',
                                                        log.processed_at ? 'text-green-500' : 'text-gray-400'
                                                    ]" />
                                            </div>
                                            <div>
                                                <p class="text-sm font-medium text-gray-900">
                                                    Device: {{ log.device_id }}
                                                </p>
                                                <p class="text-sm text-gray-500">
                                                    User: {{ log.user_identifier }}
                                                </p>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-sm text-gray-900">
                                                {{ formatDate(log.received_at) }}
                                            </p>
                                            <p class="text-sm text-gray-500">
                                                {{ log.processed_at ? 'Processed' : 'Pending' }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-show="currentTab === 'users'">
                <!-- User List -->
                <div class="mt-8 flow-root">
                    <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                <table class="min-w-full divide-y divide-gray-300">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th scope="col"
                                                class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">User</th>
                                            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                                            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Devices</th>
                                            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Last Active</th>
                                            <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                                <span class="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200 bg-white">
                                        <tr v-for="user in users" :key="user.id">
                                            <td class="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                                                <div class="flex items-center">
                                                    <div class="h-10 w-10 flex-shrink-0">
                                                        <img v-if="user.avatar_url" :src="user.avatar_url" :alt="user.name"
                                                            class="h-10 w-10 rounded-full" />
                                                        <div v-else
                                                            class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                                                            <span class="text-sm font-medium text-primary-600">{{ getInitials(user.name) }}</span>
                                                        </div>
                                                    </div>
                                                    <div class="ml-4">
                                                        <div class="font-medium text-gray-900">{{ user.name }}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ user.email }}</td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <div class="flex items-center gap-1">
                                                    <component :is="DevicesIcon" class="h-4 w-4" />
                                                    {{ user.devices_count }}
                                                </div>
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ formatDate(user.last_active_at) }}</td>
                                            <td
                                                class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <button @click="showUserDevices(user)"
                                                    class="text-primary-600 hover:text-primary-900">View devices</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-show="currentTab === 'tokens'">
                <!-- Auth Tokens Section -->
                <div class="mt-8">
                    <div class="sm:flex sm:items-center">
                        <div class="sm:flex-auto">
                            <h2 class="text-base font-semibold leading-6 text-gray-900">Authentication Tokens</h2>
                            <p class="mt-2 text-sm text-gray-700">Manage authentication tokens for your application.</p>
                        </div>
                    </div>

                    <div class="mt-4 overflow-hidden rounded-xl border border-gray-200">
                        <div class="min-w-full divide-y divide-gray-200">
                            <div class="bg-gray-50 px-6 py-3.5 grid grid-cols-4 gap-4 text-left text-sm font-semibold text-gray-900">
                                <div>Token</div>
                                <div>Created By</div>
                                <div>Created At</div>
                                <div class="text-right">Actions</div>
                            </div>
                            
                            <div class="divide-y divide-gray-200 bg-white">
                                <div v-for="token in authTokens" :key="token.id" class="px-6 py-4 grid grid-cols-4 gap-4">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0">
                                            <component :is="KeyIcon" class="h-5 w-5 text-gray-400" />
                                        </div>
                                        <div class="ml-4 flex items-center space-x-2">
                                            <code class="text-sm text-gray-600">{{ maskToken(token.token) }}</code>
                                            <button @click="copyToken(token.token)" class="text-primary-600 hover:text-primary-500">
                                                <component :is="CopyIcon" class="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div class="flex items-center">
                                        <div class="flex items-center">
                                            <img v-if="token.user.avatar_url" :src="token.user.avatar_url" class="h-6 w-6 rounded-full" :alt="token.user.first_name" />
                                            <div v-else class="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                                                <span class="text-xs font-medium text-primary-600">
                                                    {{ getUserInitials(token.user) }}
                                                </span>
                                            </div>
                                            <span class="ml-2 text-sm text-gray-900">{{ token.user.first_name }} {{ token.user.last_name }}</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center text-sm text-gray-500">
                                        {{ formatDate(token.created_at) }}
                                    </div>
                                    <div class="flex items-center justify-end">
                                        <button @click="revokeToken(token.id)"
                                            class="text-red-600 hover:text-red-500 text-sm font-medium">Revoke</button>
                                    </div>
                                </div>

                                <div v-if="authTokens.length === 0" class="px-6 py-8 text-center">
                                    <component :is="KeyIcon" class="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 class="mt-2 text-sm font-semibold text-gray-900">No authentication tokens</h3>
                                    <p class="mt-1 text-sm text-gray-500">Get started by creating a new authentication token.</p>
                                    <div class="mt-6">
                                        <button @click="showCreateTokenModal = true"
                                            class="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500">
                                            Create Auth Token
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-show="currentTab === 'settings'">
                <div class="px-4 sm:px-6 lg:px-8">
                    <div class="sm:flex sm:items-center">
                        <div class="sm:flex-auto">
                            <h3 class="text-base font-semibold leading-6 text-gray-900">Project Settings</h3>
                        </div>
                    </div>
                    <!-- Add settings content here -->
                </div>
            </div>
        </div>

        <!-- Modals -->
        <CreateTokenModal :show="showCreateTokenModal" :project-id="project.id" @close="showCreateTokenModal = false"
            @token-created="handleTokenCreated" />
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { PhKey, PhCopy, PhUsers, PhDeviceMobile, PhArrowsClockwise } from '@phosphor-icons/vue'
import CreateTokenModal from '~/components/projects/create-token-modal.vue'

definePageMeta({
    layout: 'dashboard'
})

const KeyIcon = PhKey
const CopyIcon = PhCopy
const UsersIcon = PhUsers
const DevicesIcon = PhDeviceMobile
const SyncIcon = PhArrowsClockwise

const showCreateTokenModal = ref(false)

// Sample data - replace with actual API calls
const project = ref({
    id: 'sample-id',
    name: 'Mobile App Sync'
})

const authTokens = ref([
    {
        id: '1',
        token: 'auth_tok_51NcVHvBXXtANDlkjasdf8989',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        user: {
            first_name: 'John',
            last_name: 'Doe',
            avatar_url: null
        }
    },
    {
        id: '2',
        token: 'auth_tok_51NcVHvBXXtANDlkjasdf8990',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        user: {
            first_name: 'Jane',
            last_name: 'Smith',
            avatar_url: null
        }
    }
])

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