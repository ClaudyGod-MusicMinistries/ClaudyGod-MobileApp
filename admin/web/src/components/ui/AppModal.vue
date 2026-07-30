<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="presentation"
        @click.self="!persistent && $emit('update:modelValue', false)"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="!persistent && $emit('update:modelValue', false)" />

        <!-- Panel -->
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          tabindex="-1"
          :class="[
            'app-overlay-shadow relative z-10 w-full bg-surface-strong border border-border-strong rounded-[var(--radius-panel)] flex flex-col max-h-[min(90vh,56rem)] overflow-hidden',
            sizeClass,
          ]"
          @keydown="onKeydown"
        >
          <!-- Header -->
          <div v-if="title || $slots.header" class="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
            <slot name="header">
              <h2 :id="titleId" class="text-base font-semibold text-ink">{{ title }}</h2>
            </slot>
            <button
              v-if="!persistent"
              type="button"
              class="p-1.5 rounded-lg hover:bg-surface-hover text-ink-muted transition-colors"
              aria-label="Close dialog"
              @click="$emit('update:modelValue', false)"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-5">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="flex-shrink-0 px-6 py-4 border-t border-border">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { X } from 'lucide-vue-next';

const props = withDefaults(defineProps<{
  modelValue: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  persistent?: boolean;
}>(), { size: 'md' });

const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();
const panel = ref<HTMLElement | null>(null);
const titleId = `modal-title-${crypto.randomUUID()}`;
let previouslyFocused: HTMLElement | null = null;

const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

watch(() => props.modelValue, async (open) => {
  if (open) {
    previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    await nextTick();
    (panel.value?.querySelector<HTMLElement>('[autofocus]') ?? panel.value?.querySelector<HTMLElement>(focusableSelector) ?? panel.value)?.focus();
  } else {
    document.body.style.overflow = '';
    previouslyFocused?.focus();
  }
}, { immediate: true });

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && !props.persistent) {
    event.preventDefault();
    emit('update:modelValue', false);
    return;
  }
  if (event.key !== 'Tab' || !panel.value) return;
  const focusable = [...panel.value.querySelectorAll<HTMLElement>(focusableSelector)];
  if (!focusable.length) { event.preventDefault(); panel.value.focus(); return; }
  const first = focusable[0]!;
  const last = focusable[focusable.length - 1]!;
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

onBeforeUnmount(() => { document.body.style.overflow = ''; });

const sizeClass = computed(() => ({
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}[props.size]));
</script>
