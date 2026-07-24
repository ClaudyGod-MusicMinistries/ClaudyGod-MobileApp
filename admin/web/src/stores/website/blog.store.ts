import { defineStore } from 'pinia';
import { ref } from 'vue';
import { listBlogPosts, getBlogPost, createBlogPost, updateBlogPost, deleteBlogPost, updateBlogPostStatus } from '@/api/website';
import type { BlogPost, BlogPostDetail, BlogPostInput } from '@/api/websiteTypes';

const PAGE_SIZE = 20;

export const useBlogStore = defineStore('websiteBlog', () => {
  const posts = ref<BlogPost[]>([]);
  const total = ref(0);
  const page = ref(1);
  const statusFilter = ref<string | undefined>(undefined);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchPosts(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await listBlogPosts({ page: page.value, pageSize: PAGE_SIZE, status: statusFilter.value });
      posts.value = result.items;
      total.value = result.totalCount;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load posts';
    } finally {
      isLoading.value = false;
    }
  }

  function setPage(p: number): void {
    page.value = p;
    void fetchPosts();
  }

  function setStatusFilter(status: string | undefined): void {
    statusFilter.value = status;
    page.value = 1;
    void fetchPosts();
  }

  async function fetchPostDetail(slug: string): Promise<BlogPostDetail> {
    return getBlogPost(slug);
  }

  async function savePost(input: BlogPostInput, id?: string): Promise<void> {
    if (id) {
      await updateBlogPost(id, input);
    } else {
      await createBlogPost(input);
    }
    await fetchPosts();
  }

  async function removePost(id: string): Promise<void> {
    await deleteBlogPost(id);
    await fetchPosts();
  }

  async function changeStatus(id: string, status: string): Promise<void> {
    await updateBlogPostStatus(id, status);
    await fetchPosts();
  }

  return {
    posts,
    total,
    page,
    statusFilter,
    isLoading,
    error,
    pageSize: PAGE_SIZE,
    fetchPosts,
    setPage,
    setStatusFilter,
    fetchPostDetail,
    savePost,
    removePost,
    changeStatus,
  };
});
