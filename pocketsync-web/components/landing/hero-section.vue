<template>
    <div class="relative isolate overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
        <!-- Animated gradient blob in background -->
        <div class="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div
                class="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary-400 to-primary-300 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] animate-pulse duration-[4000ms]">
            </div>
        </div>
        
        <!-- Enhanced grid pattern with animation -->
        <div class="absolute inset-0 -z-10 overflow-hidden">
            <!-- Animated subtle movement for grid -->
            <div class="absolute inset-0 animate-[float_20s_ease-in-out_infinite]">
                <img src="/images/shape/grid-02.svg" alt="" class="h-full w-full object-cover opacity-20" />
            </div>
            
            <!-- Additional decorative elements -->
            <div class="absolute top-1/4 right-1/4 w-64 h-64 bg-primary-400/10 rounded-full blur-[80px] animate-pulse duration-[5000ms]"></div>
            <div class="absolute bottom-1/3 left-1/3 w-72 h-72 bg-primary-500/10 rounded-full blur-[100px] animate-pulse duration-[7000ms] delay-1000"></div>
        </div>

        <div class="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40 relative z-10">
            <!-- Left content column -->
            <div class="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8 relative">
                <!-- Decorative element -->
                <div class="absolute -left-16 -top-16 w-32 h-32 bg-primary-400/5 rounded-full blur-[40px]"></div>
                
                <h1 class="mt-10 text-4xl font-bold tracking-tight text-white sm:text-6xl bg-clip-text bg-gradient-to-r from-white to-gray-200">
                    Seamless offline-first sync, simplified
                </h1>
                <p class="mt-6 text-lg leading-8 text-gray-300 opacity-90">Build apps that work offline and sync
                    effortlessly across devices with our lightweight, developer-friendly solution.
                </p>
                <div class="mt-10 flex items-center gap-x-6">
                    <NuxtLink to="/auth/register"
                        class="rounded-md bg-white/10 backdrop-blur-sm px-6 py-3 text-sm font-medium text-white border border-white/20 shadow-sm hover:bg-white/20 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-500/20">
                        Get started
                    </NuxtLink>
                    <NuxtLink to="https://docs.pocketsync.dev" target="_blank" rel="noopener"
                        class="text-sm font-medium leading-6 text-white/80 group transition-all duration-300 hover:text-white flex items-center">
                        Documentation
                        <span aria-hidden="true"
                            class="inline-block transition-transform duration-300 group-hover:translate-x-1 ml-1">→</span>
                    </NuxtLink>
                </div>
            </div>

            <!-- Right content column with code preview -->
            <div class="mx-auto mt-12 flex max-w-2xl sm:mt-16 lg:ml-10 lg:mt-0 lg:mr-0 lg:max-w-none lg:flex-none xl:ml-32 relative">
                <!-- Decorative element -->
                <div class="absolute -right-12 -bottom-12 w-40 h-40 bg-primary-500/5 rounded-full blur-[50px]"></div>
                
                <div class="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
                    <div
                        class="rounded-xl bg-white/[0.07] backdrop-blur-xl p-2 ring-1 ring-inset ring-white/10 shadow-2xl transition-all duration-500 hover:shadow-primary-500/20 hover:bg-white/[0.09] hover:scale-[1.01] relative overflow-hidden">
                        <!-- Grid pattern inside the code window for depth -->
                        <div class="absolute inset-0 opacity-5">
                            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                <pattern id="smallGrid" width="8" height="8" patternUnits="userSpaceOnUse">
                                    <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" stroke-width="0.5" opacity="0.2"/>
                                </pattern>
                                <rect width="100%" height="100%" fill="url(#smallGrid)" />
                            </svg>
                        </div>
                        
                        <div class="flex border-b border-white/10 px-4 pt-4 relative">
                            <div class="rounded-t-md bg-white/10 px-4 py-2 text-sm text-white flex items-center gap-2">
                                <svg height="16" viewBox=".29 .22 77.26 95.75" width="24"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <g fill="none" fill-rule="evenodd">
                                        <path d="m48.75 95.97-25.91-25.74 14.32-14.57 40.39 40.31z" fill="#02539a" />
                                        <g fill="#45d1fd">
                                            <path d="m22.52 70.25 25.68-25.68h28.87l-39.95 39.95z" fill-opacity=".85" />
                                            <path d="m.29 47.85 14.58 14.57 62.2-62.2h-29.02z" />
                                        </g>
                                    </g>
                                </svg>
                                <span>Flutter</span>
                            </div>
                        </div>
                        <div class="rounded-md bg-gray-900 p-4">
                            <pre class="text-sm leading-6 text-gray-300 overflow-x-auto"><code class="language-dart hljs">// Initialize <span class="text-blue-400">PocketSync</span>
<span class="text-green-400">await</span> PocketSync.instance.initialize(
  dbPath: path,
  options: <span class="text-yellow-400">PocketSyncOptions</span>(
    projectId: <span class="text-amber-300">'your-project-id'</span>,
    authToken: <span class="text-amber-300">'your-auth-token'</span>,
    serverUrl: <span class="text-amber-300">'https://api.pocketsync.dev'</span>,
  ),
  databaseOptions: <span class="text-yellow-400">DatabaseOptions</span>(
    onCreate: (db, version) <span class="text-green-400">async</span> {
      <span class="text-green-400">await</span> db.execute(
        <span class="text-amber-300">'CREATE TABLE todos(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, isCompleted INTEGER)'</span>,
      );
    },
  ),
);

// Set user ID - In a real app, this would come from your auth system
<span class="text-green-400">await</span> PocketSync.instance.setUserId(userId: <span class="text-amber-300">'your-user-id'</span>);

// Start syncing
<span class="text-green-400">await</span> PocketSync.instance.start();</code></pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div
            class="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
            <div
                class="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-primary-400 to-primary-300 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem] animate-pulse duration-[4000ms]">
            </div>
        </div>

    </div>
</template>