<template>
    <nav class="bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800 fixed w-full z-30 top-0">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex">
                    <div class="flex-shrink-0 flex items-center">
                        <NuxtLink to="/" class="flex items-center">
                            <img src="/images/logo/logo_full-light.svg" alt="PocketSync" class="hidden sm:block h-6 dark:hidden" />
                            <img src="/images/logo/logo_full-dark.svg" alt="PocketSync" class="block sm:hidden h-6 dark:block" />
                        </NuxtLink>
                    </div>
                    <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                        <NuxtLink to="/" class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-white"
                            active-class="border-b-2 border-primary-500">
                            Home
                        </NuxtLink>

                        <NuxtLink to="/about"
                            class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-white"
                            active-class="border-b-2 border-primary-500">
                            About
                        </NuxtLink>

                        <NuxtLink to="https://docs.pocketsync.dev" target="_blank" rel="noopener"
                            class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-white"
                            active-class="border-b-2 border-primary-500">
                            <span>Documentation</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" class="w-4 h-4 ml-1">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                        </NuxtLink>
                    </div>
                </div>
                <div class="flex items-center">
                    <NuxtLink :to="user ? '/console' : '/auth/login'"
                        class="get-started-btn ml-8 inline-flex items-center justify-center px-6 py-2.5 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transform transition-all duration-200 hover:scale-105 hover:shadow-lg whitespace-nowrap">
                        {{ user ? 'Go to console' : 'Get started' }}
                        <svg xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 ml-2 transform transition-transform group-hover:translate-x-1 flex-shrink-0" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </NuxtLink>
                </div>
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
const { user } = useAuth()
</script>

<style scoped>
.get-started-btn {
    position: relative;
    overflow: hidden;
}

.get-started-btn::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: 0.5s;
}

.get-started-btn:hover::after {
    left: 100%;
}
</style>