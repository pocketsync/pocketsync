<template>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">Get in Touch</h1>

        <div class="space-y-8">

            <!-- Additional Contact Information -->
            <div class="bg-white shadow rounded-lg p-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">Reach Us</h2>
                <div class="space-y-4">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">Support</h3>
                        <p class="mt-2 text-gray-600">For technical support, please visit our <NuxtLink to="https://docs.pocktsync.dev"
                                class="text-blue-600 hover:text-blue-800">documentation</NuxtLink> or email us at
                            support@pocketsync.dev</p>
                    </div>
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">Business Inquiries</h3>
                        <p class="mt-2 text-gray-600">For business and partnership inquiries, please email us at
                            business@pocketsync.dev</p>
                    </div>
                    <div>
                        <h3 class="text-lg font-medium text-gray-900">Office Hours</h3>
                        <p class="mt-2 text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM (PST)</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
const form = ref({
    name: '',
    email: '',
    subject: '',
    message: ''
})

const handleSubmit = () => {
    // TODO: Implement form submission logic
    console.log('Form submitted:', form.value)
}

definePageMeta({
    layout: 'default'
})
</script>
