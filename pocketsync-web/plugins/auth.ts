import { useAuth } from '~/composables/useAuth'

export default defineNuxtPlugin((nuxtApp) => {
  const auth = useAuth()
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
    const isAuthPage = authPages.includes(to.path)
    console.log(to.path)
    const isPublicPage = publicPages.includes(to.path)
    const isAuthenticated = await auth.isAuthenticated

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