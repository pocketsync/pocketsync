import { useAuth } from '~/composables/useAuth'

export default defineNuxtPlugin(async (nuxtApp) => {
  const auth = useAuth()
  
  // Initialize auth during SSR and client-side
  await auth.initAuth()

  // Set up global error handler for auth errors
  nuxtApp.vueApp.config.errorHandler = (error: any) => {
    if (error?.response?.status === 401) {
      auth.logout()
      navigateTo('/auth/login')
    }
  }

  const publicPages = [
    '/',
    '/about',
    '/contact',
    '/pricing',
    '/faq',
    '/privacy',
    '/terms',
  ]

  const authPages = [
   '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
    '/auth/callback',
  ]

  nuxtApp.$router.beforeEach(async (to: any, from: any) => {
    // Skip auth checks during SSR
    if (import.meta.server) {
      return true
    }

    // Only fetch profile if authenticated and profile is not already loaded
    if (auth.isAuthenticated.value && !auth.user.value) {
      await auth.fetchUserProfile()
    }

    const isAuthPage = authPages.includes(to.path)
    const isPublicPage = publicPages.includes(to.path)
    const isAuthenticated = auth.isAuthenticated.value

    if (isAuthPage && isAuthenticated) {
      return '/console'
    }

    if (isPublicPage) {
      if (isAuthenticated && to.path.startsWith('/auth/')) {
        return '/console'
      }
      return true
    }

    // Protect private pages
    if (!isAuthenticated) {
      return '/auth/login'
    }

    return true
  })
})