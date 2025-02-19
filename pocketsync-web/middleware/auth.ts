import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware(async (to) => {
    // Only protect routes under /console path
    if (!to.path.startsWith('/console')) {
        return
    }

    const { getCurrentUser, isAuthenticated } = useAuth()

    // Check if user is authenticated
    if (!isAuthenticated.value) {
        return navigateTo('/auth/login')
    }

    try {
        // Fetch current user profile
        await getCurrentUser()
    } catch (error) {
        // If there's an error fetching the user profile, redirect to login
        return navigateTo('/auth/login')
    }
})