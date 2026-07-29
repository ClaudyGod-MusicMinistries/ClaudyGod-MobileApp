<template>
  <div class="space-y-5">
    <WebPageHeader :icon="HelpCircle" title="FAQs" subtitle="Shown on the Help page, grouped by category">
      <AppButton size="sm" @click="openCreate">
        <template #icon><Plus class="w-4 h-4" /></template>
        New FAQ
      </AppButton>
    </WebPageHeader>

    <AppCard>
      <AppResponsiveTable :columns="columns" :rows="rows" :loading="store.isLoading">
        <template #cell-question="{ row }">
          <p class="text-sm font-medium text-ink max-w-md truncate">{{ row.question }}</p>
        </template>
        <template #cell-category="{ value }">
          <AppBadge tone="neutral">{{ value }}</AppBadge>
        </template>
        <template #cell-order="{ value }">
          <span class="text-xs text-ink-muted tabular-nums">{{ value }}</span>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <AppButton variant="secondary" size="xs" @click="openEdit(row as unknown as Faq)">Edit</AppButton>
            <AppButton variant="danger" size="xs" @click="confirmDelete(row as unknown as Faq)">Delete</AppButton>
          </div>
        </template>
      </AppResponsiveTable>
    </AppCard>

    <AppModal v-model="modalOpen" :title="editingId ? 'Edit FAQ' : 'New FAQ'" size="lg">
      <div class="grid grid-cols-1 gap-4">
        <AppInput v-model="form.category" label="Category" required placeholder="Bookings & Services, Store & Purchases…" />
        <AppInput v-model="form.question" label="Question" required />
        <AppTextarea v-model="form.answer" label="Answer" required :rows="5" />
        <AppInput v-model="form.order" type="number" label="Order" hint="Lower shows first within its category" />
      </div>

      <template #footer>
        <div class="flex gap-2 justify-end">
          <AppButton variant="secondary" size="sm" @click="modalOpen = false">Cancel</AppButton>
          <AppButton size="sm" :loading="saving" @click="save">
            {{ editingId ? 'Save changes' : 'Create FAQ' }}
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { HelpCircle, Plus } from 'lucide-vue-next';
import { useFaqsStore } from '@/stores/website/faqs.store';
import { useUiStore } from '@/stores/ui.store';
import type { Faq, FaqInput } from '@/api/websiteTypes';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import WebPageHeader from '@/components/shared/WebPageHeader.vue';

const store = useFaqsStore();
const ui = useUiStore();

onMounted(() => { void store.fetchFaqs(); });

const rows = computed(() => store.faqs as unknown as Record<string, unknown>[]);

const columns = [
  { key: 'question', label: 'Question' },
  { key: 'category', label: 'Category' },
  { key: 'order', label: 'Order', align: 'right' as const },
];

const modalOpen = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);

interface FaqFormState {
  question: string;
  answer: string;
  category: string;
  order: string;
}

const emptyForm = (): FaqFormState => ({ question: '', answer: '', category: '', order: '0' });

const form = reactive<FaqFormState>(emptyForm());

function openCreate(): void {
  editingId.value = null;
  Object.assign(form, emptyForm());
  modalOpen.value = true;
}

function openEdit(faq: Faq): void {
  editingId.value = faq.id;
  Object.assign(form, {
    question: faq.question,
    answer: faq.answer,
    category: faq.category,
    order: String(faq.order),
  });
  modalOpen.value = true;
}

async function save(): Promise<void> {
  if (!form.question.trim() || !form.answer.trim() || !form.category.trim()) {
    ui.addToast({ tone: 'danger', title: 'Category, question, and answer are required' });
    return;
  }
  saving.value = true;
  try {
    const payload: FaqInput = {
      question: form.question,
      answer: form.answer,
      category: form.category,
      order: Number(form.order) || 0,
    };
    await store.saveFaq(payload, editingId.value ?? undefined);
    ui.addToast({ tone: 'success', title: editingId.value ? 'FAQ updated' : 'FAQ created' });
    modalOpen.value = false;
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Save failed', message: e instanceof Error ? e.message : 'Please try again' });
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(faq: Faq): Promise<void> {
  const ok = await ui.confirm({
    title: 'Delete FAQ',
    message: `Delete "${faq.question}"? This can't be undone.`,
    confirmLabel: 'Delete',
    tone: 'danger',
  });
  if (!ok) return;
  try {
    await store.removeFaq(faq.id);
    ui.addToast({ tone: 'success', title: 'FAQ deleted' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Delete failed', message: e instanceof Error ? e.message : 'Please try again' });
  }
}
</script>
