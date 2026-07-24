<template>
  <div class="space-y-5">
    <WebPageHeader :icon="MessageSquare" title="Journal comments" subtitle="Moderate comments left on Journal posts" />

    <AppCard class="p-4">
      <div class="flex gap-2 flex-wrap">
        <AppButton
          v-for="s in statusFilters"
          :key="s.value"
          :variant="store.statusFilter === s.value ? 'primary' : 'secondary'"
          size="xs"
          @click="store.setStatusFilter(s.value || undefined)"
        >
          {{ s.label }}
        </AppButton>
      </div>
    </AppCard>

    <AppCard>
      <AppResponsiveTable :columns="columns" :rows="rows" :loading="store.isLoading">
        <template #cell-author="{ row }">
          <div>
            <p class="text-sm font-medium text-ink">{{ row.authorName }}</p>
            <p class="text-xs text-ink-muted">{{ row.authorEmail }}</p>
          </div>
        </template>
        <template #cell-content="{ row }">
          <div class="flex items-center gap-2">
            <ReplyIcon v-if="row.parentCommentId" class="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />
            <p class="text-sm text-ink-soft max-w-sm truncate">{{ row.content }}</p>
          </div>
        </template>
        <template #cell-blogPostTitle="{ value }">
          <span class="text-xs text-ink-muted max-w-[10rem] truncate inline-block align-bottom">{{ value }}</span>
        </template>
        <template #cell-status="{ row }">
          <AppSelect
            :model-value="row.status as string"
            :options="statusOptions"
            class="w-32"
            @update:model-value="(v) => changeStatus(row as unknown as AdminComment, v)"
          />
        </template>
        <template #cell-createdAt="{ value }">
          <span class="text-xs text-ink-muted">{{ formatDate(value as string) }}</span>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <AppButton variant="secondary" size="xs" @click="openDetail(row as unknown as AdminComment)">View</AppButton>
            <AppButton variant="danger" size="xs" @click="confirmDelete(row as unknown as AdminComment)">Delete</AppButton>
          </div>
        </template>
      </AppResponsiveTable>
    </AppCard>

    <AppPagination :page="store.page" :page-size="store.pageSize" :total="store.total" @change="store.setPage" />

    <AppModal v-model="detailOpen" title="Comment" size="md">
      <div v-if="selected" class="space-y-3 text-sm">
        <div>
          <p class="text-xs font-semibold text-ink-soft uppercase tracking-wide">From</p>
          <p class="text-ink">{{ selected.authorName }} — {{ selected.authorEmail }}</p>
        </div>
        <div>
          <p class="text-xs font-semibold text-ink-soft uppercase tracking-wide">Post</p>
          <p class="text-ink">{{ selected.blogPostTitle }}</p>
        </div>
        <div v-if="selected.parentCommentId">
          <AppBadge tone="neutral">Reply to another comment</AppBadge>
        </div>
        <div>
          <p class="text-xs font-semibold text-ink-soft uppercase tracking-wide">Comment</p>
          <p class="text-ink-soft whitespace-pre-wrap">{{ selected.content }}</p>
        </div>
        <div class="pt-2">
          <AppButton size="sm" tag="a" :href="`mailto:${selected.authorEmail}`">Reply by email</AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { MessageSquare, CornerDownRight as ReplyIcon } from 'lucide-vue-next';
import { useCommentsStore } from '@/stores/website/comments.store';
import { useUiStore } from '@/stores/ui.store';
import type { AdminComment } from '@/api/websiteTypes';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import WebPageHeader from '@/components/shared/WebPageHeader.vue';

const store = useCommentsStore();
const ui = useUiStore();

onMounted(() => { void store.fetchComments(); });

const rows = computed(() => store.items as unknown as Record<string, unknown>[]);

const columns = [
  { key: 'author', label: 'From' },
  { key: 'content', label: 'Comment' },
  { key: 'blogPostTitle', label: 'Post' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Received', align: 'right' as const },
];

const statusFilters = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: '', label: 'All' },
];
const statusOptions = statusFilters.filter((s) => s.value);

async function changeStatus(comment: AdminComment, status: string | number): Promise<void> {
  try {
    await store.changeStatus(comment.id, String(status));
    ui.addToast({ tone: 'success', title: 'Status updated' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Status update failed', message: e instanceof Error ? e.message : 'Please try again' });
    return;
  }

  // Status change already applied above — this only offers the *optional*
  // extra step of also moving it to Trash. Canceling here never undoes the
  // status change, and the explicit Delete button below stays as the
  // one-click path regardless of status.
  if (String(status) === 'Rejected') {
    const alsoTrash = await ui.confirm({
      title: 'Move to trash?',
      message: `This comment from ${comment.authorName} was rejected. Move it to Trash as well? You can restore it anytime within 30 days.`,
      confirmLabel: 'Move to trash',
      cancelLabel: 'Keep in Comments',
      tone: 'danger',
    });
    if (alsoTrash) {
      try {
        await store.removeComment(comment.id);
        ui.addToast({ tone: 'success', title: 'Moved to trash' });
      } catch (e) {
        ui.addToast({ tone: 'danger', title: 'Move to trash failed', message: e instanceof Error ? e.message : 'Please try again' });
      }
    }
  }
}

const detailOpen = ref(false);
const selected = ref<AdminComment | null>(null);

function openDetail(comment: AdminComment): void {
  selected.value = comment;
  detailOpen.value = true;
}

async function confirmDelete(comment: AdminComment): Promise<void> {
  const ok = await ui.confirm({
    title: 'Delete comment',
    message: `Delete this comment from ${comment.authorName}? Any replies to it will be deleted too. This can't be undone.`,
    confirmLabel: 'Delete',
    tone: 'danger',
  });
  if (!ok) return;
  try {
    await store.removeComment(comment.id);
    ui.addToast({ tone: 'success', title: 'Comment deleted' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Delete failed', message: e instanceof Error ? e.message : 'Please try again' });
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>
