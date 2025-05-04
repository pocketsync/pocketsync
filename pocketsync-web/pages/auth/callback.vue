<template>
    <div class="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
        <div class="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900">
            <div class="flex flex-col flex-1 w-full lg:w-1/2">
                <div class="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                    <div class="text-center">
                        <div class="mb-5 sm:mb-8">
                            <h1 class="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                                Authentication
                            </h1>
                        </div>
                        <div class="py-10">
                            <div class="animate-spin h-12 w-12 border-t-2 border-b-2 border-brand-600 mx-auto rounded-full"></div>
                            <p class="mt-4 text-gray-600 dark:text-gray-400">Completing authentication...</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="relative items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid">
                <div class="flex items-center justify-center z-1">
                    <common-grid-shape />
                    <div class="flex flex-col items-center max-w-xs">
                        <NuxtLink to="/" class="block mb-4">
                            <div class="flex items-center space-x-3">
                                <img class="w-6 h-6" src="/images/logo/logo_icon.svg" alt="Logo" />
                                <h1 class="text-2xl font-bold text-white dark:text-black">PocketSync</h1>
                            </div>
                        </NuxtLink>
                        <p class="text-center text-gray-400 dark:text-white/60">
                            Please wait while we complete your authentication.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from '#app'
import CommonGridShape from '~/components/common/common-grid-shape.vue'

const route = useRoute()
const router = useRouter()
const { error, handleSocialCallback } = useAuth()

useHead({
    title: 'Authentication - PocketSync'
})

definePageMeta({
    layout: 'auth'
})

onMounted(async () => {
    const accessToken = route.query.accessToken?.toString()
    const refreshToken = route.query.refreshToken?.toString()

    if (!accessToken || !refreshToken) {
        error.value = {
            message: 'Invalid authentication callback',
            code: 'SOCIAL_AUTH_ERROR'
        }
        router.push('/auth/login')
        return
    }

    try {
        await handleSocialCallback(accessToken, refreshToken)
        router.push('/console')
    } catch (err) {
        // Error is already handled by the composable
        router.push('/auth/login')
    }
})
</script>