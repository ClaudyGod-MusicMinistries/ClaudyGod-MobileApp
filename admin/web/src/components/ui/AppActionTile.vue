<template>
  <RouterLink :to="to" class="group flex min-h-28 flex-col justify-between gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-4 transition-base hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-strong hover:[box-shadow:var(--shadow-raised)] focus-visible:outline-offset-2">
    <div :class="['flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)]', iconClass]">
      <slot name="icon" />
    </div>
    <div class="min-w-0">
      <p class="text-sm font-semibold text-ink group-hover:text-primary-soft">{{ label }}</p>
      <p v-if="description" class="mt-1 text-xs leading-5 text-ink-muted">{{ description }}</p>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ to: string; label: string; description?: string; iconClass?: string }>(), { iconClass: 'bg-primary/10 text-primary' });
</script>
