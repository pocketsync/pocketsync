import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware(async (to) => {
    const { isAuthenticated, fetchUserProfile } = useAuth()
    const accessToken = useCookie('access_token').value

    // If trying to access console routes
    if (to.path.startsWith('/console')) {
        // If no token, redirect to login
        if (!accessToken) {
            return navigateTo('/auth/login')
        }

        try {
            // Only fetch profile if we have a token but no user profile loaded
            if (accessToken && !isAuthenticated.value) {
                await fetchUserProfile()
            }
        } catch (error: any) {
            // Ensure error is not null before accessing its properties
            if (error && (error.code === 'TOKEN_EXPIRED' || error.code === 'INVALID_CREDENTIALS')) {
                return navigateTo('/auth/login')
            }
            // For other errors, we can still let the user access the page
            // The error will be handled by the error state in useAuth
            console.error('Error fetching user profile:', error)
        }
    }
})