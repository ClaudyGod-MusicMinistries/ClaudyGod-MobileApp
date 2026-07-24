<template>
  <div class="space-y-5">
    <WebPageHeader :icon="ShoppingBag" title="Store products" subtitle="Merchandise shown on the Store page">
      <AppButton size="sm" @click="openCreate">
        <template #icon><Plus class="w-4 h-4" /></template>
        New product
      </AppButton>
    </WebPageHeader>

    <AppCard>
      <AppResponsiveTable :columns="columns" :rows="rows" :loading="store.isLoading">
        <template #cell-title="{ row }">
          <div class="flex items-center gap-3">
            <img
              v-if="row.image"
              :src="row.image as string"
              alt=""
              class="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-white/5"
            />
            <div v-else class="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
              <ShoppingBag class="w-4 h-4 text-ink-muted" />
            </div>
            <p class="text-sm font-medium text-ink">{{ row.title }}</p>
          </div>
        </template>
        <template #cell-category="{ value }">
          <AppBadge tone="neutral">{{ value }}</AppBadge>
        </template>
        <template #cell-price="{ value }">
          <span class="text-sm text-ink tabular-nums">${{ Number(value).toFixed(2) }}</span>
        </template>
        <template #cell-inStock="{ value }">
          <AppBadge :tone="value ? 'success' : 'danger'">{{ value ? 'In stock' : 'Out of stock' }}</AppBadge>
        </template>
        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <AppButton variant="secondary" size="xs" @click="openEdit(row as unknown as Product)">Edit</AppButton>
            <AppButton variant="danger" size="xs" @click="confirmDelete(row as unknown as Product)">Delete</AppButton>
          </div>
        </template>
      </AppResponsiveTable>
    </AppCard>

    <AppModal v-model="modalOpen" :title="editingId ? 'Edit product' : 'New product'" size="lg">
      <form class="grid grid-cols-1 sm:grid-cols-2 gap-4" @submit.prevent="save">
        <AppInput v-model="form.title" label="Title" required class="sm:col-span-2" />
        <AppTextarea v-model="form.description" label="Description" required class="sm:col-span-2" :rows="3" />
        <AppInput v-model="form.image" label="Image URL" required class="sm:col-span-2" />
        <AppInput v-model="form.category" label="Category" required placeholder="clothing, accessories, music…" />
        <AppInput v-model="form.price" type="number" label="Price (USD)" required min="0" step="0.01" />
        <AppInput v-model="form.quantity" type="number" label="Quantity" hint="Leave blank if unlimited" />
        <AppInput v-model="form.rating" type="number" label="Rating" hint="0–5, leave blank to hide" min="0" max="5" step="0.1" />
        <div class="flex items-center gap-2.5 pt-6">
          <AppToggle v-model="form.inStock" />
          <span class="text-sm text-ink-soft">In stock</span>
        </div>
      </form>

      <template #footer>
        <div class="flex gap-2 justify-end">
          <AppButton variant="secondary" size="sm" @click="modalOpen = false">Cancel</AppButton>
          <AppButton size="sm" :loading="saving" @click="save">
            {{ editingId ? 'Save changes' : 'Create product' }}
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { ShoppingBag, Plus } from 'lucide-vue-next';
import { useProductsStore } from '@/stores/website/products.store';
import { useUiStore } from '@/stores/ui.store';
import type { Product, ProductInput } from '@/api/websiteTypes';
import AppCard from '@/components/ui/AppCard.vue';
import AppResponsiveTable from '@/components/ui/AppResponsiveTable.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppToggle from '@/components/ui/AppToggle.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import WebPageHeader from '@/components/shared/WebPageHeader.vue';

const store = useProductsStore();
const ui = useUiStore();

onMounted(() => { void store.fetchProducts(); });

const rows = computed(() => store.products as unknown as Record<string, unknown>[]);

const columns = [
  { key: 'title', label: 'Product' },
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price', align: 'right' as const },
  { key: 'inStock', label: 'Stock', align: 'right' as const },
];

const modalOpen = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);

interface ProductFormState {
  title: string;
  description: string;
  image: string;
  category: string;
  price: string;
  quantity: string;
  rating: string;
  inStock: boolean;
}

const emptyForm = (): ProductFormState => ({
  title: '',
  description: '',
  image: '',
  category: '',
  price: '',
  quantity: '',
  rating: '',
  inStock: true,
});

const form = reactive<ProductFormState>(emptyForm());

function openCreate(): void {
  editingId.value = null;
  Object.assign(form, emptyForm());
  modalOpen.value = true;
}

function openEdit(product: Product): void {
  editingId.value = product.id;
  Object.assign(form, {
    title: product.title,
    description: product.description,
    image: product.image,
    category: product.category,
    price: String(product.price),
    quantity: product.quantity != null ? String(product.quantity) : '',
    rating: product.rating != null ? String(product.rating) : '',
    inStock: product.inStock,
  });
  modalOpen.value = true;
}

async function save(): Promise<void> {
  if (!form.title.trim() || !form.description.trim() || !form.image.trim() || !form.category.trim()) {
    ui.addToast({ tone: 'danger', title: 'Title, description, image, and category are required' });
    return;
  }
  saving.value = true;
  try {
    const payload: ProductInput = {
      title: form.title,
      description: form.description,
      image: form.image,
      category: form.category,
      price: Number(form.price) || 0,
      quantity: form.quantity ? Number(form.quantity) : null,
      rating: form.rating ? Number(form.rating) : null,
      inStock: form.inStock,
    };
    await store.saveProduct(payload, editingId.value ?? undefined);
    ui.addToast({ tone: 'success', title: editingId.value ? 'Product updated' : 'Product created' });
    modalOpen.value = false;
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Save failed', message: e instanceof Error ? e.message : 'Please try again' });
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(product: Product): Promise<void> {
  const ok = await ui.confirm({
    title: 'Delete product',
    message: `Delete "${product.title}"? This can't be undone.`,
    confirmLabel: 'Delete',
    tone: 'danger',
  });
  if (!ok) return;
  try {
    await store.removeProduct(product.id);
    ui.addToast({ tone: 'success', title: 'Product deleted' });
  } catch (e) {
    ui.addToast({ tone: 'danger', title: 'Delete failed', message: e instanceof Error ? e.message : 'Please try again' });
  }
}
</script>
