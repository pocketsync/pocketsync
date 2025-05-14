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
    hostname: process.env.NODE_ENV === 'production' ? 'https://pocketsync.dev' : 'http://localhost:3000',
    gzip: true,
    exclude: [
      '/auth/**',
      '/console/**',
    ]
  },
  app: {
    head: {
      titleTemplate: '%s - PocketSync',
      htmlAttrs: {
        lang: 'en'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: 'PocketSync is a powerful local-first synchronization solution that helps you keep your data in sync across all your devices while maintaining privacy and security.' },
        { name: 'format-detection', content: 'telephone=no' }
      ],
      script: [
        {
          innerHTML: `(function() {
            try {
              const savedTheme = localStorage.getItem('theme') || 'light';
              if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (e) {
              console.error('Failed to apply theme:', e);
            }
          })();`,
          type: 'text/javascript',
          id: 'theme-script'
        }
      ],
      bodyAttrs: {
        class: 'bg-gray-50 dark:bg-gray-900'
      },
    }
  }
});