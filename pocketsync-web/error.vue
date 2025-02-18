<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8 text-center">
            <div>
                <h1 class="text-9xl font-bold text-primary-600">{{ error.statusCode }}</h1>
                <h2 class="mt-6 text-3xl font-bold text-gray-900">{{ error.statusCode === 404 ? 'Page Not Found' : 'An error occurred' }}</h2>
                <p class="mt-2 text-sm text-gray-600">
                    {{ error.message || (error.statusCode === 404 ? 'Oops! The page you\'re looking for doesn\'t exist or has been moved.' : 'Something went wrong. Please try again later.') }}
                </p>
            </div>
            <div class="mt-8 space-y-4">
                <button @click="handleError"
                    class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    {{ error.statusCode === 404 ? 'Go Back' : 'Try Again' }}
                </button>
                <NuxtLink to="/"
                    class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    Return Home
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps({
    error: {
        type: Object,
        required: true
    }
})

useHead({
    title: `${props.error.statusCode === 404 ? 'Page Not Found' : 'Error'} - PocketSync`
})

function handleError() {
    clearError()
    navigateTo('/')
}
</script>