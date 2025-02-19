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

const route = useRoute()
const { error } = useAuth()

onMounted(async () => {
    const accessToken = route.query.accessToken
    const refreshToken = route.query.refreshToken

    if (!accessToken || !refreshToken) {
        error.value = {
            message: 'Invalid authentication callback',
            code: 'SOCIAL_AUTH_ERROR'
        }
        navigateTo('/auth/login')
        return
    }

    try {
        const { setTokens, fetchUserProfile } = useAuth()
        setTokens(accessToken, refreshToken)
        await fetchUserProfile()
        navigateTo('/console')
    } catch (err) {
        navigateTo('/auth/login')
    }
})
</script>