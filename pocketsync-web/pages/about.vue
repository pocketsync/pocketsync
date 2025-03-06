<template>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">About PocketSync</h1>
        
        <div class="space-y-8 prose prose-blue max-w-none">
            <!-- Mission Section -->
            <section>
                <h2 class="text-2xl font-semibold text-gray-900">Our Mission</h2>
                <p class="mt-4 text-gray-600">
                    At PocketSync, we're on a mission to revolutionize how applications handle data synchronization. We believe that developers should focus on building great features while leaving the complexities of data sync to a reliable, efficient system. We're especially dedicated to empowering developers of local-first applications that don't require backend servers, such as note-taking apps and personal trackers.
                </p>
            </section>

            <!-- Story Section -->
            <section>
                <h2 class="text-2xl font-semibold text-gray-900">Our Story</h2>
                <p class="mt-4 text-gray-600">
                    Born from the challenges faced by developers in building offline-first applications, PocketSync was created to provide a simple yet powerful solution for data synchronization. Our team of experienced developers and engineers has worked tirelessly to build a platform that makes implementing offline-first capabilities straightforward and reliable. We recognized that many personal and productivity applications need robust synchronization without the complexity of managing backend infrastructure.
                </p>
            </section>
        </div>
    </div>
</template>

<script setup>
definePageMeta({
    layout: 'default'
})
</script>
