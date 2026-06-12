<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" :for="id" class="text-xs font-semibold text-ink-soft uppercase tracking-wide">
      {{ label }}<span v-if="required" class="text-danger ml-0.5">*</span>
    </label>
    <div class="relative flex items-center">
      <span v-if="$slots['prefix']" class="absolute left-3 flex items-center text-ink-muted">
        <slot name="prefix" />
      </span>
      <input
        :id="id"
        v-bind="$attrs"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :class="[
          'w-full bg-bg-1 border rounded-xl text-ink placeholder:text-ink-muted text-sm transition-all duration-150',
          'focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/25',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          $slots['prefix'] ? 'pl-9' : 'pl-3.5',
          $slots['suffix'] ? 'pr-9' : 'pr-3.5',
          'py-2.5',
          error ? 'border-danger/60' : 'border-border',
          sizeClass,
        ]"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="$emit('blur', $event)"
      />
      <span v-if="$slots['suffix']" class="absolute right-3 flex items-center text-ink-muted">
        <slot name="suffix" />
      </span>
    </div>
    <p v-if="error" class="text-xs text-danger">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-ink-muted">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  modelValue?: string | number;
  label?: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md';
  id?: string;
}>(), { type: 'text', size: 'md' });

defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'blur', evt: FocusEvent): void;
}>();

defineOptions({ inheritAttrs: false });

const sizeClass = computed(() => props.size === 'sm' ? 'text-xs' : 'text-sm');
</script>
