// This plugin runs on the client side before the app is mounted
// to prevent theme flashing by applying the theme immediately

export default defineNuxtPlugin(() => {
  // Only run this code on the client side
  if (import.meta.client) {
    // Get the theme from localStorage or default to light
    const savedTheme = localStorage.getItem('theme') || 'light'
    
    // Apply the theme to the document
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
})
