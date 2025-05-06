<template>
  <div class="relative">
    <button
      @click="toggleDatePicker"
      class="flex items-center"
      :class="{ 'border-primary-500 ring-1 ring-primary-500': isOpen }"
    >
      <PhCalendar class="mr-2 h-4 w-4" />
      <span v-if="!startDate && !endDate">Select date range</span>
      <span v-else>{{ formatDateRange }}</span>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 z-10 mt-2 w-auto rounded-md bg-white shadow-lg dark:bg-slate-800 p-4"
      @click.outside="isOpen = false"
    >
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Start Date -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
          <input
            type="date"
            v-model="localStartDate"
            class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-slate-800 dark:text-white dark:focus:border-primary-500"
          />
        </div>

        <!-- End Date -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
          <input
            type="date"
            v-model="localEndDate"
            :min="localStartDate"
            class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-slate-800 dark:text-white dark:focus:border-primary-500"
          />
        </div>
      </div>

      <!-- Preset buttons -->
      <div class="mt-4 grid grid-cols-2 gap-2">
        <button
          @click="setDateRange('today')"
          class="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Today
        </button>
        <button
          @click="setDateRange('yesterday')"
          class="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Yesterday
        </button>
        <button
          @click="setDateRange('last7days')"
          class="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Last 7 days
        </button>
        <button
          @click="setDateRange('last30days')"
          class="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Last 30 days
        </button>
      </div>

      <!-- Actions -->
      <div class="mt-4 flex justify-between">
        <button
          @click="clearDates"
          class="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Clear
        </button>
        <Button variant="primary" @click="applyDateRange" size="sm">
          Apply
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { PhCalendar } from '@phosphor-icons/vue'

const props = defineProps({
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  }
})

const emit = defineEmits(['update:startDate', 'update:endDate', 'update:dateRange'])

const isOpen = ref(false)
const localStartDate = ref(props.startDate ? format(props.startDate, 'yyyy-MM-dd') : '')
const localEndDate = ref(props.endDate ? format(props.endDate, 'yyyy-MM-dd') : '')

// Format date for display
const formatDate = (date: Date | null): string => {
  if (!date) return ''
  return format(date, 'MMM d, yyyy')
}

// Computed property for formatted date range
const formatDateRange = computed(() => {
  if (props.startDate && props.endDate) {
    return `${formatDate(props.startDate)} - ${formatDate(props.endDate)}`
  } else if (props.startDate) {
    return `From ${formatDate(props.startDate)}`
  } else if (props.endDate) {
    return `Until ${formatDate(props.endDate)}`
  }
  return 'Select date range'
})

// Toggle date picker
const toggleDatePicker = () => {
  isOpen.value = !isOpen.value
}

// Set date range based on preset
const setDateRange = (preset: string) => {
  const today = new Date()
  const todayStart = startOfDay(today)
  const todayEnd = endOfDay(today)
  
  switch (preset) {
    case 'today':
      localStartDate.value = format(todayStart, 'yyyy-MM-dd')
      localEndDate.value = format(todayEnd, 'yyyy-MM-dd')
      break
    case 'yesterday':
      const yesterday = subDays(today, 1)
      localStartDate.value = format(startOfDay(yesterday), 'yyyy-MM-dd')
      localEndDate.value = format(endOfDay(yesterday), 'yyyy-MM-dd')
      break
    case 'last7days':
      localStartDate.value = format(subDays(todayStart, 6), 'yyyy-MM-dd')
      localEndDate.value = format(todayEnd, 'yyyy-MM-dd')
      break
    case 'last30days':
      localStartDate.value = format(subDays(todayStart, 29), 'yyyy-MM-dd')
      localEndDate.value = format(todayEnd, 'yyyy-MM-dd')
      break
  }
}

// Apply selected date range
const applyDateRange = () => {
  const start = localStartDate.value ? new Date(localStartDate.value) : null
  const end = localEndDate.value ? new Date(localEndDate.value) : null
  
  emit('update:startDate', start)
  emit('update:endDate', end)
  emit('update:dateRange')
  
  isOpen.value = false
}

// Clear dates
const clearDates = () => {
  localStartDate.value = ''
  localEndDate.value = ''
  
  emit('update:startDate', null)
  emit('update:endDate', null)
  emit('update:dateRange')
  
  isOpen.value = false
}

// Watch for prop changes
watch(() => props.startDate, (newVal) => {
  if (newVal) {
    localStartDate.value = format(newVal, 'yyyy-MM-dd')
  } else {
    localStartDate.value = ''
  }
})

watch(() => props.endDate, (newVal) => {
  if (newVal) {
    localEndDate.value = format(newVal, 'yyyy-MM-dd')
  } else {
    localEndDate.value = ''
  }
})
</script>

<style scoped>
/* Add any custom styles here */
</style>
