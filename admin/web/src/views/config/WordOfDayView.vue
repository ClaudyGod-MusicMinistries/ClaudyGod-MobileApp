<template>
  <div class="max-w-2xl mx-auto space-y-5">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-bold text-ink">Word of the day</h2>
      <AppButton :loading="store.isSaving" @click="onSave">Save</AppButton>
    </div>

    <AppCard class="p-5 space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <AppInput v-model="form.word" label="Word" placeholder="e.g. Grace" required />
        <AppInput v-model="form.publishedDate" label="Date" type="date" required />
      </div>
      <AppInput v-model="form.author" label="Author" placeholder="e.g. Pastor John" />
      <AppTextarea
        v-model="form.verse"
        label="Bible verse"
        placeholder="Scripture reference and text…"
        :rows="3"
        :max-length="200"
        required
      />
      <AppTextarea
        v-model="form.reflection"
        label="Reflection"
        placeholder="Devotional reflection text…"
        :rows="6"
        :max-length="1000"
        required
      />
    </AppCard>

    <!-- Preview -->
    <AppCard class="p-5 space-y-3">
      <p class="text-xs font-bold text-ink-muted uppercase tracking-wide">Preview</p>
      <h3 class="text-2xl font-bold text-ink font-display">{{ form.word || 'Word' }}</h3>
      <p class="text-sm text-primary-soft italic border-l-2 border-primary pl-3">{{ form.verse || 'Verse will appear here…' }}</p>
      <p class="text-sm text-ink-soft leading-relaxed">{{ form.reflection || 'Reflection will appear here…' }}</p>
      <p v-if="form.author" class="text-xs text-ink-muted">— {{ form.author }}</p>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useConfigStore } from '@/stores/config.store';
import { useUiStore } from '@/stores/ui.store';
import AppCard from '@/components/ui/AppCard.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppButton from '@/components/ui/AppButton.vue';

const store = useConfigStore();
const ui = useUiStore();

const today = new Date().toISOString().split('T')[0];
const form = ref({ word: '', verse: '', reflection: '', author: '', publishedDate: today });

onMounted(async () => {
  await store.fetchWordOfDay();
  if (store.wordOfDay) {
    const w = store.wordOfDay;
    form.value = {
      word: w.word,
      verse: w.verse,
      reflection: w.reflection,
      author: w.author ?? '',
      publishedDate: w.publishedDate,
    };
  }
});

async function onSave(): Promise<void> {
  const { word, verse, reflection, publishedDate } = form.value;
  if (!word.trim()) { ui.addToast({ tone: 'error', title: 'Word is required' }); return; }
  if (!verse.trim()) { ui.addToast({ tone: 'error', title: 'Bible verse is required' }); return; }
  if (!reflection.trim()) { ui.addToast({ tone: 'error', title: 'Reflection is required' }); return; }
  if (!publishedDate) { ui.addToast({ tone: 'error', title: 'Date is required' }); return; }
  try {
    await store.saveWordOfDay({
      word: word.trim(),
      verse: verse.trim(),
      reflection: reflection.trim(),
      author: form.value.author.trim() || null,
      publishedDate,
    });
    ui.addToast({ tone: 'success', title: 'Word of the day saved' });
  } catch (e) {
    ui.addToast({ tone: 'error', title: e instanceof Error ? e.message : 'Save failed' });
  }
}
</script>
