<template>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

        <div class="space-y-8 prose prose-blue max-w-none">
            <section>
                <h2 class="font-bold text-xl">Introduction</h2>
                <p>At PocketSync, we take your privacy seriously. This Privacy Policy explains how we collect, use,
                    disclose, and safeguard your information when you use our service. As a platform designed primarily
                    for local-first applications that don't require backend servers, we prioritize data privacy and user
                    control.</p>
            </section>

            <section>
                <h2 class="font-bold text-xl">Information we collect</h2>
                <p>We collect information that you provide directly to us, including:</p>
                <ul>
                    <li>Account information (name, email, password)</li>
                    <li>Usage data and analytics</li>
                    <li>Technical information about your devices and systems</li>
                    <li>Communication data when you contact our support</li>
                </ul>
                <p>For local-first applications using PocketSync, we prioritize user data privacy. Your application's
                    data remains primarily on users' devices, with synchronization occurring directly between devices
                    when possible.</p>
            </section>

            <section>
                <h2 class="font-bold text-xl">How we use your information</h2>
                <p>We use the collected information for:</p>
                <ul>
                    <li>Providing and maintaining our services</li>
                    <li>Improving and personalizing user experience</li>
                    <li>Analyzing usage patterns and trends</li>
                    <li>Communicating with you about updates and support</li>
                </ul>
            </section>

            <section>
                <h2 class="font-bold text-xl">Data security</h2>
                <p>We implement appropriate technical and organizational measures to protect your data against
                    unauthorized access, alteration, disclosure, or destruction.</p>
                <p>For local applications using PocketSync (such as note-taking apps, personal trackers, and other
                    user-centric tools), we employ end-to-end encryption for data synchronization, ensuring that user
                    data remains private and secure even during the sync process.</p>
            </section>

            <section>
                <h2 class="font-bold text-xl">Your rights</h2>
                <p>You have the right to:</p>
                <ul>
                    <li>Access your personal data</li>
                    <li>Correct inaccurate data</li>
                    <li>Request deletion of your data</li>
                    <li>Object to data processing</li>
                    <li>Data portability</li>
                </ul>
            </section>

            <section>
                <h2 class="font-bold text-xl">Updates to this policy</h2>
                <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the
                    new Privacy Policy on this page and updating the effective date.</p>
            </section>

            <section>
                <h2>Contact us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us at <a
                        href="mailto:hello@pocketsync.dev" class="text-primary font-semibold">hello@pocketsync.dev</a></p>
            </section>
        </div>
    </div>
</template>

<script setup>
definePageMeta({
    layout: 'default'
})
</script>
