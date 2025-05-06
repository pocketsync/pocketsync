import { ref } from 'vue'

export function useClipboard() {
  const copied = ref(false)
  const error = ref<Error | null>(null)

  const copy = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
      
      return true
    } catch (e) {
      error.value = e as Error
      return false
    }
  }

  return {
    copy,
    copied,
    error
  }
}
