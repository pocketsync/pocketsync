import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  ssr: true,
  vite: {
    build: {
      rollupOptions: {
        treeshake: false
      }
    },
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL,
    }
  },
  modules: ['@sidebase/nuxt-auth'],
  auth: {
    baseURL: process.env.API_BASE_URL,
    provider: {
      type: 'local',
      endpoints: {
        signIn: { path: '/auth/login', method: 'post' },
        signOut: { path: '/auth/logout', method: 'post' },
        signUp: { path: '/auth/register', method: 'post' },
        getSession: { path: '/auth/me', method: 'get' }
      },
      pages: {
        login: '/auth/login'
      },
      token: {
        signInResponseTokenPointer: '/access_token'
      }
    },
    globalAppMiddleware: {
      isEnabled: false
    }
  },
  routeRules: {
    '/console/**': { middleware: ['auth'] }
  }
});