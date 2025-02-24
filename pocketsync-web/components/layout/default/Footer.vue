<template>
    <footer class="bg-white border-t border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

            <div class="grid grid-cols-2 md:grid-cols-4 gap-8 w-full">
                <div>
                    <h3 class="text-sm font-semibold text-gray-400 tracking-wider uppercase">Product</h3>
                    <div class="mt-4 space-y-4">
                        <NuxtLink to="https://docs.pocketsync.dev"
                            class="text-base text-gray-500 hover:text-gray-900 block">Documentation
                        </NuxtLink>
                    </div>
                </div>
                <div>
                    <h3 class="text-sm font-semibold text-gray-400 tracking-wider uppercase">Support</h3>
                    <div class="mt-4 space-y-4">
                        <NuxtLink to="/faq" class="text-base text-gray-500 hover:text-gray-900 block">FAQ</NuxtLink>
                        <NuxtLink to="/contact" class="text-base text-gray-500 hover:text-gray-900 block">Contact
                        </NuxtLink>
                    </div>
                </div>
                <div>
                    <h3 class="text-sm font-semibold text-gray-400 tracking-wider uppercase">Company</h3>
                    <div class="mt-4 space-y-4">
                        <NuxtLink to="/about" class="text-base text-gray-500 hover:text-gray-900 block">About
                        </NuxtLink>
                        <NuxtLink to="/privacy" class="text-base text-gray-500 hover:text-gray-900 block">Privacy
                        </NuxtLink>
                        <NuxtLink to="/terms" class="text-base text-gray-500 hover:text-gray-900 block">Terms
                        </NuxtLink>
                    </div>
                </div>
            </div>
            <div class="mt-8 border-t border-gray-200 pt-8">
                <p class="text-base text-gray-400">
                    &copy; {{ currentYear }} PocketSync. All rights reserved.
                </p>
            </div>
        </div>
    </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>