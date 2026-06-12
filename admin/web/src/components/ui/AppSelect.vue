<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" :for="id" class="text-xs font-semibold text-ink-soft uppercase tracking-wide">
      {{ label }}<span v-if="required" class="text-danger ml-0.5">*</span>
    </label>
    <select
      :id="id"
      :value="modelValue"
      :disabled="disabled"
      :required="required"
      :class="[
        'w-full bg-bg-1 border rounded-xl text-ink text-sm px-3.5 py-2.5 appearance-none transition-all duration-150 cursor-pointer',
        'focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/25',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        error ? 'border-danger/60' : 'border-border',
      ]"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" disabled :selected="!modelValue">{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
    <p v-if="error" class="text-xs text-danger">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string | number;
  label?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  id?: string;
}>();

defineEmits<{ (e: 'update:modelValue', value: string): void }>();
</script>
