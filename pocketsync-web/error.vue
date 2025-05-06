<template>
    <div :class="['min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8', isDarkMode ? 'dark bg-slate-900' : 'bg-white']">
        <div class="max-w-md w-full space-y-8 text-center">
            <div>
                <h1 class="text-9xl font-bold text-brand-500 dark:text-brand-400">{{ error.statusCode }}</h1>
                <h2 class="mt-6 text-3xl font-bold text-gray-900 dark:text-white">{{ error.statusCode === 404 ? 'Page not found' : 'An error occurred' }}</h2>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {{ error.message || (error.statusCode === 404 ? 'Oops! The page you\'re looking for doesn\'t exist or has been moved.' : 'Something went wrong. Please try again later.') }}
                </p>
            </div>
            <div class="mt-8 space-y-4">
                <button @click="handleError"
                    class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors duration-200">
                    {{ error.statusCode === 404 ? 'Go back' : 'Try again' }}
                </button>
                <NuxtLink to="/"
                    class="w-full inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-slate-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors duration-200">
                    Return home
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = defineProps({
    error: {
        type: Object,
        required: true
    }
})

useHead({
    title: `${props.error.statusCode === 404 ? 'Page not found' : 'Error'} - PocketSync`
})

// Handle dark mode manually since we're outside the normal layout
const isDarkMode = ref(false)

onMounted(() => {
    // Check localStorage for theme preference
    const savedTheme = localStorage.getItem('theme')
    isDarkMode.value = savedTheme === 'dark'
    
    // Apply dark mode class to html element to ensure proper styling
    if (isDarkMode.value) {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }
})

function handleError() {
    clearError()
    // go back to previous page
    useRouter().back()
}
</script>