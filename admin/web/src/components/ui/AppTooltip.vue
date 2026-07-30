<template>
  <span
    ref="trigger"
    class="relative inline-flex"
    @mouseenter="open = true"
    @mouseleave="open = false"
    @focusin="open = true"
    @focusout="open = false"
    @keydown.esc="open = false"
  >
    <slot />
    <Transition name="tooltip">
      <span
        v-if="open"
        :id="tooltipId"
        role="tooltip"
        :class="['pointer-events-none absolute z-[80] w-max max-w-64 rounded-lg border border-border-strong bg-surface-strong px-2.5 py-1.5 text-xs font-medium leading-snug text-ink shadow-panel', positionClass]"
      >
        {{ text }}
      </span>
    </Transition>
  </span>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

const props = withDefaults(defineProps<{
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}>(), { position: 'bottom' });

const open = ref(false);
const trigger = ref<HTMLElement | null>(null);
const tooltipId = `tooltip-${crypto.randomUUID()}`;

onMounted(() => {
  const target = trigger.value?.firstElementChild;
  if (target) target.setAttribute('aria-describedby', tooltipId);
});

const positionClass = computed(() => ({
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
}[props.position]));
</script>

<style scoped>
.tooltip-enter-active, .tooltip-leave-active { transition: opacity var(--motion-fast), transform var(--motion-fast); }
.tooltip-enter-from, .tooltip-leave-to { opacity: 0; transform: translateY(2px); }
</style>
