import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  listBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  updateBlogPostStatus,
  listBlogCategories,
  createBlogCategory,
  listBlogTags,
  createBlogTag,
} from '@/api/website';
import type { BlogPost, BlogPostDetail, BlogPostInput, BlogCategory, BlogTag } from '@/api/websiteTypes';
import { useLatestRequest } from '@/composables/useLatestRequest';

const PAGE_SIZE = 20;

export const useBlogStore = defineStore('websiteBlog', () => {
  const posts = ref<BlogPost[]>([]);
  const total = ref(0);
  const page = ref(1);
  const statusFilter = ref<string | undefined>(undefined);
  const { isLoading, error, execute } = useLatestRequest();
  const categories = ref<BlogCategory[]>([]);
  const tags = ref<BlogTag[]>([]);

  async function fetchPosts(): Promise<void> {
    await execute(
      () => listBlogPosts({ page: page.value, pageSize: PAGE_SIZE, status: statusFilter.value }),
      (result) => { posts.value = result.items; total.value = result.totalCount; },
    );
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

  async function fetchTaxonomy(): Promise<void> {
    const [c, t] = await Promise.all([listBlogCategories(), listBlogTags()]);
    categories.value = c;
    tags.value = t;
  }

  async function addCategory(name: string): Promise<BlogCategory> {
    const { id } = await createBlogCategory(name);
    const category = { id, name };
    categories.value.push(category);
    return category;
  }

  async function addTag(name: string): Promise<BlogTag> {
    const { id } = await createBlogTag(name);
    const tag = { id, name };
    tags.value.push(tag);
    return tag;
  }

  return {
    posts,
    total,
    page,
    statusFilter,
    isLoading,
    error,
    categories,
    tags,
    pageSize: PAGE_SIZE,
    fetchPosts,
    setPage,
    setStatusFilter,
    fetchPostDetail,
    fetchTaxonomy,
    addCategory,
    addTag,
    savePost,
    removePost,
    changeStatus,
  };
});
