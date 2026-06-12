<template>
  <AppBadge :tone="tone">{{ label }}</AppBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppBadge from '@/components/ui/AppBadge.vue';
type BadgeTone = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';

const props = defineProps<{ status: string }>();

const STATUS_MAP: Record<string, { tone: BadgeTone; label?: string }> = {
  // Content
  published:   { tone: 'success', label: 'Published' },
  draft:       { tone: 'neutral', label: 'Draft' },
  // Live
  live:        { tone: 'danger',  label: 'Live' },
  scheduled:   { tone: 'warning', label: 'Scheduled' },
  ended:       { tone: 'neutral', label: 'Ended' },
  // Requests
  submitted:   { tone: 'info',    label: 'Submitted' },
  in_review:   { tone: 'primary', label: 'In review' },
  changes_requested: { tone: 'warning', label: 'Changes needed' },
  approved:    { tone: 'success', label: 'Approved' },
  fulfilled:   { tone: 'success', label: 'Fulfilled' },
  rejected:    { tone: 'danger',  label: 'Rejected' },
  // Support
  open:        { tone: 'info',    label: 'Open' },
  in_progress: { tone: 'primary', label: 'In progress' },
  resolved:    { tone: 'success', label: 'Resolved' },
  closed:      { tone: 'neutral', label: 'Closed' },
  // Ads
  active:      { tone: 'success', label: 'Active' },
  paused:      { tone: 'warning', label: 'Paused' },
  // Health
  ok:          { tone: 'success', label: 'OK' },
  degraded:    { tone: 'warning', label: 'Degraded' },
  error:       { tone: 'danger',  label: 'Error' },
};

const tone = computed<BadgeTone>(() => STATUS_MAP[props.status]?.tone ?? 'neutral');
const label = computed(() => STATUS_MAP[props.status]?.label ?? props.status);
</script>
