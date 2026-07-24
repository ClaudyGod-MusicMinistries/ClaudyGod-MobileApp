import { Router, type Request } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { ForbiddenError, UnauthorizedError } from '../../lib/errors';
import { authenticate } from '../../middleware/authenticate';
import { cgmRequest, type CgmActor } from './website.service';

// One router for every claudygod.org content/inbox resource, proxied through
// to CGM-Backend (the real .NET website backend). CGM-Backend's own JWT auth
// was removed — it now trusts the shared x-api-key alone, so THIS router's
// requireAdmin() check (same RBAC middleware/pattern as admin.routes.ts) is
// the actual authorization boundary for every one of these actions.
export const websiteRouter = Router();

websiteRouter.use(authenticate);

function requireAdmin(req: Request): CgmActor {
  if (!req.user) {
    throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
  }
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Admin access required', 'ADMIN_REQUIRED');
  }
  return { id: req.user.sub, email: req.user.email };
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

websiteRouter.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('GET', '/admin/dashboard', actor));
  }),
);

// ─── Albums ──────────────────────────────────────────────────────────────────

websiteRouter.get(
  '/albums',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('GET', '/albums', actor));
  }),
);

websiteRouter.post(
  '/albums',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(201).json(await cgmRequest('POST', '/albums', actor, { body: req.body }));
  }),
);

websiteRouter.put(
  '/albums/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('PUT', `/albums/${req.params.id}`, actor, { body: req.body }));
  }),
);

websiteRouter.delete(
  '/albums/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('DELETE', `/albums/${req.params.id}`, actor));
  }),
);

// ─── Store products ──────────────────────────────────────────────────────────

websiteRouter.get(
  '/products',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    res.status(200).json(await cgmRequest('GET', '/store/products', actor, { query: { category } }));
  }),
);

websiteRouter.post(
  '/products',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(201).json(await cgmRequest('POST', '/store/products', actor, { body: req.body }));
  }),
);

websiteRouter.put(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('PUT', `/store/products/${req.params.id}`, actor, { body: req.body }));
  }),
);

websiteRouter.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('DELETE', `/store/products/${req.params.id}`, actor));
  }),
);

// ─── Media / videos (link-based only — see CGM-Backend MediaController for
// the separate real-file-upload path, not proxied here) ─────────────────────

websiteRouter.get(
  '/media',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    const { page, pageSize, type, isPublished } = req.query as Record<string, string | undefined>;
    res.status(200).json(await cgmRequest('GET', '/media', actor, { query: { page, pageSize, type, isPublished } }));
  }),
);

websiteRouter.post(
  '/media',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(201).json(await cgmRequest('POST', '/media/link', actor, { body: req.body }));
  }),
);

websiteRouter.put(
  '/media/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('PUT', `/media/link/${req.params.id}`, actor, { body: req.body }));
  }),
);

websiteRouter.delete(
  '/media/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('DELETE', `/media/${req.params.id}`, actor));
  }),
);

// ─── FAQs ────────────────────────────────────────────────────────────────────

websiteRouter.get(
  '/faqs',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    res.status(200).json(await cgmRequest('GET', '/faqs', actor, { query: { category } }));
  }),
);

websiteRouter.post(
  '/faqs',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(201).json(await cgmRequest('POST', '/faqs', actor, { body: req.body }));
  }),
);

websiteRouter.put(
  '/faqs/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('PUT', `/faqs/${req.params.id}`, actor, { body: req.body }));
  }),
);

websiteRouter.delete(
  '/faqs/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('DELETE', `/faqs/${req.params.id}`, actor));
  }),
);

// ─── Events ──────────────────────────────────────────────────────────────────

websiteRouter.get(
  '/events',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    const { page, pageSize, status } = req.query as Record<string, string | undefined>;
    res.status(200).json(await cgmRequest('GET', '/events', actor, { query: { page, pageSize, status } }));
  }),
);

websiteRouter.get(
  '/events/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('GET', `/events/${req.params.id}`, actor));
  }),
);

websiteRouter.post(
  '/events',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(201).json(await cgmRequest('POST', '/events', actor, { body: req.body }));
  }),
);

websiteRouter.put(
  '/events/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('PUT', `/events/${req.params.id}`, actor, { body: req.body }));
  }),
);

websiteRouter.patch(
  '/events/:id/status',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('PATCH', `/events/${req.params.id}/status`, actor, { body: req.body }));
  }),
);

websiteRouter.delete(
  '/events/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('DELETE', `/events/${req.params.id}`, actor));
  }),
);

// ─── Blog ────────────────────────────────────────────────────────────────────

websiteRouter.get(
  '/blog',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    const { page, pageSize, status, categoryId, featuredOnly } = req.query as Record<string, string | undefined>;
    res.status(200).json(
      await cgmRequest('GET', '/blog', actor, { query: { page, pageSize, status, categoryId, featuredOnly } }),
    );
  }),
);

// Categories/tags registered ahead of the /blog/:slug catch-all below —
// Express matches routes in registration order (unlike ASP.NET's specificity
// routing on the CGM-Backend side), so "categories"/"tags" would otherwise be
// swallowed by :slug.
websiteRouter.get(
  '/blog/categories',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('GET', '/blog/categories', actor));
  }),
);

websiteRouter.post(
  '/blog/categories',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(201).json(await cgmRequest('POST', '/blog/categories', actor, { body: req.body }));
  }),
);

websiteRouter.get(
  '/blog/tags',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('GET', '/blog/tags', actor));
  }),
);

websiteRouter.post(
  '/blog/tags',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(201).json(await cgmRequest('POST', '/blog/tags', actor, { body: req.body }));
  }),
);

websiteRouter.get(
  '/blog/:slug',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('GET', `/blog/${req.params.slug}`, actor));
  }),
);

websiteRouter.post(
  '/blog',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(201).json(await cgmRequest('POST', '/blog', actor, { body: req.body }));
  }),
);

websiteRouter.put(
  '/blog/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('PUT', `/blog/${req.params.id}`, actor, { body: req.body }));
  }),
);

websiteRouter.delete(
  '/blog/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('DELETE', `/blog/${req.params.id}`, actor));
  }),
);

websiteRouter.patch(
  '/blog/:id/status',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('PATCH', `/blog/${req.params.id}/status`, actor, { body: req.body }));
  }),
);

// ─── Bookings (inbox — list + status only, no create/delete from the admin
// side; bookings are submitted by the public through the website itself) ────

websiteRouter.get(
  '/bookings',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('GET', '/bookings', actor, { query: req.query as Record<string, string> }));
  }),
);

websiteRouter.patch(
  '/bookings/:id/status',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('PATCH', `/bookings/${req.params.id}/status`, actor, { body: req.body }));
  }),
);

websiteRouter.delete(
  '/bookings/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('DELETE', `/bookings/${req.params.id}`, actor));
  }),
);

// ─── Contact messages (inbox — list + move-to-trash) ────────────────────────

websiteRouter.get(
  '/contacts',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('GET', '/contacts', actor, { query: req.query as Record<string, string> }));
  }),
);

websiteRouter.delete(
  '/contacts/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('DELETE', `/contacts/${req.params.id}`, actor));
  }),
);

// ─── Volunteer applications (inbox — list + move-to-trash) ──────────────────

websiteRouter.get(
  '/volunteers',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('GET', '/volunteers', actor, { query: req.query as Record<string, string> }));
  }),
);

websiteRouter.delete(
  '/volunteers/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('DELETE', `/volunteers/${req.params.id}`, actor));
  }),
);

// ─── Prayer requests (inbox — list + move-to-trash) ─────────────────────────

websiteRouter.get(
  '/prayer-requests',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res
      .status(200)
      .json(await cgmRequest('GET', '/prayer-requests', actor, { query: req.query as Record<string, string> }));
  }),
);

websiteRouter.delete(
  '/prayer-requests/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('DELETE', `/prayer-requests/${req.params.id}`, actor));
  }),
);

// ─── Ticket reservations (inbox — list + move-to-trash) ─────────────────────

websiteRouter.get(
  '/tickets',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('GET', '/tickets', actor, { query: req.query as Record<string, string> }));
  }),
);

websiteRouter.delete(
  '/tickets/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('DELETE', `/tickets/${req.params.id}`, actor));
  }),
);

// ─── Newsletter subscribers (inbox — list + move-to-trash; unsubscribe is a
// public, token-driven action on the website itself, not this admin route) ──

websiteRouter.get(
  '/subscribers',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res
      .status(200)
      .json(await cgmRequest('GET', '/subscribers', actor, { query: req.query as Record<string, string> }));
  }),
);

websiteRouter.delete(
  '/subscribers/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('DELETE', `/subscribers/${req.params.id}`, actor));
  }),
);

// ─── Journal comment moderation (public create/read/like lives directly on
// the website, proxied straight to CGM-Backend without going through admin
// auth at all — see website2.0's own lib/data/client.ts. This is only the
// admin moderation surface: list/approve/reject/delete.) ────────────────────

websiteRouter.get(
  '/comments',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    const { page, pageSize, status } = req.query as Record<string, string | undefined>;
    res.status(200).json(await cgmRequest('GET', '/comments', actor, { query: { page, pageSize, status } }));
  }),
);

websiteRouter.patch(
  '/comments/:id/status',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('PATCH', `/comments/${req.params.id}/status`, actor, { body: req.body }));
  }),
);

websiteRouter.delete(
  '/comments/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('DELETE', `/comments/${req.params.id}`, actor));
  }),
);

// ─── Trash / Recycle Bin — cuts across every resource above. CGM-Backend does
// the actual soft-delete-listing/restore/purge (see TrashController.cs); this
// is a thin proxy, same shape as everything else in this file. 30-day
// retention is enforced lazily on the backend (purged on read, no scheduler).

websiteRouter.get(
  '/trash',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    const { entityType, page, pageSize } = req.query as Record<string, string | undefined>;
    res.status(200).json(await cgmRequest('GET', '/trash', actor, { query: { entityType, page, pageSize } }));
  }),
);

websiteRouter.post(
  '/trash/:entityType/:id/restore',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res
      .status(200)
      .json(await cgmRequest('POST', `/trash/${req.params.entityType}/${req.params.id}/restore`, actor));
  }),
);

websiteRouter.delete(
  '/trash/:entityType/:id',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('DELETE', `/trash/${req.params.entityType}/${req.params.id}`, actor));
  }),
);

websiteRouter.delete(
  '/trash',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('DELETE', '/trash', actor));
  }),
);
