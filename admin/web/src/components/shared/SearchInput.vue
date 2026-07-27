<template>
  <div class="relative flex items-center">
    <Search class="absolute left-3 w-4 h-4 text-ink-muted pointer-events-none" />
    <input
      :value="modelValue"
      type="search"
      :placeholder="placeholder"
      class="w-full h-10 bg-surface-strong border border-border rounded-md pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-colors duration-fast"
      @input="onInput"
    />
  </div>
</template>

<script setup lang="ts">
import { useThrottleFn } from '@vueuse/core';
import { Search } from 'lucide-vue-next';

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
