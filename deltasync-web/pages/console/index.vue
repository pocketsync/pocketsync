<template>
    <div class="py-6">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
            <h1 class="text-2xl font-semibold text-gray-900">Getting Started with DeltaSync</h1>
        </div>
        <div class="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
            <div class="py-4">
                <div class="prose max-w-none">
                    <p class="text-lg text-gray-500">
                        Follow these steps to integrate DeltaSync into your mobile application. DeltaSync provides a
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
                                    class="mt-4 inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                                    Create new project
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- SDK Installation Section -->
                    <div class="mt-8">
                        <h2 class="text-lg font-medium text-gray-900">2. Install the SDK</h2>
                        <div class="mt-4 space-y-4">
                            <!-- iOS Installation -->
                            <div class="rounded-lg bg-white shadow">
                                <div class="p-6">
                                    <h3 class="text-sm font-medium text-gray-900">iOS Installation</h3>
                                    <div class="mt-4">
                                        <div class="relative">
                                            <pre class="language-swift rounded-lg bg-gray-800 p-4"><code class="text-sm text-white">// Add to your Podfile
pod 'DeltaSync'

// Then run
pod install</code></pre>
                                            <button @click="copyCode('ios')"
                                                class="absolute right-2 top-2 rounded-md bg-white/10 p-2 text-white hover:bg-white/20">
                                                <svg class="h-5 w-5" fill="none" stroke="currentColor"
                                                    viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Android Installation -->
                            <div class="rounded-lg bg-white shadow">
                                <div class="p-6">
                                    <h3 class="text-sm font-medium text-gray-900">Android Installation</h3>
                                    <div class="mt-4">
                                        <div class="relative">
                                            <pre class="language-groovy rounded-lg bg-gray-800 p-4"><code class="text-sm text-white">// Add to your app's build.gradle
dependencies {
    implementation 'com.deltasync:android-sdk:1.0.0'
}</code></pre>
                                            <button @click="copyCode('android')"
                                                class="absolute right-2 top-2 rounded-md bg-white/10 p-2 text-white hover:bg-white/20">
                                                <svg class="h-5 w-5" fill="none" stroke="currentColor"
                                                    viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- SDK Integration Section -->
                    <div class="mt-8">
                        <h2 class="text-lg font-medium text-gray-900">3. Initialize the SDK</h2>
                        <div class="mt-4 space-y-4">
                            <!-- iOS Integration -->
                            <div class="rounded-lg bg-white shadow">
                                <div class="p-6">
                                    <h3 class="text-sm font-medium text-gray-900">iOS Integration</h3>
                                    <div class="mt-4">
                                        <div class="relative">
                                            <pre class="language-swift rounded-lg bg-gray-800 p-4"><code class="text-sm text-white">import DeltaSync

class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication,
                    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        DeltaSync.initialize(apiKey: "YOUR_API_KEY")
        return true
    }
}</code></pre>
                                            <button @click="copyCode('ios-init')"
                                                class="absolute right-2 top-2 rounded-md bg-white/10 p-2 text-white hover:bg-white/20">
                                                <svg class="h-5 w-5" fill="none" stroke="currentColor"
                                                    viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Android Integration -->
                            <div class="rounded-lg bg-white shadow">
                                <div class="p-6">
                                    <h3 class="text-sm font-medium text-gray-900">Android Integration</h3>
                                    <div class="mt-4">
                                        <div class="relative">
                                            <pre class="language-kotlin rounded-lg bg-gray-800 p-4"><code class="text-sm text-white">import com.deltasync.DeltaSync

class MainApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        DeltaSync.initialize(this, "YOUR_API_KEY")
    }
}</code></pre>
                                            <button @click="copyCode('android-init')"
                                                class="absolute right-2 top-2 rounded-md bg-white/10 p-2 text-white hover:bg-white/20">
                                                <svg class="h-5 w-5" fill="none" stroke="currentColor"
                                                    viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
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
                                        Now that you've set up DeltaSync, you can:
                                    </p>
                                    <ul class="list-disc pl-5 text-sm text-gray-500">
                                        <li>Configure your sync settings in the project dashboard</li>
                                        <li>Set up your data models and sync rules</li>
                                        <li>Test the sync functionality in development mode</li>
                                        <li>Monitor sync activity in real-time</li>
                                    </ul>
                                    <div class="mt-4">
                                        <NuxtLink to="/console/docs"
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
</template>

<script setup>
definePageMeta({
    layout: 'dashboard'
})

const createProject = () => {
    // TODO: Implement project creation logic
    console.log('Create project clicked')
}

const copyCode = (section) => {
    const codeElements = {
        'ios': '// Add to your Podfile\npod \'DeltaSync\'\n\n// Then run\npod install',
        'android': '// Add to your app\'s build.gradle\ndependencies {\n    implementation \'com.deltasync:android-sdk:1.0.0\'\n}',
        'ios-init': 'import DeltaSync\n\nclass AppDelegate: UIResponder, UIApplicationDelegate {\n    func application(_ application: UIApplication,\n                    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {\n        DeltaSync.initialize(apiKey: "YOUR_API_KEY")\n        return true\n    }\n}',
        'android-init': 'import com.deltasync.DeltaSync\n\nclass MainApplication : Application() {\n    override fun onCreate() {\n        super.onCreate()\n        DeltaSync.initialize(this, "YOUR_API_KEY")\n    }\n}'
    }

    navigator.clipboard.writeText(codeElements[section])
}
</script>