import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware((to) => {
    const { isAuthenticated } = useAuth()

    // Only protect routes under /console
    if (to.path.startsWith('/console')) {
        // If user is not authenticated, redirect to login page
        if (!isAuthenticated.value) {
            return navigateTo('/auth/login')
        }
    }
})