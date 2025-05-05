import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  ssr: true,
  modules: ['@pinia/nuxt'],
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
      OPENPANEL_CLIENT_ID: process.env.NODE_ENV === 'production' ? process.env.OPENPANEL_CLIENT_ID : undefined,
      OPENPANEL_CLIENT_SECRET: process.env.NODE_ENV === 'production' ? process.env.OPENPANEL_CLIENT_SECRET : undefined,
    }
  },
  robots: {
    UserAgent: '*',
    Allow: '/',
    Sitemap: 'https://pocketsync.dev/sitemap.xml'
  },
  sitemap: {
    hostname: process.env.NODE_ENV === 'production' ? 'https://codelia.dev' : 'http://localhost:3000',
    gzip: true,
    exclude: [
      '/auth/**',
      '/console/**',
    ]
  },
  app: {
    head: {
      bodyAttrs: {
        class: 'bg-gray-50 dark:bg-gray-900'
      }
    }
  }
});