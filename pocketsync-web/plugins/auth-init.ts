import { useAuth } from '~/composables/useAuth'
import { ACCESS_TOKEN_COOKIE_NAME } from '~/utils/cookie.options'

export default defineNuxtPlugin(async (nuxtApp) => {
    const { isAuthenticated, isSessionValidated, user, getCurrentUser } = useAuth()
    const accessTokenCookie = useCookie<string | null>(ACCESS_TOKEN_COOKIE_NAME)
    const route = useRoute()

    // If we have a token, set initial authentication state
    if (accessTokenCookie.value) {
        // Set initial state to indicate we have a token
        if (!isAuthenticated.value) {
            isAuthenticated.value = true
        }

        // Only on client-side and only if not already validated
        if (import.meta.client && !isSessionValidated.value) {
            // Use a slight delay to avoid blocking navigation
            setTimeout(async () => {
                try {
                    // Attempt to get the current user data
                    await getCurrentUser()
                    // If we're on the login page but authenticated, redirect to console
                    const currentRoute = useRoute()
                    if (currentRoute.path.startsWith('/auth') && isAuthenticated.value && isSessionValidated.value) {
                        navigateTo('/console')
                    }
                } catch (error) {
                    // If there's an error, reset the authentication state
                    console.error('Auth init error:', error)
                    isAuthenticated.value = false
                    isSessionValidated.value = false
                    user.value = null
                    
                    // If we're on a protected route, redirect to login
                    const currentRoute = useRoute()
                    if (currentRoute.path.startsWith('/console')) {
                        navigateTo('/auth/login')
                    }
                }
            }, 10) // Very small delay to not block initial render
        }
    } else {
        // No token, ensure auth state is cleared
        isAuthenticated.value = false
        isSessionValidated.value = false
        user.value = null
    }
})
