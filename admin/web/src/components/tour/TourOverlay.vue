<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-base"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-fast"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="tour.state.active" class="fixed inset-0 z-[100]">
        <!-- Click-catcher: blocks interaction with the page underneath for the
             whole tour duration, including the visually undimmed spotlight area. -->
        <div class="absolute inset-0" @click.self="tour.skip()" />

        <!-- Spotlight cutout: a transparent box whose oversized box-shadow dims
             everything else — no canvas/masking dependency needed. -->
        <div
          v-if="rect"
          class="absolute rounded-2xl transition-all duration-slow ease-swift pointer-events-none"
          :style="spotlightStyle"
        />

        <TourTooltip
          v-if="currentStep"
          :step="currentStep"
          :rect="rect"
          :step-index="tour.state.stepIndex"
          :step-count="tour.state.steps.length"
          @next="tour.next()"
          @prev="tour.prev()"
          @skip="tour.skip()"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useEventListener } from '@vueuse/core';
import { useOnboardingTour } from '@/composables/useOnboardingTour';
import TourTooltip from './TourTooltip.vue';

const tour = useOnboardingTour();

const currentStep = computed(() => tour.state.steps[tour.state.stepIndex] ?? null);
const rect = ref<DOMRect | null>(null);

const SPOTLIGHT_PADDING = 8;

function measure(): void {
  const selector = currentStep.value?.target;
  const el = selector ? document.querySelector(selector) : null;
  rect.value = el ? el.getBoundingClientRect() : null;
}

watch([() => tour.state.active, () => tour.state.stepIndex], () => {
  nextTick(measure);
}, { immediate: true });

useEventListener(window, 'resize', measure);
useEventListener(window, 'scroll', measure, { capture: true });

const spotlightStyle = computed(() => {
  if (!rect.value) return {};
  const r = rect.value;
  return {
    top: `${r.top - SPOTLIGHT_PADDING}px`,
    left: `${r.left - SPOTLIGHT_PADDING}px`,
    width: `${r.width + SPOTLIGHT_PADDING * 2}px`,
    height: `${r.height + SPOTLIGHT_PADDING * 2}px`,
    boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
  };
});
</script>
