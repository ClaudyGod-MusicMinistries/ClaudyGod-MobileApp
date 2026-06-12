<template>
  <div class="relative flex items-center">
    <svg class="absolute left-3 w-4 h-4 text-ink-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <input
      :value="modelValue"
      type="search"
      :placeholder="placeholder"
      class="w-full bg-bg-1 border border-border rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/25 transition-all duration-150"
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
import { useThrottleFn } from '@vueuse/core';

const props = withDefaults(defineProps<{
  modelValue: string;
  placeholder?: string;
  debounceMs?: number;
}>(), { placeholder: 'Search…', debounceMs: 320 });

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();

const emitThrottled = useThrottleFn((v: string) => emit('update:modelValue', v), props.debounceMs);

function onInput(evt: Event): void {
  emitThrottled((evt.target as HTMLInputElement).value);
}
</script>
