// Every shape here mirrors a real CGM-Backend DTO field-for-field (camelCase
// over the wire) so the website module's proxy (services/api's
// src/modules/website) needs zero translation — verified directly against
// CGM-Backend's Application/Features/**/DTOs source, not guessed.

export interface WebsitePaginated<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface WebsiteDashboardStats {
  totalSubscribers: number;
  activeSubscribers: number;
  totalBookings: number;
  pendingBookings: number;
  totalVolunteers: number;
  pendingVolunteers: number;
  totalEvents: number;
  upcomingEvents: number;
  totalTickets: number;
  totalPrayerRequests: number;
  pendingPrayerRequests: number;
  totalContactMessages: number;
  unreadMessages: number;
  totalMediaItems: number;
  totalBlogPosts: number;
  publishedBlogPosts: number;
}

// ─── Albums ───────────────────────────────────────────────────────────────────

export interface Album {
  id: string;
  title: string;
  imageUrl: string | null;
  spotifyUrl: string | null;
  appleUrl: string | null;
  youtubeUrl: string | null;
  deezerUrl: string | null;
  amazonUrl: string | null;
  sortOrder: number;
  releasedAt: string | null;
}

export interface AlbumInput {
  title: string;
  imageUrl?: string | null;
  spotifyUrl?: string | null;
  appleUrl?: string | null;
  youtubeUrl?: string | null;
  deezerUrl?: string | null;
  amazonUrl?: string | null;
  sortOrder?: number;
  releasedAt?: string | null;
}

// ─── Store products ───────────────────────────────────────────────────────────

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
  quantity: number | null;
  rating: number | null;
}

export interface ProductInput {
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  inStock?: boolean;
  quantity?: number | null;
  rating?: number | null;
  sortOrder?: number;
}

// ─── Media / videos (link-based) ───────────────────────────────────────────────

export type MediaType = 'Music' | 'SermonAudio' | 'SermonVideo' | 'Video' | 'Photo' | 'Other';

export interface MediaItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  publicUrl: string;
  thumbnailPath: string | null;
  artistName: string | null;
  albumName: string | null;
  durationSeconds: number | null;
  isPublished: boolean;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
}

export interface MediaLinkInput {
  title: string;
  type: MediaType;
  externalUrl: string;
  thumbnailUrl?: string | null;
  description?: string | null;
}

// ─── FAQs ─────────────────────────────────────────────────────────────────────

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export interface FaqInput {
  question: string;
  answer: string;
  category: string;
  order?: number;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type EventStatus = 'Upcoming' | 'Cancelled' | 'Completed' | 'Postponed';

export interface EventSummary {
  id: string;
  title: string;
  description: string | null;
  venue: string | null;
  startDate: string;
  endDate: string | null;
  totalCapacity: number;
  reservedCount: number;
  availableSeats: number;
  isFree: boolean;
  ticketPrice: number | null;
  status: string;
  flyerImagePath: string | null;
  createdAt: string;
}

export interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  venue: string | null;
  startDate: string;
  endDate: string | null;
  totalCapacity: number;
  reservedCount: number;
  availableSeats: number;
  isFree: boolean;
  ticketPrice: number | null;
  status: string;
  flyerImagePath: string | null;
  locationCity: string | null;
  locationState: string | null;
  locationCountry: string | null;
  createdAt: string;
}

export interface EventInput {
  title: string;
  description?: string | null;
  venue?: string | null;
  startDate: string;
  endDate?: string | null;
  totalCapacity: number;
  isFree?: boolean;
  ticketPrice?: number | null;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zipCode?: string | null;
}

// ─── Blog / Journal ─────────────────────────────────────────────────────────────

export type BlogPostStatus = 'Draft' | 'Published' | 'Archived';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImagePath: string | null;
  status: string;
  publishedAt: string | null;
  authorName: string | null;
  categoryName: string | null;
  tags: string[];
  viewCount: number;
  isFeatured: boolean;
  createdAt: string;
}

export interface BlogPostDetail extends BlogPost {
  content: string;
  categoryId: string | null;
}

export interface BlogPostInput {
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  authorName?: string | null;
  categoryId?: string | null;
  tagIds?: string[];
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organization: string;
  eventType: string;
  eventDetails: string;
  eventDate: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
}

// ─── Contact messages ─────────────────────────────────────────────────────────

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

// ─── Volunteers ───────────────────────────────────────────────────────────────

export interface Volunteer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  reason: string;
  isApproved: boolean;
  approvedAt: string | null;
  createdAt: string;
}

// ─── Prayer requests ───────────────────────────────────────────────────────────

export interface PrayerRequestItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  requestText: string;
  isConfidential: boolean;
  status: string;
  adminResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
}

// ─── Tickets ──────────────────────────────────────────────────────────────────

export interface Ticket {
  id: string;
  eventId: string;
  eventTitle: string;
  attendeeFirstName: string;
  attendeeLastName: string;
  attendeeEmail: string;
  quantity: number;
  confirmationCode: string;
  status: string;
  checkedInAt: string | null;
  createdAt: string;
}

// ─── Subscribers ──────────────────────────────────────────────────────────────

export interface Subscriber {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}
