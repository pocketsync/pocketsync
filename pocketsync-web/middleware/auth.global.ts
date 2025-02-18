import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware(async (to) => {
    const { isAuthenticated } = useAuth()

    // Allow access to non-console routes
    if (!to.path.startsWith('/console')) {
        return
    }

    // Allow access to auth routes if not authenticated
    if (!isAuthenticated.value && to.path.startsWith('/auth')) {
        return
    }

    // Redirect to login if accessing protected routes without being authenticated
    if (!isAuthenticated.value && to.path.startsWith('/console')) {
        return navigateTo('/auth/login')
    }

    // Redirect to console if accessing auth routes while authenticated
    if (isAuthenticated.value && to.path.startsWith('/auth')) {
        return navigateTo('/console')
    }
})