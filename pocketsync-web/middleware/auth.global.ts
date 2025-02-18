import { cookieOptions } from '~/utils/cookie.options'

export default defineNuxtRouteMiddleware(async (to) => {
    const refreshToken = useCookie('refresh_token', cookieOptions)
    const accessToken = useCookie('access_token', cookieOptions)

    const isAuthenticated = !!refreshToken.value && !!accessToken.value

    // Allow access to non-console routes
    if (!to.path.startsWith('/console')) {
        return
    }

    // Allow access to auth routes if not authenticated
    if (!isAuthenticated && to.path.startsWith('/auth')) {
        return
    }

    // Redirect to login if accessing protected routes without being authenticated
    if (!isAuthenticated && to.path.startsWith('/console')) {
        return navigateTo('/auth/login')
    }

    // Redirect to console if accessing auth routes while authenticated
    if (isAuthenticated && to.path.startsWith('/auth')) {
        return navigateTo('/console')
    }
})