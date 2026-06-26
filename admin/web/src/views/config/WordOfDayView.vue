<template>
  <div class="space-y-6">

    <!-- Page header -->
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="text-base font-bold text-ink">Word of Today</h2>
        <p class="text-xs text-ink-muted mt-0.5">Schedule devotional content ahead of time — daily, weekly, or monthly.</p>
      </div>
      <AppButton
        v-if="!showForm"
        @click="openCreateForm"
        size="sm"
      >
        + New entry
      </AppButton>
    </div>

    <!-- Create / Edit form panel -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <AppCard v-if="showForm" class="p-5 space-y-4 border border-primary/20">
        <div class="flex items-center justify-between">
          <p class="text-sm font-bold text-ink">
            {{ editingId ? 'Edit entry' : 'New scheduled entry' }}
          </p>
          <button
            @click="closeForm"
            class="text-ink-muted hover:text-ink transition-colors"
            aria-label="Close form"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Date + Word row -->
        <div class="grid grid-cols-2 gap-4">
          <AppInput
            v-model="form.publishedDate"
            label="Publish date"
            type="date"
            :min="minDate"
            required
          />
          <AppInput
            v-model="form.word"
            label="Word / Title"
            placeholder="e.g. Grace, Redemption, Faith"
            required
          />
        </div>

        <!-- Author + Status row -->
        <div class="grid grid-cols-2 gap-4">
          <AppInput
            v-model="form.author"
            label="Author"
            placeholder="e.g. Pastor Emmanuel"
          />
          <div class="space-y-1">
            <label class="block text-xs font-semibold text-ink-muted uppercase tracking-wide">Status</label>
            <div class="flex gap-2">
              <button
                v-for="s in statusOptions"
                :key="s.value"
                @click="form.status = s.value"
                :class="[
                  'flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors',
                  form.status === s.value
                    ? 'border-primary bg-primary/10 text-primary-soft'
                    : 'border-border text-ink-muted hover:border-primary/30'
                ]"
              >
                {{ s.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Verse -->
        <AppTextarea
          v-model="form.verse"
          label="Scripture"
          placeholder='e.g. "For God so loved the world..." — John 3:16'
          :rows="3"
          :max-length="300"
          required
        />

        <!-- Reflection -->
        <AppTextarea
          v-model="form.reflection"
          label="Devotional reflection"
          placeholder="Write a message that will inspire and encourage your community for this day..."
          :rows="6"
          :max-length="1200"
          required
        />

        <!-- Form error -->
        <p v-if="formError" class="text-xs text-danger">{{ formError }}</p>

        <!-- Form actions -->
        <div class="flex gap-3 justify-end">
          <AppButton variant="ghost" size="sm" @click="closeForm">Cancel</AppButton>
          <AppButton size="sm" :loading="isSaving" @click="onSave">
            {{ editingId ? 'Save changes' : 'Schedule entry' }}
          </AppButton>
        </div>
      </AppCard>
    </Transition>

    <!-- Schedule list -->
    <div class="space-y-3">

      <!-- Loading skeleton -->
      <template v-if="store.isLoading && !schedule.length">
        <div
          v-for="i in 3"
          :key="i"
          class="h-16 rounded-xl bg-surface animate-pulse"
        />
      </template>

      <!-- Empty state -->
      <AppCard v-else-if="!schedule.length" class="p-8 text-center space-y-3">
        <div class="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <svg class="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
        </div>
        <p class="text-sm font-semibold text-ink">No entries scheduled yet</p>
        <p class="text-xs text-ink-muted max-w-xs mx-auto">
          Create entries in advance so your community always has a word for today — even months from now.
        </p>
        <div class="pt-1">
          <AppButton size="sm" @click="openCreateForm">Schedule your first entry</AppButton>
        </div>
      </AppCard>

      <!-- Month groups -->
      <template v-else>
        <div v-for="(group, month) in groupedSchedule" :key="month" class="space-y-2">
          <!-- Month label -->
          <div class="flex items-center gap-3 px-1">
            <div class="h-px flex-1 bg-border" />
            <span class="text-[10px] font-bold text-ink-muted uppercase tracking-widest">{{ month }}</span>
            <div class="h-px flex-1 bg-border" />
          </div>

          <!-- Entry rows -->
          <div
            v-for="entry in group"
            :key="entry.id"
            :class="[
              'flex items-start gap-4 p-4 rounded-xl border transition-colors',
              isToday(entry.publishedDate)
                ? 'border-primary/40 bg-primary/5'
                : 'border-border bg-surface hover:border-primary/20',
            ]"
          >
            <!-- Date badge -->
            <div
              :class="[
                'shrink-0 w-12 text-center rounded-lg py-1.5 border',
                isToday(entry.publishedDate)
                  ? 'bg-primary/20 border-primary/40'
                  : isPast(entry.publishedDate)
                  ? 'bg-surface border-border'
                  : 'bg-surface border-border',
              ]"
            >
              <p :class="['text-base font-black leading-none', isToday(entry.publishedDate) ? 'text-primary-soft' : 'text-ink']">
                {{ formatDay(entry.publishedDate) }}
              </p>
              <p class="text-[9px] font-bold uppercase tracking-wide text-ink-muted mt-0.5">
                {{ formatWeekday(entry.publishedDate) }}
              </p>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-bold text-ink">{{ entry.word }}</p>
                <!-- Status pill -->
                <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-full border', statusStyle(entry)]">
                  {{ statusLabel(entry) }}
                </span>
              </div>
              <p class="text-xs text-ink-muted mt-0.5 line-clamp-1 italic">{{ entry.verse }}</p>
              <p v-if="entry.author" class="text-[10px] text-ink-muted mt-0.5">— {{ entry.author }}</p>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                @click="openEditForm(entry)"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted hover:text-primary hover:bg-primary/10 transition-colors"
                title="Edit"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
              <button
                @click="confirmDelete(entry)"
                class="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted hover:text-danger hover:bg-danger/10 transition-colors"
                title="Delete"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Delete confirm modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150"
        leave-to-class="opacity-0"
      >
        <div
          v-if="deleteTarget"
          class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70"
          @click.self="deleteTarget = null"
        >
          <div class="w-full max-w-sm bg-[#14111f] border border-border rounded-2xl p-6 space-y-4 shadow-2xl">
            <p class="text-base font-bold text-ink">Delete this entry?</p>
            <p class="text-sm text-ink-muted">
              The word for <strong class="text-ink">{{ formatFullDate(deleteTarget.publishedDate) }}</strong>
              (<em>{{ deleteTarget.word }}</em>) will be permanently removed.
            </p>
            <div class="flex gap-3 justify-end">
              <AppButton variant="ghost" size="sm" @click="deleteTarget = null">Cancel</AppButton>
              <AppButton
                variant="danger"
                size="sm"
                :loading="isDeleting"
                @click="onDelete"
              >
                Delete
              </AppButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useConfigStore } from '@/stores/config.store';
import { useUiStore } from '@/stores/ui.store';
import AppCard from '@/components/ui/AppCard.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppButton from '@/components/ui/AppButton.vue';
import type { WordOfDay } from '@/api/types';

const store = useConfigStore();
const ui = useUiStore();

// ─── Date helpers ─────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0]!;
const minDate = today;

function isToday(dateStr: string) { return dateStr === today; }
function isPast(dateStr: string) { return dateStr < today; }

function formatDay(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').getDate().toString();
}

function formatWeekday(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}

function formatMonthYear(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

// ─── Schedule data ────────────────────────────────────────────────────────────

const schedule = computed(() => store.wordSchedule);

const groupedSchedule = computed(() => {
  const groups: Record<string, WordOfDay[]> = {};
  for (const entry of schedule.value) {
    const key = formatMonthYear(entry.publishedDate);
    if (!groups[key]) groups[key] = [];
    groups[key]!.push(entry);
  }
  return groups;
});

// ─── Status helpers ───────────────────────────────────────────────────────────

const statusOptions = [
  { value: 'published' as const, label: 'Published' },
  { value: 'draft'     as const, label: 'Draft'     },
];

function statusLabel(entry: WordOfDay): string {
  if (entry.status === 'draft') return 'Draft';
  if (isToday(entry.publishedDate)) return 'Today';
  if (isPast(entry.publishedDate)) return 'Past';
  return 'Upcoming';
}

function statusStyle(entry: WordOfDay): string {
  if (entry.status === 'draft') return 'text-amber-400 border-amber-400/20 bg-amber-400/10';
  if (isToday(entry.publishedDate)) return 'text-primary-soft border-primary/30 bg-primary/10';
  if (isPast(entry.publishedDate)) return 'text-ink-muted border-border bg-transparent';
  return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10';
}

// ─── Form state ───────────────────────────────────────────────────────────────

const showForm  = ref(false);
const editingId = ref<string | null>(null);
const isSaving  = ref(false);
const formError = ref('');

const emptyForm = () => ({
  word:          '',
  verse:         '',
  reflection:    '',
  author:        '',
  publishedDate: today,
  status:        'published' as const,
});

const form = ref(emptyForm());

function openCreateForm() {
  editingId.value = null;
  form.value = emptyForm();
  formError.value = '';
  showForm.value = true;
}

function openEditForm(entry: WordOfDay) {
  editingId.value = entry.id ?? null;
  form.value = {
    word:          entry.word,
    verse:         entry.verse,
    reflection:    entry.reflection,
    author:        entry.author ?? '',
    publishedDate: entry.publishedDate,
    status:        entry.status ?? 'published',
  };
  formError.value = '';
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingId.value = null;
  formError.value = '';
}

async function onSave() {
  const { word, verse, reflection, publishedDate, status } = form.value;

  if (!word.trim())         { formError.value = 'Word or title is required.'; return; }
  if (!verse.trim())        { formError.value = 'Scripture is required.'; return; }
  if (!reflection.trim())   { formError.value = 'Reflection is required.'; return; }
  if (!publishedDate)       { formError.value = 'Publish date is required.'; return; }

  formError.value = '';
  isSaving.value = true;

  const payload = {
    word:          word.trim(),
    verse:         verse.trim(),
    reflection:    reflection.trim(),
    author:        form.value.author.trim() || null,
    publishedDate,
    status,
  };

  try {
    if (editingId.value) {
      await store.editWordEntry(editingId.value, payload);
      ui.addToast({ tone: 'success', title: 'Entry updated' });
    } else {
      await store.addWordEntry(payload);
      ui.addToast({ tone: 'success', title: 'Entry scheduled', message: `Word for ${formatFullDate(publishedDate)}` });
    }
    closeForm();
  } catch (e) {
    ui.addToast({ tone: 'error', title: e instanceof Error ? e.message : 'Failed to save entry' });
  } finally {
    isSaving.value = false;
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

const deleteTarget = ref<WordOfDay | null>(null);
const isDeleting   = ref(false);

function confirmDelete(entry: WordOfDay) {
  deleteTarget.value = entry;
}

async function onDelete() {
  if (!deleteTarget.value?.id) return;
  isDeleting.value = true;
  try {
    await store.removeWordEntry(deleteTarget.value.id);
    ui.addToast({ tone: 'success', title: 'Entry deleted' });
    deleteTarget.value = null;
  } catch (e) {
    ui.addToast({ tone: 'error', title: e instanceof Error ? e.message : 'Delete failed' });
  } finally {
    isDeleting.value = false;
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await store.fetchWordSchedule();
});
</script>
