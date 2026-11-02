export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: false },
  css: ['~/assets/main.css'],
  typescript: { typeCheck: true },
  app: { head: { title: 'Autoharness verification', meta: [{ name: 'description', content: 'Verification results of Kani automatically generated harnesses for the Rust standard library, run by run.' }] } },
  nitro: { prerender: { routes: ['/', '/harnesses'] } }
});
