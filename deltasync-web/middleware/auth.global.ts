import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware((to) => {
    // Skip auth check for public routes
    if (['/', '/auth/login', '/auth/register', '/auth/callback'].includes(to.path)) {
        return
    }

    const { isAuthenticated } = useAuth()

    // Only check for authentication status, no API calls
    if (!isAuthenticated.value) {
        return navigateTo('/auth/login')
    }
})