<template>
  <div class="app-page">
    <header v-if="title || eyebrow || $slots.header" class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <slot name="header">
        <div class="min-w-0">
          <p v-if="eyebrow" class="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">{{ eyebrow }}</p>
          <h1 class="mt-1 text-2xl font-bold tracking-[-0.025em] text-ink sm:text-[1.75rem]">{{ title }}</h1>
          <p v-if="description" class="mt-1.5 max-w-3xl text-sm leading-6 text-ink-muted">{{ description }}</p>
        </div>
      </slot>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2"><slot name="actions" /></div>
    </header>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ title?: string; eyebrow?: string; description?: string }>();
</script>
