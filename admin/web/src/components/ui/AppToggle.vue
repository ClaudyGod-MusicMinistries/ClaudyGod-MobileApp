<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :class="[
      'relative inline-flex h-6 w-11 items-center rounded-full border transition-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60',
      modelValue ? 'bg-primary border-primary' : 'bg-bg-3 border-border-strong',
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    ]"
    :disabled="disabled"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span
      :class="[
        'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
        modelValue ? 'translate-x-6' : 'translate-x-1',
      ]"
    />
  </button>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean; disabled?: boolean }>();
defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();
</script>
