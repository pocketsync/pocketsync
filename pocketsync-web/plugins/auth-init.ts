import { useAuth } from '~/composables/useAuth'
import { ACCESS_TOKEN_COOKIE_NAME } from '~/utils/cookie.options'

export default defineNuxtPlugin(async (nuxtApp) => {
    const { isAuthenticated, isSessionValidated, user } = useAuth()
    const accessTokenCookie = useCookie<string | null>(ACCESS_TOKEN_COOKIE_NAME)

    if (accessTokenCookie.value && !isAuthenticated.value) {
        if (import.meta.server) {
            isAuthenticated.value = true;
            isSessionValidated.value = false;
        } else if (import.meta.client) {
            isAuthenticated.value = true;
            isSessionValidated.value = false;
        }
    }
});
