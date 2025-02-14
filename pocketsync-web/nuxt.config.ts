import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from 'url';

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        'web-client': fileURLToPath(new URL('./api-client', import.meta.url))
      }
    }
  },
});