import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware((to) => {
    const { isAuthenticated } = useAuth()

    // Protect console routes and handle auth page redirections
    if (to.path.startsWith('/console')) {
        // If user is not authenticated, redirect to login page
        if (!isAuthenticated.value) {
            return navigateTo('/auth/login')
        }
    } else if (to.path.startsWith('/auth')) {
        // If user is authenticated and tries to access auth pages, redirect to console
        if (isAuthenticated.value) {
            return navigateTo('/console')
        }
    }
})