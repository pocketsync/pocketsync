<script setup lang="ts">
import { PhWarning } from '@phosphor-icons/vue'
</script>

<template>
    <div class="rounded-lg bg-yellow-50 dark:bg-yellow-100 p-4">
        <div class="flex">
            <div class="flex-shrink-0">
                <component :is="PhWarning" class="h-5 w-5 text-yellow-400 dark:text-yellow-600" aria-hidden="true" />
            </div>
            <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-600">We are currently in alpha</h3>
                <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-600">
                    <p>
                        PocketSync is currently in alpha. The system is under active development and should not be considered reliable for production use. Features and APIs may change without notice.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>