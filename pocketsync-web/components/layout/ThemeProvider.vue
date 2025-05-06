<template>
  <slot></slot>
</template>

<script setup lang="ts">
import { ref, provide, onMounted, watch, computed, onBeforeMount } from 'vue'

type Theme = 'light' | 'dark'

// Use a ref to track the theme state
const theme = ref<Theme>('light')
const isInitialized = ref(false)

const isDarkMode = computed(() => theme.value === 'dark')

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

// Apply theme as early as possible in the component lifecycle
onBeforeMount(() => {
  if (process.client) {
    const savedTheme = localStorage.getItem('theme') as Theme | null
    const initialTheme = savedTheme || 'light' // Default to light theme
    
    theme.value = initialTheme
    isInitialized.value = true
    
    // Apply the theme immediately
    applyTheme(initialTheme)
  }
})

// Also handle onMounted for safety
onMounted(() => {
  if (!isInitialized.value && process.client) {
    const savedTheme = localStorage.getItem('theme') as Theme | null
    const initialTheme = savedTheme || 'light' // Default to light theme
    
    theme.value = initialTheme
    isInitialized.value = true
    
    // Apply the theme immediately
    applyTheme(initialTheme)
  }
})

// Function to apply theme to document
function applyTheme(newTheme: Theme) {
  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Watch for theme changes and persist them
watch(theme, (newTheme) => {
  if (isInitialized.value && process.client) {
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }
})

provide('theme', {
  isDarkMode,
  toggleTheme,
})
</script>

<script lang="ts">
import { inject } from 'vue'

export function useTheme() {
  const theme = inject('theme')
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return theme
}
</script>
