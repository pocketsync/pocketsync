<script setup lang="ts">
import { PhWarning } from '@phosphor-icons/vue'
</script>

<template>
    <div class="rounded-lg bg-yellow-50 p-4">
        <div class="flex">
            <div class="flex-shrink-0">
                <component :is="PhWarning" class="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800">Alpha Stage Warning</h3>
                <div class="mt-2 text-sm text-yellow-700">
                    <p>
                        PocketSync is currently in alpha stage. During this phase:
                    </p>
                    <ul class="mt-2 list-disc space-y-1 pl-5">
                        <li>You may encounter bugs or unexpected behavior</li>
                        <li>Data loss or corruption is possible</li>
                        <li>Features and APIs may change without notice</li>
                        <li>We recommend regular backups of critical data</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>