<template>
  <div class="flex flex-wrap items-end justify-between gap-4 pb-1">
    <div class="flex items-center gap-3 min-w-0">
      <div :class="['w-9 h-9 rounded-md border flex items-center justify-center shrink-0', badgeClass]">
        <component :is="iconComponent" class="w-[18px] h-[18px]" :stroke-width="1.8" />
      </div>
      <div class="min-w-0">
        <h2 class="text-lg font-semibold text-ink truncate">{{ title }}</h2>
        <p v-if="subtitle" class="text-xs text-ink-muted mt-1 truncate">{{ subtitle }}</p>
      </div>
    </div>
    <div v-if="$slots.default" class="flex items-center gap-2 shrink-0 flex-wrap justify-end">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  BarChart3, BookOpen, FileText, Inbox, KeyRound, Megaphone,
  Radio, Server, Settings, Smartphone, Trash2, Users, Youtube,
} from 'lucide-vue-next';

const ICONS = {
  content: FileText,
  trash: Trash2,
  requests: Inbox,
  accessReqs: KeyRound,
  live: Radio,
  config: Settings,
  word: BookOpen,
  preview: Smartphone,
  ads: Megaphone,
  users: Users,
  analytics: BarChart3,
  system: Server,
  youtube: Youtube,
};

const props = withDefaults(defineProps<{
  icon: keyof typeof ICONS;
  title: string;
  subtitle?: string;
  // 'youtube' is a deliberate one-off: it references the actual YouTube brand
  // red, not a semantic status color — every other tone stays on the shared
  // primary/danger vocabulary so icon color doesn't become a second accent.
  tone?: 'primary' | 'danger' | 'youtube';
}>(), { tone: 'primary' });

const iconComponent = computed(() => ICONS[props.icon]);

const badgeClass = computed(() => ({
  primary: 'bg-primary/10 text-primary border-primary/15',
  danger: 'bg-danger/10 text-danger border-danger/15',
  youtube: 'bg-red-500/10 text-red-500 border-red-500/15',
}[props.tone]));
</script>
