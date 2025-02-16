<template>
  <div>
    <HeroSection />
    <LocalFirstSection />
    <FeaturesSection />
    <PricingSection />
  </div>
</template>

<script setup>
import HeroSection from '~/components/home/hero-section.vue'
import LocalFirstSection from '~/components/home/local-first-section.vue'
import FeaturesSection from '~/components/home/features-section.vue'
import PricingSection from '~/components/home/pricing-section.vue'

definePageMeta({
  layout: 'default',
})
</script>
