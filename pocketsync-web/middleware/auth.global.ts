import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware((to) => {
    if (!to.path.startsWith('/console')) {
        return
    }

    const { isAuthenticated } = useAuth()

    if (isAuthenticated.value && to.path.startsWith('/auth')) {
        return navigateTo('/console')
    }

    if (!isAuthenticated.value && to.path.startsWith('/console')) {
        return navigateTo('/auth/login')
    }
})