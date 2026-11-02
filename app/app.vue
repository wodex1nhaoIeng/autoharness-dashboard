<template>
  <header class="site-header">
    <nav class="tabs" aria-label="Main navigation">
      <NuxtLink to="/">Summary</NuxtLink>
      <NuxtLink to="/harnesses">Harnesses</NuxtLink>
    </nav>
  </header>
  <NuxtPage />
</template>

<style scoped>
.site-header { padding: 8px 16px 0; background: var(--header-bg); border-bottom: 1px solid var(--border); }
@media (min-width: 768px) { .site-header { padding: 8px 32px 0; } }
.tabs { display: flex; gap: 8px; max-width: 1280px; margin: 0 auto; }
.tabs a { padding: 8px 8px 10px; border-bottom: 2px solid transparent; color: var(--fg); }
.tabs a:hover { text-decoration: none; border-color: var(--border); }
.tabs a.router-link-exact-active { border-color: #fd8c73; font-weight: 600; }
</style>
