<template>
    <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
            <p class="mt-4 text-gray-600">Completing authentication...</p>
        </div>
    </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from '#app'

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