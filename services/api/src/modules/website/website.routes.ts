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

// ─── Contact messages (inbox — list only) ───────────────────────────────────

websiteRouter.get(
  '/contacts',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('GET', '/contacts', actor, { query: req.query as Record<string, string> }));
  }),
);

// ─── Volunteer applications (inbox — list only) ─────────────────────────────

websiteRouter.get(
  '/volunteers',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('GET', '/volunteers', actor, { query: req.query as Record<string, string> }));
  }),
);

// ─── Prayer requests (inbox — list only) ────────────────────────────────────

websiteRouter.get(
  '/prayer-requests',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res
      .status(200)
      .json(await cgmRequest('GET', '/prayer-requests', actor, { query: req.query as Record<string, string> }));
  }),
);

// ─── Ticket reservations (inbox — list only) ────────────────────────────────

websiteRouter.get(
  '/tickets',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res.status(200).json(await cgmRequest('GET', '/tickets', actor, { query: req.query as Record<string, string> }));
  }),
);

// ─── Newsletter subscribers (inbox — list only; unsubscribe is a public,
// token-driven action on the website itself, not an admin action here) ──────

websiteRouter.get(
  '/subscribers',
  asyncHandler(async (req, res) => {
    const actor = requireAdmin(req);
    res
      .status(200)
      .json(await cgmRequest('GET', '/subscribers', actor, { query: req.query as Record<string, string> }));
  }),
);
