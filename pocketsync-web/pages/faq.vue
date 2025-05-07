<template>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Frequently Asked Questions</h1>

        <div class="space-y-8">
            <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">General</h2>
                <div class="space-y-6">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">What is PocketSync?</h3>
                        <p class="mt-2 text-gray-600">PocketSync is a powerful data synchronization solution that
                            enables developers to build offline-first applications with automatic data synchronization
                            capabilities. It handles the complexity of data sync, allowing you to focus on building
                            great features.</p>
                    </div>
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">How does PocketSync work?</h3>
                        <p class="mt-2 text-gray-600">PocketSync uses a sophisticated conflict resolution system to
                            ensure data consistency across devices. It maintains a local database on each device and
                            automatically syncs changes when connectivity is available, providing seamless offline
                            functionality.</p>
                    </div>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Use Cases</h2>
                <div class="space-y-6">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">What types of applications work best with
                            PocketSync?</h3>
                        <p class="mt-2 text-gray-600">PocketSync is ideal for local applications that don't require a
                            backend server, such as:</p>
                        <ul class="list-disc pl-5 mt-2 space-y-1">
                            <li>Note-taking applications</li>
                            <li>Personal trackers (habits, goals, tasks)</li>
                            <li>Any app where data depends solely on the user</li>
                        </ul>
                        <p class="mt-2 text-gray-600"> These types of applications, where data synchronization is
                            primarily user-centric and doesn't
                            depend on backend services, benefit the most from PocketSync's offline-first capabilities.
                        </p>
                    </div>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Technical</h2>
                <div class="space-y-6">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Which platforms does PocketSync support?</h3>
                        <p class="mt-2 text-gray-600 dark:text-gray-300">PocketSync only supports Flutter (Android & IOS) at the moment.
                        </p>
                    </div>
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">How does PocketSync handle data conflicts?</h3>
                        <p class="mt-2 text-gray-600">PocketSync uses a last-write-wins strategy by default, but also
                            provides customizable conflict resolution strategies. You can implement your own conflict
                            resolution logic based on your application's needs.</p>
                    </div>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pricing & Plans</h2>
                <div class="space-y-6">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Is there a free plan available?</h3>
                        <p class="mt-2 text-gray-600 dark:text-gray-300">Yes, we offer a generous free tier that includes basic
                            synchronization features and supports up to 1,000 users. This is perfect for small projects
                            and testing.</p>
                    </div>
                    <div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Can I upgrade or downgrade my plan at any time?
                        </h3>
                        <p class="mt-2 text-gray-600 dark:text-gray-300">Yes, you can change your plan at any time. Changes will be
                            prorated and reflected in your next billing cycle.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
definePageMeta({
    layout: 'default'
})
</script>
