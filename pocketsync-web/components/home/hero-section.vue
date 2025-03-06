<template>
    <div class="relative isolate overflow-hidden bg-gradient-to-b from-primary-600 to-primary-900">
        <div class="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div
                class="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary-500 to-primary-200 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] animate-pulse">
            </div>
        </div>

        <div class="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
            <div class="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
                <h1 class="mt-10 text-4xl font-bold tracking-tight text-white sm:text-6xl">Seamless data sync for modern
                    apps
                </h1>
                <p class="mt-6 text-lg leading-8 text-gray-300">Build powerful offline-first applications with automatic
                    data synchronization. PocketSync handles the complexity of data sync, so you can focus on building great
                    features.
                </p>
                <div class="mt-10 flex items-center gap-x-6">
                    <NuxtLink to="/auth/register"
                        class="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-primary-600 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all duration-300 hover:scale-105">
                        Get started
                    </NuxtLink>
                    <NuxtLink to="https://docs.pocketsync.dev" class="text-sm font-semibold leading-6 text-white group transition-all duration-300">
                        Documentation
                        <span aria-hidden="true" class="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </NuxtLink>
                </div>
            </div>

            <div
                class="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mt-0 lg:mr-0 lg:max-w-none lg:flex-none xl:ml-32">
                <div class="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
                    <div class="rounded-xl bg-white/5 p-2 ring-1 ring-inset ring-white/10 shadow-xl transition-all duration-300 hover:shadow-2xl hover:bg-white/10">
                        <div class="rounded-md bg-gray-900 p-4">
                            <pre class="text-sm leading-6 text-gray-300"><code>// Initialize PocketSync
await PocketSync.instance.initialize(
  dbPath: path,
  options: PocketSyncOptions(
    projectId: 'your-project-id',
    authToken: 'your-auth-token',
    serverUrl: 'https://api.pocketsync.dev',
  ),
  databaseOptions: DatabaseOptions(
    onCreate: (db, version) async {
      await db.execute(
        'CREATE TABLE todos(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, isCompleted INTEGER)',
      );
    },
  ),
);

// Set user ID - In a real app, this would come from your auth system
await PocketSync.instance.setUserId(userId: 'your-user-id');

// Start syncing
await PocketSync.instance.start();
</code></pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div
            class="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
            <div
                class="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-primary-500 to-primary-200 opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem] animate-pulse">
            </div>
        </div>
    </div>
</template>