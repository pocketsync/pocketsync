<template>
  <div class="bg-gray-950 min-h-screen text-white">
    <HeroSection />
    <HowItWorksSection />
    <UseCasesSection />
    <KeyFeaturesSection />
    <PricingSection />
    <CtaSection />
  </div>
</template>

<script setup>
import HeroSection from '~/components/landing/hero-section.vue';
import HowItWorksSection from '~/components/landing/how-it-works-section.vue';
import UseCasesSection from '~/components/landing/use-cases-section.vue';
import KeyFeaturesSection from '~/components/landing/key-features-section.vue';
import PricingSection from '~/components/landing/pricing-section.vue';
import CtaSection from '~/components/landing/cta-section.vue';

definePageMeta({
  layout: 'default',
});
</script>
