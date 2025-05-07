import { useAuth } from '~/composables/useAuth'
import { useCookie } from '#app'
import { ACCESS_TOKEN_COOKIE_NAME } from '~/utils/cookie.options'

export default defineNuxtRouteMiddleware(async (to) => {
    if (!to.path.startsWith('/console')) {
        return
    }

    const { getCurrentUser, isAuthenticated, isSessionValidated, user } = useAuth()
    const accessTokenCookie = useCookie(ACCESS_TOKEN_COOKIE_NAME)

    if (isAuthenticated.value && isSessionValidated.value && to.path.startsWith('/auth')) {
        return navigateTo('/console')
    }

    if (!accessTokenCookie.value && !to.path.startsWith('/auth')) {
        if (isAuthenticated.value) isAuthenticated.value = false;
        if (isSessionValidated.value) isSessionValidated.value = false;
        if (user.value) user.value = null;
        return navigateTo('/auth/login');
    }

    try {
        await getCurrentUser()
        if (!isAuthenticated.value) {
            return navigateTo('/auth/login')
        }
    } catch (error) {
        return navigateTo('/auth/login')
    }

    if (isAuthenticated.value && to.path.startsWith('/auth')) {
        return navigateTo('/console');
    }
})