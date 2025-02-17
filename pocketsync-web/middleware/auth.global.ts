import { useCookie } from 'nuxt/app'

export default defineNuxtRouteMiddleware((to) => {
    const accessToken = useCookie('access_token')

    // Allow access to non-console routes
    if (!to.path.startsWith('/console')) {
        return
    }

    // Allow access to auth routes if not authenticated
    if (!accessToken.value && to.path.startsWith('/auth')) {
        return
    }

    // Redirect to login if accessing protected routes without token
    if (!accessToken.value && to.path.startsWith('/console')) {
        return navigateTo('/auth/login')
    }

    // Redirect to console if accessing auth routes while authenticated
    if (accessToken.value && to.path.startsWith('/auth')) {
        return navigateTo('/console')
    }
})