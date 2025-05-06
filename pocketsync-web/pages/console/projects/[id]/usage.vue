<template>
    <PageBreadcrumb :pageTitle="'Usage'" :items="[
        { label: 'Projects', path: '/console/projects' },
        { label: currentProject?.name || 'Project', path: `/console/projects/${projectId}` },
        { label: 'Usage', path: `/console/projects/${projectId}/usage` }
    ]" />
</template>

<script setup lang="ts">
import PageBreadcrumb from '~/components/common/page-breadcrumb.vue';
import { useRoute } from 'vue-router';
import { onMounted } from 'vue';
import { useProjectsStore } from '~/stores/projectsStore';
import { storeToRefs } from 'pinia';

definePageMeta({
    layout: 'dashboard'
})

const projectsStore = useProjectsStore()

const route = useRoute()
const projectId = route.params.id

const { currentProject } = storeToRefs(projectsStore)

onMounted(async () => {
    if (projectId) {
        await projectsStore.fetchProjectById(projectId)
    }
})
</script>

    