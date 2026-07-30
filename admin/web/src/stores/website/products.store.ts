import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listProducts, createProduct, updateProduct, deleteProduct } from '@/api/website';
import type { Product, ProductInput } from '@/api/websiteTypes';
import { useLatestRequest } from '@/composables/useLatestRequest';

export const useProductsStore = defineStore('websiteProducts', () => {
  const products = ref<Product[]>([]);
  const { isLoading, error, execute } = useLatestRequest();

  async function fetchProducts(category?: string): Promise<void> {
    await execute(() => listProducts(category), (result) => { products.value = result; });
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
