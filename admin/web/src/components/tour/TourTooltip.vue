<template>
  <div
    class="fixed z-[101] w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-surface-strong backdrop-blur-xs shadow-panel p-4 transition-all duration-slow ease-swift"
    :style="tooltipStyle"
  >
    <p class="text-[11px] font-semibold text-primary-soft uppercase tracking-wide mb-1.5">
      Step {{ stepIndex + 1 }} of {{ stepCount }}
    </p>
    <h3 class="text-sm font-bold text-ink mb-1.5">{{ step.title }}</h3>
    <p class="text-sm font-normal text-ink-soft leading-relaxed mb-4">{{ step.body }}</p>

    <div class="flex items-center justify-between gap-2">
      <AppButton variant="ghost" size="xs" label="Skip" @click="$emit('skip')" />
      <div class="flex items-center gap-2">
        <AppButton v-if="stepIndex > 0" variant="secondary" size="xs" label="Back" @click="$emit('prev')" />
        <AppButton
          variant="primary"
          size="xs"
          :label="stepIndex === stepCount - 1 ? 'Finish' : 'Next'"
          @click="$emit('next')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import type { TourStep } from '@/composables/useOnboardingTour';

const props = defineProps<{
  step: TourStep;
  rect: DOMRect | null;
  stepIndex: number;
  stepCount: number;
}>();

defineEmits<{ (e: 'next'): void; (e: 'prev'): void; (e: 'skip'): void }>();

const GAP = 14;
const VIEWPORT_MARGIN = 16;
const TOOLTIP_WIDTH = 320;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

const tooltipStyle = computed(() => {
  const r = props.rect;
  if (!r) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }

  const placement = props.step.placement ?? 'bottom';
  const maxLeft = window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN;
  const clampedLeft = clamp(r.left, VIEWPORT_MARGIN, maxLeft);

  switch (placement) {
    case 'top':
      return { bottom: `${window.innerHeight - r.top + GAP}px`, left: `${clampedLeft}px` };
    case 'left':
      return { right: `${window.innerWidth - r.left + GAP}px`, top: `${r.top + r.height / 2}px`, transform: 'translateY(-50%)' };
    case 'right':
      return { left: `${r.right + GAP}px`, top: `${r.top + r.height / 2}px`, transform: 'translateY(-50%)' };
    case 'bottom':
    default:
      return { top: `${r.bottom + GAP}px`, left: `${clampedLeft}px` };
  }
});
</script>
