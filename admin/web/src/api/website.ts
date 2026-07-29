import client from './client';
import type {
  WebsiteDashboardStats,
  WebsitePaginated,
  Album,
  AlbumInput,
  Product,
  ProductInput,
  MediaItem,
  MediaLinkInput,
  Faq,
  FaqInput,
  EventSummary,
  EventDetail,
  EventInput,
  BlogPost,
  BlogPostDetail,
  BlogPostInput,
  BlogCategory,
  BlogTag,
  Booking,
  ContactMessage,
  Volunteer,
  PrayerRequestItem,
  Ticket,
  Subscriber,
  AdminComment,
  TrashItem,
  TrashEntityType,
} from './websiteTypes';

// Every function here calls through services/api's /v1/website/* module (not
// CGM-Backend directly — the browser never talks to the .NET backend), which
// carries this session's normal JWT auth via the shared `client` instance
// (same interceptor/refresh behaviour as every other admin API call).

export async function getWebsiteDashboard(): Promise<WebsiteDashboardStats> {
  const { data } = await client.get<WebsiteDashboardStats>('/v1/website/dashboard');
  return data;
}

// ─── Albums ───────────────────────────────────────────────────────────────────

export async function listAlbums(): Promise<Album[]> {
  const { data } = await client.get<Album[]>('/v1/website/albums');
  return data;
}

export async function createAlbum(input: AlbumInput): Promise<{ id: string }> {
  const { data } = await client.post<{ id: string }>('/v1/website/albums', input);
  return data;
}

export async function updateAlbum(id: string, input: AlbumInput): Promise<void> {
  await client.put(`/v1/website/albums/${id}`, input);
}

export async function deleteAlbum(id: string): Promise<void> {
  await client.delete(`/v1/website/albums/${id}`);
}

// ─── Store products ───────────────────────────────────────────────────────────

export async function listProducts(category?: string): Promise<Product[]> {
  const { data } = await client.get<Product[]>('/v1/website/products', { params: { category } });
  return data;
}

export async function createProduct(input: ProductInput): Promise<{ id: string }> {
  const { data } = await client.post<{ id: string }>('/v1/website/products', input);
  return data;
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  await client.put(`/v1/website/products/${id}`, input);
}

export async function deleteProduct(id: string): Promise<void> {
  await client.delete(`/v1/website/products/${id}`);
}

// ─── Media / videos ─────────────────────────────────────────────────────────────

export interface MediaListParams {
  page?: number;
  pageSize?: number;
  type?: string;
  isPublished?: boolean;
}

export async function listMedia(params?: MediaListParams): Promise<WebsitePaginated<MediaItem>> {
  const { data } = await client.get<WebsitePaginated<MediaItem>>('/v1/website/media', { params });
  return data;
}

export async function createMediaLink(input: MediaLinkInput): Promise<{ id: string }> {
  const { data } = await client.post<{ id: string }>('/v1/website/media', input);
  return data;
}

export async function updateMediaLink(id: string, input: MediaLinkInput): Promise<void> {
  await client.put(`/v1/website/media/${id}`, input);
}

export async function deleteMedia(id: string): Promise<void> {
  await client.delete(`/v1/website/media/${id}`);
}

// ─── FAQs ─────────────────────────────────────────────────────────────────────

export async function listFaqs(category?: string): Promise<Faq[]> {
  const { data } = await client.get<Faq[]>('/v1/website/faqs', { params: { category } });
  return data;
}

export async function createFaq(input: FaqInput): Promise<{ id: string }> {
  const { data } = await client.post<{ id: string }>('/v1/website/faqs', input);
  return data;
}

export async function updateFaq(id: string, input: FaqInput): Promise<void> {
  await client.put(`/v1/website/faqs/${id}`, input);
}

export async function deleteFaq(id: string): Promise<void> {
  await client.delete(`/v1/website/faqs/${id}`);
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface EventListParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

export async function listEvents(params?: EventListParams): Promise<WebsitePaginated<EventSummary>> {
  const { data } = await client.get<WebsitePaginated<EventSummary>>('/v1/website/events', { params });
  return data;
}

export async function getEvent(id: string): Promise<EventDetail> {
  const { data } = await client.get<EventDetail>(`/v1/website/events/${id}`);
  return data;
}

export async function createEvent(input: EventInput): Promise<{ id: string }> {
  const { data } = await client.post<{ id: string }>('/v1/website/events', input);
  return data;
}

export async function updateEvent(id: string, input: EventInput): Promise<void> {
  await client.put(`/v1/website/events/${id}`, input);
}

export async function updateEventStatus(id: string, status: string): Promise<void> {
  await client.patch(`/v1/website/events/${id}/status`, { status });
}

export async function deleteEvent(id: string): Promise<void> {
  await client.delete(`/v1/website/events/${id}`);
}

// ─── Blog / Journal ─────────────────────────────────────────────────────────────

export interface BlogListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  categoryId?: string;
  featuredOnly?: boolean;
}

export async function listBlogPosts(params?: BlogListParams): Promise<WebsitePaginated<BlogPost>> {
  const { data } = await client.get<WebsitePaginated<BlogPost>>('/v1/website/blog', { params });
  return data;
}

export async function getBlogPost(slug: string): Promise<BlogPostDetail> {
  const { data } = await client.get<BlogPostDetail>(`/v1/website/blog/${slug}`);
  return data;
}

export async function createBlogPost(input: BlogPostInput): Promise<{ id: string }> {
  const { data } = await client.post<{ id: string }>('/v1/website/blog', input);
  return data;
}

export async function updateBlogPost(id: string, input: BlogPostInput): Promise<void> {
  await client.put(`/v1/website/blog/${id}`, input);
}

export async function deleteBlogPost(id: string): Promise<void> {
  await client.delete(`/v1/website/blog/${id}`);
}

export async function updateBlogPostStatus(id: string, status: string): Promise<void> {
  await client.patch(`/v1/website/blog/${id}/status`, { status });
}

export async function listBlogCategories(): Promise<BlogCategory[]> {
  const { data } = await client.get<BlogCategory[]>('/v1/website/blog/categories');
  return data;
}

export async function createBlogCategory(name: string, description?: string): Promise<{ id: string }> {
  const { data } = await client.post<{ id: string }>('/v1/website/blog/categories', { name, description });
  return data;
}

export async function listBlogTags(): Promise<BlogTag[]> {
  const { data } = await client.get<BlogTag[]>('/v1/website/blog/tags');
  return data;
}

export async function createBlogTag(name: string): Promise<{ id: string }> {
  const { data } = await client.post<{ id: string }>('/v1/website/blog/tags', { name });
  return data;
}

// ─── Bookings (inbox) ────────────────────────────────────────────────────────

export async function listBookings(params?: { page?: number; pageSize?: number; status?: string }): Promise<
  WebsitePaginated<Booking>
> {
  const { data } = await client.get<WebsitePaginated<Booking>>('/v1/website/bookings', { params });
  return data;
}

export async function updateBookingStatus(id: string, status: string, adminNotes?: string): Promise<void> {
  await client.patch(`/v1/website/bookings/${id}/status`, { status, adminNotes });
}

export async function deleteBooking(id: string): Promise<void> {
  await client.delete(`/v1/website/bookings/${id}`);
}

// ─── Contact messages (inbox) ─────────────────────────────────────────────────

export async function listContacts(params?: { page?: number; pageSize?: number; isRead?: boolean }): Promise<
  WebsitePaginated<ContactMessage>
> {
  const { data } = await client.get<WebsitePaginated<ContactMessage>>('/v1/website/contacts', { params });
  return data;
}

export async function deleteContact(id: string): Promise<void> {
  await client.delete(`/v1/website/contacts/${id}`);
}

// ─── Volunteers (inbox) ───────────────────────────────────────────────────────

export async function listVolunteers(params?: { page?: number; pageSize?: number }): Promise<
  WebsitePaginated<Volunteer>
> {
  const { data } = await client.get<WebsitePaginated<Volunteer>>('/v1/website/volunteers', { params });
  return data;
}

export async function deleteVolunteer(id: string): Promise<void> {
  await client.delete(`/v1/website/volunteers/${id}`);
}

// ─── Prayer requests (inbox) ──────────────────────────────────────────────────

export async function listPrayerRequests(params?: { page?: number; pageSize?: number; status?: string }): Promise<
  WebsitePaginated<PrayerRequestItem>
> {
  const { data } = await client.get<WebsitePaginated<PrayerRequestItem>>('/v1/website/prayer-requests', { params });
  return data;
}

export async function deletePrayerRequest(id: string): Promise<void> {
  await client.delete(`/v1/website/prayer-requests/${id}`);
}

// ─── Tickets (inbox) ──────────────────────────────────────────────────────────

export async function listTickets(params?: { page?: number; pageSize?: number; status?: string }): Promise<
  WebsitePaginated<Ticket>
> {
  const { data } = await client.get<WebsitePaginated<Ticket>>('/v1/website/tickets', { params });
  return data;
}

export async function deleteTicket(id: string): Promise<void> {
  await client.delete(`/v1/website/tickets/${id}`);
}

// ─── Subscribers (inbox) ──────────────────────────────────────────────────────

export async function listSubscribers(params?: { page?: number; pageSize?: number }): Promise<
  WebsitePaginated<Subscriber>
> {
  const { data } = await client.get<WebsitePaginated<Subscriber>>('/v1/website/subscribers', { params });
  return data;
}

export async function deleteSubscriber(id: string): Promise<void> {
  await client.delete(`/v1/website/subscribers/${id}`);
}

// ─── Journal comments (moderation) ─────────────────────────────────────────────

export async function listComments(params?: { page?: number; pageSize?: number; status?: string }): Promise<
  WebsitePaginated<AdminComment>
> {
  const { data } = await client.get<WebsitePaginated<AdminComment>>('/v1/website/comments', { params });
  return data;
}

export async function updateCommentStatus(id: string, status: string): Promise<void> {
  await client.patch(`/v1/website/comments/${id}/status`, { status });
}

export async function deleteComment(id: string): Promise<void> {
  await client.delete(`/v1/website/comments/${id}`);
}

// ─── Trash / Recycle Bin ───────────────────────────────────────────────────────

export async function listTrash(params?: {
  entityType?: TrashEntityType;
  page?: number;
  pageSize?: number;
}): Promise<WebsitePaginated<TrashItem>> {
  const { data } = await client.get<WebsitePaginated<TrashItem>>('/v1/website/trash', { params });
  return data;
}

export async function restoreTrashItem(entityType: TrashEntityType, id: string): Promise<void> {
  await client.post(`/v1/website/trash/${entityType}/${id}/restore`);
}

export async function permanentlyDeleteTrashItem(entityType: TrashEntityType, id: string): Promise<void> {
  await client.delete(`/v1/website/trash/${entityType}/${id}`);
}

export async function emptyTrash(): Promise<void> {
  await client.delete('/v1/website/trash');
}
