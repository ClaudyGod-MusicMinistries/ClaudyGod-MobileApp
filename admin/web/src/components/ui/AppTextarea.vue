<template>
  <div class="flex flex-col gap-1.5">
    <div v-if="label" class="flex items-center justify-between">
      <label :for="id" class="text-xs font-medium text-ink-soft">
        {{ label }}<span v-if="required" class="text-danger ml-0.5">*</span>
      </label>
      <span v-if="maxLength" class="text-xs text-ink-muted">{{ (modelValue || '').length }}/{{ maxLength }}</span>
    </div>
    <textarea
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :maxlength="maxLength"
      :rows="rows"
      :class="[
        'w-full bg-surface-strong border rounded-md text-ink text-sm px-3 py-2.5 resize-y transition-colors duration-fast',
        'placeholder:text-ink-muted',
        'focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/25',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        error ? 'border-danger/60' : 'border-border',
      ]"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <p v-if="error" class="text-xs text-danger">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-ink-muted">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  rows?: number;
  maxLength?: number;
  id?: string;
}>(), { rows: 4 });

defineEmits<{ (e: 'update:modelValue', value: string): void }>();
</script>
