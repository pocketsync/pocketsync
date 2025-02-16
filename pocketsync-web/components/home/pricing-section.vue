<template>
    <div class="bg-gray-50 py-24 sm:py-32">
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
            <!-- Promotional Banner -->
            <div class="mb-12 rounded-lg bg-primary-50 p-4 text-center">
                <p class="text-lg font-semibold text-primary-600">🎉 Free for everyone during beta! Get early access to all features.</p>
            </div>

            <div class="mx-auto max-w-2xl text-center">
                <h2 class="text-base font-semibold leading-7 text-primary-600">Pricing</h2>
                <p class="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Choose the right plan for your app</p>
                <p class="mt-6 text-lg leading-8 text-gray-600">Simple, transparent pricing that scales with your needs. All plans include core features.</p>
            </div>

            <div class="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-6xl lg:grid-cols-3">
                <!-- Free Tier -->
                <div class="rounded-3xl p-8 ring-1 ring-gray-900/10 sm:p-10">
                    <h3 class="text-lg font-semibold leading-8 text-primary-600">Free</h3>
                    <p class="mt-4 text-sm leading-6 text-gray-600">Perfect for trying out PocketSync.</p>
                    <p class="mt-6 flex items-baseline gap-x-1">
                        <span class="text-4xl font-bold tracking-tight text-gray-900">$0</span>
                        <span class="text-sm font-semibold leading-6 text-gray-600">/month</span>
                    </p>
                    <ul role="list" class="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                        <li class="flex gap-x-3">
                            <svg class="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                            </svg>
                            Up to 1,000 syncs/month
                        </li>
                        <li class="flex gap-x-3">
                            <svg class="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                            </svg>
                            Basic conflict resolution
                        </li>
                        <li class="flex gap-x-3">
                            <svg class="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                            </svg>
                            Community support
                        </li>
                    </ul>
                    <NuxtLink to="/auth/register" class="mt-8 block rounded-md bg-primary-600 px-3.5 py-2 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
                        Get started
                    </NuxtLink>
                </div>

                <!-- Starter Plan -->
                <div class="rounded-3xl p-8 ring-1 ring-gray-900/10 sm:p-10">
                    <h3 class="text-lg font-semibold leading-8 text-primary-600">Starter</h3>
                    <p class="mt-4 text-sm leading-6 text-gray-600">Perfect for small projects and individual developers.</p>
                    <p class="mt-6 flex items-baseline gap-x-1">
                        <span class="text-4xl font-bold tracking-tight text-gray-900">$29</span>
                        <span class="text-sm font-semibold leading-6 text-gray-600">/month</span>
                    </p>
                    <ul role="list" class="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                        <li class="flex gap-x-3">
                            <svg class="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                            </svg>
                            Up to 10,000 syncs/month
                        </li>
                        <li class="flex gap-x-3">
                            <svg class="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                            </svg>
                            Basic conflict resolution
                        </li>
                        <li class="flex gap-x-3">
                            <svg class="h-6 w-5 flex-none text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                            </svg>
                            Community support
                        </li>
                    </ul>
                    <NuxtLink to="/auth/register" class="mt-8 block rounded-md bg-primary-600 px-3.5 py-2 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
                        Get started
                    </NuxtLink>
                </div>

                <!-- Pro Plan -->
                <div class="rounded-3xl p-8 ring-1 ring-gray-900/10 sm:p-10 relative bg-gray-900">
                    <div class="absolute -top-4 right-8 rounded-full bg-primary-600 px-3 py-1 text-sm font-semibold text-white">
                        Popular
                    </div>
                    <h3 class="text-lg font-semibold leading-8 text-white">Pro</h3>
                    <p class="mt-4 text-sm leading-6 text-gray-300">For growing teams and production applications.</p>
                    <p class="mt-6 flex items-baseline gap-x-1">
                        <span class="text-4xl font-bold tracking-tight text-white">$99</span>
                        <span class="text-sm font-semibold leading-6 text-gray-300">/month</span>
                    </p>
                    <ul role="list" class="mt-8 space-y-3 text-sm leading-6 text-gray-300">
                        <li class="flex gap-x-3">
                            <svg class="h-6 w-5 flex-none text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                            </svg>
                            Unlimited syncs
                        </li>
                        <li class="flex gap-x-3">
                            <svg class="h-6 w-5 flex-none text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                            </svg>
                            Advanced conflict resolution
                        </li>
                        <li class="flex gap-x-3">
                            <svg class="h-6 w-5 flex-none text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                            </svg>
                            Priority support
                        </li>
                        <li class="flex gap-x-3">
                            <svg class="h-6 w-5 flex-none text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                            </svg>
                            Custom integrations
                        </li>
                    </ul>
                    <NuxtLink to="/auth/register" class="mt-8 block rounded-md bg-white px-3.5 py-2 text-center text-sm font-semibold leading-6 text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                        Get started
                    </NuxtLink>
                </div>
            </div>
        </div>
    </div>
</template>