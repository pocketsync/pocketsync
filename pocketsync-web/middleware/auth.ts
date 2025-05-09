import { useAuth } from '~/composables/useAuth'
import { useCookie } from '#app'
import { ACCESS_TOKEN_COOKIE_NAME } from '~/utils/cookie.options'

export default defineNuxtRouteMiddleware((to) => {
    if (!to.path.startsWith('/console') && !to.path.startsWith('/auth')) {
        return
    }

    const { isAuthenticated, isSessionValidated, user } = useAuth()
    const accessTokenCookie = useCookie(ACCESS_TOKEN_COOKIE_NAME)

    if (isAuthenticated.value && isSessionValidated.value && to.path.startsWith('/auth')) {
        return navigateTo('/console')
    }

    if (!accessTokenCookie.value && to.path.startsWith('/console')) {
        if (isAuthenticated.value) isAuthenticated.value = false;
        if (isSessionValidated.value) isSessionValidated.value = false;
        if (user.value) user.value = null;
        return navigateTo('/auth/login');
    }

    if (accessTokenCookie.value && !isSessionValidated.value && to.path.startsWith('/console')) {
        return
    }

    if (accessTokenCookie.value && to.path.startsWith('/auth')) {
        return navigateTo('/console')
    }
})