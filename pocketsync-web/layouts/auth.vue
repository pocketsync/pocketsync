<template>
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-md">
            <div class="text-center">
                <NuxtLink to="/" class="inline-flex items-center">
                    <span class="text-2xl font-bold text-gray-900">PocketSync</span>
                </NuxtLink>
            </div>
        </div>

        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div class="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-100">
                <slot />
            </div>
            
            <div class="mt-6 text-center text-sm">
                <NuxtLink to="/" class="font-medium text-gray-500 hover:text-primary-500">
                    ← Back to home
                </NuxtLink>
            </div>
        </div>

        <div class="mt-8 text-center text-sm text-gray-500">
            &copy; {{ currentYear }} PocketSync. All rights reserved.
        </div>
    </div>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.bg-gray-50 {
    background-image: linear-gradient(to bottom right, #f8fafc, #f1f5f9);
    background-attachment: fixed;
}
</style>