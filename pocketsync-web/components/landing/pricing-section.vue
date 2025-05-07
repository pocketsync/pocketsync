<template>
  <section id="pricing" class="py-16 md:py-24 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-white relative overflow-hidden">
    <!-- Decorative elements -->
    <div class="absolute top-1/4 left-1/3 w-72 h-72 bg-primary-600/5 dark:bg-primary-600/10 rounded-full blur-[120px] -z-1"></div>
    <div class="absolute bottom-1/3 right-1/4 w-80 h-80 bg-primary-400/5 dark:bg-primary-400/10 rounded-full blur-[100px] -z-1"></div>
    
    <div class="container mx-auto px-4 relative z-10">
      <!-- Section header with gradient text -->
      <div class="max-w-3xl mx-auto text-center mb-16">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-3">Pricing</h2>
        <h3 class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-6">Free during our beta phase</h3>
        <p class="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">We're currently offering PocketSync completely free while we refine our platform. Enjoy all features without any cost until we reach stable release.</p>
      </div>

      <!-- Pricing card with modern design -->
      <div class="max-w-xl mx-auto relative">
        <!-- Card background with subtle animation -->
        <div class="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-primary-600/10 dark:from-primary-500/10 dark:to-primary-600/20 rounded-2xl transform rotate-1 scale-[1.02] opacity-70 transition-all duration-700 group-hover:scale-[1.03] group-hover:rotate-2"></div>
        
        <div class="relative group bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-500 hover:border-primary-500/50 dark:hover:border-primary-500/70">
          <!-- Special offer banner -->
          <div class="bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3 px-6 text-center">
            <p class="font-semibold">🎉 Free for everyone during beta!</p>
          </div>
          
          <!-- Card content -->
          <div class="p-8 md:p-10">
            <!-- Featured message -->
            <div class="mb-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 p-6 text-center shadow-sm transition-all duration-300 hover:shadow-md border border-primary-100 dark:border-primary-800/50">
              <p class="text-xl font-semibold text-primary-700 dark:text-primary-300 mb-2">Early Access Pass</p>
              <p class="text-gray-600 dark:text-gray-300">Get all features with no limitations. We'll provide plenty of notice before introducing any paid plans.</p>
            </div>
            
            <!-- Features list -->
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">All features included</h3>
            <ul role="list" class="space-y-4 mb-8">
              <li class="flex items-start gap-x-3 p-3 rounded-lg transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div class="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                  <svg class="h-4 w-4 text-primary-600 dark:text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                  </svg>
                </div>
                <span class="text-gray-700 dark:text-gray-200 font-medium">Unlimited syncs</span>
              </li>
              <li class="flex items-start gap-x-3 p-3 rounded-lg transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div class="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                  <svg class="h-4 w-4 text-primary-600 dark:text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                  </svg>
                </div>
                <span class="text-gray-700 dark:text-gray-200 font-medium">Advanced conflict resolution</span>
              </li>
              <li class="flex items-start gap-x-3 p-3 rounded-lg transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div class="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                  <svg class="h-4 w-4 text-primary-600 dark:text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                  </svg>
                </div>
                <span class="text-gray-700 dark:text-gray-200 font-medium">Priority support</span>
              </li>
              <li class="flex items-start gap-x-3 p-3 rounded-lg transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div class="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                  <svg class="h-4 w-4 text-primary-600 dark:text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                  </svg>
                </div>
                <span class="text-gray-700 dark:text-gray-200 font-medium">Custom integrations</span>
              </li>
            </ul>
            
            <!-- CTA button -->
            <div class="text-center">
              <NuxtLink to="/auth/register" class="inline-block w-full py-3 px-6 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] transition-all duration-300 border border-primary-500/50">
                Get started for free
              </NuxtLink>
              <p class="mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>