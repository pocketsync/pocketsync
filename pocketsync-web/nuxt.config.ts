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
});