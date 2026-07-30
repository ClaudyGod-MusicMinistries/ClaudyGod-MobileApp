<template>
  <section :aria-labelledby="headingId" :class="['min-w-0', padded && 'rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:p-5 app-card']">
    <div v-if="title || $slots.heading || $slots.actions" class="mb-3.5 flex items-start justify-between gap-4">
      <slot name="heading">
        <div class="min-w-0">
          <h2 :id="headingId" class="text-sm font-semibold text-ink">{{ title }}</h2>
          <p v-if="description" class="mt-1 text-xs leading-5 text-ink-muted">{{ description }}</p>
        </div>
      </slot>
      <div v-if="$slots.actions" class="shrink-0"><slot name="actions" /></div>
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ title?: string; description?: string; padded?: boolean }>(), { padded: false });
const headingId = `section-${crypto.randomUUID()}`;
void props;
</script>
