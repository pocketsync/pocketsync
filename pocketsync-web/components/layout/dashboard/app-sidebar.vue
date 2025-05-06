<template>
    <aside :class="[
        'fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-99999 border-r border-gray-200',
        {
            'lg:w-[290px]': isExpanded || isMobileOpen || isHovered,
            'lg:w-[90px]': !isExpanded && !isHovered,
            'translate-x-0 w-[290px]': isMobileOpen,
            '-translate-x-full': !isMobileOpen,
            'lg:translate-x-0': true,
        },
    ]" @mouseenter="!isExpanded && (isHovered = true)" @mouseleave="isHovered = false">
        <div :class="[
            'py-8 flex',
            !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start',
        ]">
            <NuxtLink to="/">
                <img v-if="isExpanded || isHovered || isMobileOpen" class="dark:hidden"
                    :class="{ 'w-32 h-8': isExpanded || isHovered || isMobileOpen }"
                    src="/images/logo/logo_full-light.svg" alt="Logo" />
                <img v-if="isExpanded || isHovered || isMobileOpen" class="hidden dark:block"
                    :class="{ 'w-32 h-8': isExpanded || isHovered || isMobileOpen }"
                    src="/images/logo/logo_full-dark.svg" alt="Logo" />
                <img v-else src="/images/logo/logo_icon.svg" alt="Logo" class="w-6 h-6" />
            </NuxtLink>
        </div>
        <div class="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
            <NuxtLink to="/console"
                class="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                :class="[!isExpanded && !isHovered ? 'lg:justify-center' : 'lg:justify-start']">
                <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                        d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                        clip-rule="evenodd" />
                </svg>
                <span v-if="isExpanded || isHovered || isMobileOpen" class="text-sm font-medium">Back to console</span>
            </NuxtLink>
            <nav class="mb-6">
                <div class="flex flex-col gap-4">
                    <div v-for="(menuGroup, groupIndex) in menuGroups" :key="groupIndex">
                        <h2 :class="[
                            'mb-4 text-xs uppercase flex leading-[20px] text-gray-400',
                            !isExpanded && !isHovered
                                ? 'lg:justify-center'
                                : 'justify-start',
                        ]">
                            <template v-if="isExpanded || isHovered || isMobileOpen">
                                {{ menuGroup.title }}
                            </template>
                            <HorizontalDots v-else />
                        </h2>
                        <ul class="flex flex-col gap-4">
                            <li v-for="(item, index) in menuGroup.items" :key="item.name">
                                <button v-if="item.subItems" @click="toggleSubmenu(groupIndex, index)" :class="[
                                    'menu-item group w-full',
                                    {
                                        'menu-item-active': isSubmenuOpen(groupIndex, index),
                                        'menu-item-inactive': !isSubmenuOpen(groupIndex, index),
                                    },
                                    !isExpanded && !isHovered
                                        ? 'lg:justify-center'
                                        : 'lg:justify-start',
                                ]">
                                    <span :class="[
                                        isSubmenuOpen(groupIndex, index)
                                            ? 'menu-item-icon-active'
                                            : 'menu-item-icon-inactive',
                                    ]">
                                        <component :is="item.icon" />
                                    </span>
                                    <span v-if="isExpanded || isHovered || isMobileOpen" class="menu-item-text">{{
                                        item.name }}</span>
                                    <ChevronDownIcon v-if="isExpanded || isHovered || isMobileOpen" :class="[
                                        'ml-auto w-5 h-5 transition-transform duration-200',
                                        {
                                            'rotate-180 text-brand-500': isSubmenuOpen(
                                                groupIndex,
                                                index
                                            ),
                                        },
                                    ]" />
                                </button>
                                <NuxtLink v-else-if="item.path" :to="item.path" :target="item.target" :class="[
                                    'menu-item group',
                                    {
                                        'menu-item-active': isActive(item.path),
                                        'menu-item-inactive': !isActive(item.path),
                                    },
                                ]">
                                    <span :class="[
                                        isActive(item.path)
                                            ? 'menu-item-icon-active'
                                            : 'menu-item-icon-inactive',
                                    ]">
                                        <component :is="item.icon" />
                                    </span>
                                    <span v-if="isExpanded || isHovered || isMobileOpen" class="menu-item-text">{{
                                        item.name }}</span>
                                </NuxtLink>
                                <transition @enter="startTransition" @after-enter="endTransition"
                                    @before-leave="startTransition" @after-leave="endTransition">
                                    <div v-show="isSubmenuOpen(groupIndex, index) &&
                                        (isExpanded || isHovered || isMobileOpen)
                                        ">
                                        <ul class="mt-2 space-y-1 ml-9">
                                            <li v-for="subItem in item.subItems" :key="subItem.name">
                                                <NuxtLink :to="subItem.path" :class="[
                                                    'menu-dropdown-item',
                                                    {
                                                        'menu-dropdown-item-active': isActive(
                                                            subItem.path
                                                        ),
                                                        'menu-dropdown-item-inactive': !isActive(
                                                            subItem.path
                                                        ),
                                                    },
                                                ]" :target="subItem.target">
                                                    {{ subItem.name }}
                                                </NuxtLink>
                                            </li>
                                        </ul>
                                    </div>
                                </transition>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { PhCode } from '@phosphor-icons/vue';
import { ChevronDownIcon, DocsIcon, HomeIcon, SupportIcon, TableIcon, HorizontalDots } from '~/components/icons';


const route = useRoute()
const { isExpanded, isMobileOpen, isHovered, openSubmenu } = useSidebar();

defineProps({
    isExpanded: {
        type: Boolean,
        default: false,
    },
    isMobileOpen: {
        type: Boolean,
        default: false,
    },
    isHovered: {
        type: Boolean,
        default: false,
    },
})

function isActive(href: string): boolean {
    // Special case for dashboard
    if (href === '/console') {
        return route.path === href || route.path.endsWith('/console/projects/')
    }

    // Handle external URLs
    if (href.startsWith('http://') || href.startsWith('https://')) {
        return false
    }

    return route.path.endsWith(href)
}

const toggleSubmenu = (groupIndex: number, itemIndex: number) => {
    const key = `${groupIndex}-${itemIndex}`;
    openSubmenu.value = openSubmenu.value === key ? null : key;
};

const startTransition = (el: any) => {
    el.style.height = "auto";
    const height = el.scrollHeight;
    el.style.height = "0px";
    el.offsetHeight; // force reflow
    el.style.height = height + "px";
};

const endTransition = (el: any) => {
    el.style.height = "";
};

const isSubmenuOpen = (groupIndex: number, itemIndex: number) => {
    const key = `${groupIndex}-${itemIndex}`;
    return (
        openSubmenu.value === key ||
        (isAnySubmenuRouteActive.value &&
            menuGroups.value[groupIndex].items[itemIndex].subItems?.some((subItem) =>
                isActive(subItem.path)
            ))
    );
};

const isAnySubmenuRouteActive = computed(() => {
    return menuGroups.value.some((group) =>
        group.items.some(
            (item) =>
                item.subItems && item.subItems.some((subItem) => isActive(subItem.path))
        )
    );
});

const projectId = computed(() => {
    return (route.params.id as string) || 'default';
});

const menuGroups = computed(() => [
    {
        title: 'Core',
        items: [
            {
                name: 'Dashboard',
                icon: HomeIcon,
                path: `/console/projects/${projectId.value}`,
            },
            {
                name: 'Integrations',
                icon: PhCode,
                path: `/console/projects/${projectId.value}/integrations`,
            },
        ],
    },
    {
        title: 'Monitoring',
        items: [
            {
                name: 'Sync sessions',
                icon: TableIcon,
                path: `/console/projects/${projectId.value}/monitoring/sessions`,
            },
            {
                name: 'System logs',
                icon: DocsIcon,
                path: `/console/projects/${projectId.value}/sync-logs`,
            },
            {
                name: 'Sync conflicts',
                icon: DocsIcon,
                path: `/console/projects/${projectId.value}/conflicts`,
            },
        ],
    },
    {
        title: 'Tools',
        items: [
            {
                name: 'Data exploration',
                icon: TableIcon,
                path: `/console/projects/${projectId.value}/data-exploration`,
            },
        ],
    },
    {
        title: 'Help',
        items: [
            {
                name: 'Documentation',
                icon: SupportIcon,
                path: 'https://docs.pocketsync.dev',
                target: '_blank',
            }
        ],
    },
]);
</script>