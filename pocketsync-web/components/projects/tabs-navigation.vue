<template>
    <div class="mt-8">
        <div class="sm:hidden">
            <label for="tabs" class="sr-only">Select a tab</label>
            <select id="tabs" v-model="selectedTab"
                class="block w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500">
                <option v-for="tab in tabs" :key="tab.name" :value="tab.value">{{ tab.name }}</option>
            </select>
        </div>
        <div class="hidden sm:block">
            <div class="border-b border-gray-200">
                <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                    <button v-for="tab in tabs" :key="tab.name" @click="selectTab(tab.value)" :class="[
                        selectedTab === tab.value
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                        'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium'
                    ]">
                        {{ tab.name }}
                        <span v-if="tab.count !== undefined" :class="[
                            selectedTab === tab.value ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-900',
                            'ml-3 hidden rounded-full py-0.5 px-2.5 text-xs font-medium md:inline-block'
                        ]">{{ tab.count }}</span>
                    </button>
                </nav>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Tab {
    name: string
    value: string
    count?: number
}

const props = defineProps<{
    tabs: Tab[]
    modelValue: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

const selectedTab = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

function selectTab(value: string) {
    selectedTab.value = value
}
</script>