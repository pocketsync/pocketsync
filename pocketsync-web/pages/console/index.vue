<template>
    <div class="py-6">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
            <EmailVerificationBanner />
            
            <AlphaStageWarningCard class="mb-8" />
            <h1 class="text-xl font-semibold text-gray-900">Getting Started with PocketSync</h1>
        </div>
        <div class="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
            <div class="py-4">
                <div class="prose max-w-none">
                    <p class="text-md text-gray-500">
                        Follow these steps to integrate PocketSync into your mobile application. PocketSync provides a
                        simple
                        yet powerful way to sync data between your app and your backend.
                    </p>

                    <!-- Project Setup Section -->
                    <div class="mt-8">
                        <h2 class="text-lg font-medium text-gray-900">1. Create a Project</h2>
                        <div class="mt-4 rounded-lg bg-white shadow">
                            <div class="p-6">
                                <p class="text-sm text-gray-500">
                                    First, create a new project to get your API keys and configure your sync settings.
                                </p>
                                <button @click="createProject"
                                    class="mt-4 inline-flex items-center rounded-md flex flex-inline space-x-3 border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                                    <PhPlus :size="20" />
                                    <span>Create new project</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- SDK Installation Section -->
                    <div class="mt-8">
                        <h2 class="text-lg font-medium text-gray-900">2. Install the SDK</h2>

                        <!-- Flutter Installation -->
                        <div class="rounded-lg bg-white shadow">
                            <div class="p-6">
                                <h3 class="text-sm font-medium text-gray-900">Flutter Installation</h3>
                                <div class="mt-4">
                                    <div class="relative">
                                        <pre class="language-yaml rounded-lg bg-gray-800 p-4"><code class="text-sm text-white">dependencies:
  pocketsync_flutter: ^1.0.0</code></pre>
                                        <button @click="copyCode('flutter')"
                                            class="absolute right-2 top-2 rounded-md bg-white/10 p-2 text-white hover:bg-white/20">
                                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- SDK Integration Section -->
                    <div class="mt-8">
                        <h2 class="text-lg font-medium text-gray-900">3. Initialize the SDK</h2>

                        <!-- Flutter Integration -->
                        <div class="rounded-lg bg-white shadow">
                            <div class="p-6">
                                <h3 class="text-sm font-medium text-gray-900">Flutter Integration</h3>
                                <div class="mt-4">
                                    <div class="relative">
                                        <pre class="language-dart rounded-lg bg-gray-800 p-4"><code class="text-sm text-white">final pocketSync = await PocketSync.initialize(
  dbPath: path,
  options: PocketSyncOptions(
    projectId: 'your-project-id',
    authToken: 'your-auth-token',
    serverUrl: 'https://api.pocketsync.dev',
  ),
  databaseOptions: DatabaseOptions(
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
await PocketSync.instance.startSync();
</code></pre>
                                        <button @click="copyCode('flutter-init')"
                                            class="absolute right-2 top-2 rounded-md bg-white/10 p-2 text-white hover:bg-white/20">
                                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Next Steps Section -->
                        <div class="mt-8">
                            <h2 class="text-lg font-medium text-gray-900">4. Next Steps</h2>
                            <div class="mt-4 rounded-lg bg-white shadow">
                                <div class="p-6">
                                    <div class="space-y-4">
                                        <p class="text-sm text-gray-500">
                                            Now that you've set up PocketSync, you can:
                                        </p>
                                        <ul class="list-disc pl-5 text-sm text-gray-500">
                                            <li>Configure your sync settings in the project dashboard</li>
                                            <li>Set up your data models and sync rules</li>
                                            <li>Test the sync functionality in development mode</li>
                                            <li>Monitor sync activity in real-time</li>
                                        </ul>
                                        <div class="mt-4">
                                            <NuxtLink to="/docs"
                                                class="text-sm font-medium text-primary-600 hover:text-primary-500">
                                                View Documentation →
                                            </NuxtLink>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { PhPlus } from '@phosphor-icons/vue'
import AlphaStageWarningCard from '~/components/layout/dashboard/alpha-stage-warning-card.vue'
import EmailVerificationBanner from '~/components/layout/dashboard/email-verification-banner.vue'

definePageMeta({
    layout: 'dashboard'
})

useHead({
    title: 'Dashboard - PocketSync'
})

const createProject = () => {
    const router = useRouter()
    router.push('/console/projects')
}

const copyCode = (section) => {
    const codeElements = {
        'flutter': 'dependencies:\n  pocketsync_flutter: ^1.0.0',
        'flutter-init': 'final pocketSync = await PocketSync.initialize(\n  options: PocketSyncOptions(\n    serverUrl: \'https://api.pocketsync.dev\',\n    projectId: \'your-project-id\',\n    authToken: \'your-auth-token\',\n  ),\n);\n\n// Regular SQLite operations are automatically tracked\nawait database.insert(\'users\', {\n  \'name\': \'John Doe\',\n  \'email\': \'john@example.com\'\n});\n\n// Changes are automatically synchronized when online\n// No additional code needed for sync'
    }

    navigator.clipboard.writeText(codeElements[section])
}
</script>