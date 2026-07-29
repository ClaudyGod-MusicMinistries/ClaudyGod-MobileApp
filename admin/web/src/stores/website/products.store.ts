import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listProducts, createProduct, updateProduct, deleteProduct } from '@/api/website';
import type { Product, ProductInput } from '@/api/websiteTypes';

export const useProductsStore = defineStore('websiteProducts', () => {
  const products = ref<Product[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchProducts(category?: string): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      products.value = await listProducts(category);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load products';
    } finally {
      isLoading.value = false;
    }
  }

  async function saveProduct(input: ProductInput, id?: string): Promise<void> {
    if (id) {
      await updateProduct(id, input);
    } else {
      await createProduct(input);
    }
    await fetchProducts();
  }

  async function removeProduct(id: string): Promise<void> {
    await deleteProduct(id);
    products.value = products.value.filter((p) => p.id !== id);
  }

  return { products, isLoading, error, fetchProducts, saveProduct, removeProduct };
});
