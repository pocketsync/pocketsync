export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
        if (process.env.NODE_ENV === 'development') {
            console.error(error)
        }
    }

    // Also possible
    nuxtApp.hook('vue:error', (error, instance, info) => {
        if (process.env.NODE_ENV === 'development') {
            console.error(error)
        }
    })
})
