<template>
    <div class="bg-gray-50 py-24 sm:py-32">
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
            <div class="mx-auto max-w-2xl text-center">
                <h2 class="text-base font-semibold leading-7 text-primary-600">Pricing</h2>
                <p class="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Free during our beta phase</p>
                <p class="mt-6 text-lg leading-8 text-gray-600">We're currently offering PocketSync completely free while we refine our platform. Enjoy all features without any cost until we reach stable release.</p>
            </div>

            <div class="mx-auto mt-16 max-w-lg text-center p-8 rounded-3xl ring-1 ring-gray-900/10 sm:p-10 transition-all duration-300 hover:shadow-xl hover:bg-white">
                <div class="mb-8 rounded-lg bg-primary-50 p-6 text-center shadow-sm transition-all duration-300 hover:shadow-md">
                    <p class="text-xl font-semibold text-primary-600">🎉 Free for everyone during beta!</p>
                    <p class="mt-4 text-gray-600">Get early access to all features with no limitations. We'll provide plenty of notice before introducing any paid plans.</p>
                </div>
                
                <h3 class="text-lg font-semibold leading-8 text-primary-600">All Features Included</h3>
                <ul role="list" class="mt-8 space-y-3 text-sm leading-6 text-gray-600 max-w-md mx-auto text-left">
                    <li class="flex gap-x-3">
                        <svg class="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                        </svg>
                        Unlimited syncs
                    </li>
                    <li class="flex gap-x-3">
                        <svg class="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                        </svg>
                        Advanced conflict resolution
                    </li>
                    <li class="flex gap-x-3">
                        <svg class="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                        </svg>
                        Priority support
                    </li>
                    <li class="flex gap-x-3">
                        <svg class="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                        </svg>
                        Custom integrations
                    </li>
                </ul>
                <NuxtLink to="/auth/register" class="mt-8 block rounded-md bg-primary-600/90 backdrop-blur-sm px-3.5 py-2.5 text-center text-sm font-medium leading-6 text-white shadow-sm hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-500/20 border border-primary-500/10">
                    Get started for free
                </NuxtLink>
                <p class="mt-4 text-sm text-gray-500">No credit card required</p>
            </div>
        </div>
    </div>
</template>