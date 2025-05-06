import { ref } from 'vue'

export const useDebounce = () => {
  const timeoutId = ref<NodeJS.Timeout | null>(null)

  const debounce = (fn: Function, delay: number) => {
    return (...args: any[]) => {
      if (timeoutId.value) {
        clearTimeout(timeoutId.value)
      }
      
      timeoutId.value = setTimeout(() => {
        fn(...args)
      }, delay)
    }
  }

  return {
    debounce
  }
}
