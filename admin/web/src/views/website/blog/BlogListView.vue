<template>
  <div class="space-y-5">
    <WebPageHeader :icon="Newspaper" title="Journal" subtitle="Posts shown on the News/Journal page">
      <AppButton size="sm" @click="openCreate">
        <template #icon><Plus class="w-4 h-4" /></template>
        New post
      </AppButton>
    </WebPageHeader>

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
        <template #cell-title="{ row }">
          <div>
            <p class="text-sm font-medium text-ink max-w-sm truncate">{{ row.title }}</p>
            <p class="text-xs text-ink-muted">/{{ row.slug }}</p>
          </div>
        </template>
        <template #cell-status="{ row }">
          <AppSelect
            :model-value="row.status as string"
            :options="statusOptions"
            class="w-32"
            @update:model-value="(v) => changeStatus(row as unknown as BlogPost, v)"
          />
        </template>
        <template #cell-publishedAt="{ value }">
          <span class="text-xs text-ink-muted">{{ formatDate(value as string | null) }}</span>
        </template>
        <template #cell-viewCount="{ value }">
          <span class="text-xs text-ink-muted tabular-nums">{{ value }}</span>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <AppButton variant="secondary" size="xs" @click="openEdit(row as unknown as BlogPost)">Edit</AppButton>
            <AppButton variant="danger" size="xs" @click="confirmDelete(row as unknown as BlogPost)">Delete</AppButton>
          </div>
        </template>
      </AppResponsiveTable>
    </AppCard>

    <AppPagination :page="store.page" :page-size="store.pageSize" :total="store.total" @change="store.setPage" />

    <AppModal v-model="modalOpen" :title="editingId ? 'Edit post' : 'New post'" size="xl">
      <div class="grid grid-cols-1 gap-4">
        <AppInput :model-value="form.title" label="Title" required @update:model-value="onTitleInput" />
        <AppInput :model-value="form.slug" label="Slug" required hint="URL-friendly, e.g. my-first-post" @update:model-value="onSlugInput" />
        <AppInput v-model="form.authorName" label="Author" />

        <div>
          <p class="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5">Category</p>
          <div class="flex items-center gap-2">
            <AppSelect v-model="form.categoryId" :options="categoryOptions" placeholder="No category" class="flex-1" />
            <AppButton variant="secondary" size="sm" @click="newCategoryOpen = !newCategoryOpen">+ New</AppButton>
          </div>
          <div v-if="newCategoryOpen" class="flex items-center gap-2 mt-2">
            <AppInput v-model="newCategoryName" placeholder="Category name" class="flex-1" size="sm" />
            <AppButton size="sm" :loading="creatingCategory" @click="createCategory">Add</AppButton>
          </div>
        </div>

        <div>
          <p class="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-1.5">Tags</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="tag in store.tags"
              :key="tag.id"
              type="button"
              :class="[
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                form.tagIds.includes(tag.id)
                  ? 'bg-primary/15 border-primary/30 text-primary-soft'
                  : 'bg-white/3 border-border text-ink-muted hover:text-ink-soft',
              ]"
              @click="toggleTag(tag.id)"
            >
              {{ tag.name }}
            </button>
          </div>
          <div class="flex items-center gap-2 mt-2">
            <AppInput v-model="newTagName" placeholder="New tag name" class="flex-1" size="sm" />
            <AppButton variant="secondary" size="sm" :loading="creatingTag" @click="createTag">Add tag</AppButton>
          </div>
        </div>

        <AppTextarea v-model="form.excerpt" label="Excerpt" :rows="2" hint="Short summary shown on the Journal listing" />
        <AppTextarea v-model="form.content" label="Content" required :rows="14" />
        <div v-if="!editingId" class="flex items-center gap-2.5">
          <AppToggle v-model="form.publish" />
          <span class="text-sm text-ink-soft">Publish immediately (otherwise saved as a draft)</span>
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2 justify-end">
          <AppButton variant="secondary" size="sm" @click="modalOpen = false">Cancel</AppButton>
          <AppButton size="sm" :loading="saving" @click="save">
            {{ editingId ? 'Save changes' : 'Create post' }}
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { Newspaper, Plus } from 'lucide-vue-next';
import { useBlogStore } from '@/stores/website/blog.store';
import { useUiStore } from '@/stores/ui.store';
import type { BlogPost, BlogPostInput } from '@/api/websiteTypes';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppSelect from '@/components/ui/AppSelect.vue';
import AppToggle from '@/components/ui/AppToggle.vue';
import AppPagination from '@/components/ui/AppPagination.vue';
import WebPageHeader from '@/components/shared/WebPageHeader.vue';

const store = useBlogStore();
const ui = useUiStore();

onMounted(() => {
  void store.fetchPosts();
  void store.fetchTaxonomy();
});

const categoryOptions = computed(() => store.categories.map((c) => ({ value: c.id, label: c.name })));

const rows = computed(() => store.posts as unknown as Record<string, unknown>[]);

const columns = [
  { key: 'title', label: 'Post' },
  { key: 'status', label: 'Status' },
  { key: 'publishedAt', label: 'Published', align: 'right' as const },
  { key: 'viewCount', label: 'Views', align: 'right' as const },
];

const statusFilters = [
  { value: '', label: 'All' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Published', label: 'Published' },
  { value: 'Archived', label: 'Archived' },
];
const statusOptions = statusFilters.slice(1);

async function changeStatus(post: BlogPost, status: string | number): Promise<void> {
  try {
    await store.changeStatus(post.id, String(status));
    ui.addToast({ tone: 'success', title: 'Status updated' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Status update failed', message: e instanceof Error ? e.message : 'Please try again' });
  }
}

const modalOpen = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const slugManuallyEdited = ref(false);

interface BlogFormState {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  authorName: string;
  categoryId: string;
  tagIds: string[];
  publish: boolean;
}

const emptyForm = (): BlogFormState => ({
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  authorName: '',
  categoryId: '',
  tagIds: [],
  publish: false,
});

const form = reactive<BlogFormState>(emptyForm());

const newCategoryOpen = ref(false);
const newCategoryName = ref('');
const creatingCategory = ref(false);

async function createCategory(): Promise<void> {
  if (!newCategoryName.value.trim()) return;
  creatingCategory.value = true;
  try {
    const category = await store.addCategory(newCategoryName.value.trim());
    form.categoryId = category.id;
    newCategoryName.value = '';
    newCategoryOpen.value = false;
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Failed to create category', message: e instanceof Error ? e.message : 'Please try again' });
  } finally {
    creatingCategory.value = false;
  }
}

const newTagName = ref('');
const creatingTag = ref(false);

function toggleTag(id: string): void {
  const idx = form.tagIds.indexOf(id);
  if (idx === -1) form.tagIds.push(id);
  else form.tagIds.splice(idx, 1);
}

async function createTag(): Promise<void> {
  if (!newTagName.value.trim()) return;
  creatingTag.value = true;
  try {
    const tag = await store.addTag(newTagName.value.trim());
    form.tagIds.push(tag.id);
    newTagName.value = '';
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Failed to create tag', message: e instanceof Error ? e.message : 'Please try again' });
  } finally {
    creatingTag.value = false;
  }
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function onTitleInput(value: string): void {
  form.title = value;
  if (!slugManuallyEdited.value) {
    form.slug = slugify(form.title);
  }
}

function onSlugInput(value: string): void {
  form.slug = value;
  slugManuallyEdited.value = true;
}

function openCreate(): void {
  editingId.value = null;
  slugManuallyEdited.value = false;
  Object.assign(form, emptyForm());
  modalOpen.value = true;
}

async function openEdit(post: BlogPost): Promise<void> {
  try {
    const detail = await store.fetchPostDetail(post.slug);
    editingId.value = detail.id;
    slugManuallyEdited.value = true;
    // BlogPostDetailDto's `tags` is a list of tag NAMES (matches the public
    // read shape), but selecting/toggling in this form works by tag id — map
    // back to ids via the loaded taxonomy. Relies on tag names being unique,
    // which SlugHelper-derived slugs + the taxonomy list already assume.
    const tagIds = detail.tags
      .map((name) => store.tags.find((t) => t.name === name)?.id)
      .filter((id): id is string => Boolean(id));
    Object.assign(form, {
      title: detail.title,
      slug: detail.slug,
      content: detail.content,
      excerpt: detail.excerpt ?? '',
      authorName: detail.authorName ?? '',
      categoryId: detail.categoryId ?? '',
      tagIds,
      publish: detail.status === 'Published',
    });
    modalOpen.value = true;
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Failed to load post', message: e instanceof Error ? e.message : 'Please try again' });
  }
}

async function save(): Promise<void> {
  if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
    ui.addToast({ tone: 'danger', title: 'Title, slug, and content are required' });
    return;
  }
  saving.value = true;
  try {
    const payload: BlogPostInput = {
      title: form.title,
      slug: form.slug,
      content: form.content,
      excerpt: form.excerpt || null,
      authorName: form.authorName || null,
      categoryId: form.categoryId || null,
      tagIds: form.tagIds,
      publish: form.publish,
    };
    await store.savePost(payload, editingId.value ?? undefined);
    ui.addToast({ tone: 'success', title: editingId.value ? 'Post updated' : 'Post created' });
    modalOpen.value = false;
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Save failed', message: e instanceof Error ? e.message : 'Please try again' });
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(post: BlogPost): Promise<void> {
  const ok = await ui.confirm({
    title: 'Delete post',
    message: `Delete "${post.title}"? This can't be undone.`,
    confirmLabel: 'Delete',
    tone: 'danger',
  });
  if (!ok) return;
  try {
    await store.removePost(post.id);
    ui.addToast({ tone: 'success', title: 'Post deleted' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Delete failed', message: e instanceof Error ? e.message : 'Please try again' });
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>
