<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-ink">Social links</h3>
      <AppButton variant="secondary" size="xs" @click="addLink">+ Add</AppButton>
    </div>

    <AppCard v-for="(link, i) in links" :key="i" class="p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <AppInput v-model="link.icon" label="Icon" placeholder="public" />
          <AppInput v-model="link.label" label="Label" placeholder="Website" />
          <AppInput v-model="link.url" label="Link URL" placeholder="https://claudygod.org" />
        </div>
        <AppButton variant="ghost" size="xs" class="text-danger mt-5" @click="removeLink(i)">Remove</AppButton>
      </div>
    </AppCard>

    <AppButton variant="secondary" size="sm" @click="addLink">+ Add social link</AppButton>
  </div>
</template>

<script setup lang="ts">
import type { SocialLink } from '@/api/types';
import AppCard from '@/components/ui/AppCard.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';

const props = defineProps<{
  links: SocialLink[];
}>();

function addLink(): void {
  props.links.push({ icon: 'public', label: 'New link', url: 'https://' });
}

function removeLink(idx: number): void {
  props.links.splice(idx, 1);
}
</script>

