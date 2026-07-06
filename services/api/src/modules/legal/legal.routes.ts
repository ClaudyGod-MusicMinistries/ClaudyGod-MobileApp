import { Router } from 'express';
import { env } from '../../config/env';

export const legalRouter = Router();

const supportEmail = env.EMAIL_SUPPORT_EMAIL || 'support@claudygod.org';
const siteUrl = 'https://claudygod.org';
const lastUpdated = '2026-07-06';

const page = (title: string, bodyHtml: string): string => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="index, follow" />
<title>${title} — ClaudyGod</title>
<style>
  :root { color-scheme: light dark; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, sans-serif;
    max-width: 720px;
    margin: 0 auto;
    padding: 48px 24px 96px;
    line-height: 1.65;
    color: #211F1A;
    background: #F7F4EF;
  }
  @media (prefers-color-scheme: dark) {
    body { color: #F3EFE7; background: #15130F; }
    a { color: #B9A6FF; }
  }
  h1 { font-size: 28px; margin-bottom: 4px; }
  h2 { font-size: 19px; margin-top: 36px; }
  p, li { font-size: 15px; }
  .meta { color: #6B6558; font-size: 13px; margin-bottom: 32px; }
  a { color: #6D4AFF; }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

legalRouter.get('/legal/privacy', (_req, res) => {
  res.status(200).type('html').send(
    page(
      'Privacy Policy',
      `
<h1>Privacy Policy</h1>
<p class="meta">Last updated ${lastUpdated}</p>

<p>This policy explains what information the ClaudyGod mobile app and admin
platform collect, how it is used, and the choices you have. Contact us at
<a href="mailto:${supportEmail}">${supportEmail}</a> with any questions.</p>

<h2>Information we collect</h2>
<ul>
  <li><strong>Account information</strong> — email address, display name, and a
    securely hashed password when you create an account, or basic profile
    details if you sign in with Google/Facebook.</li>
  <li><strong>Device &amp; usage data</strong> — push-notification device
    tokens, app version, and engagement events (e.g. what you play or view) so
    we can keep the catalog and recommendations working.</li>
  <li><strong>Camera, microphone, and photo library access</strong> — only
    requested when you choose to update a profile photo or record audio; nothing
    is captured in the background.</li>
  <li><strong>Donation &amp; payment information</strong> — if you make a
    donation, payment details are processed by our payment provider directly;
    we store only the resulting receipt/transaction record, never full card
    numbers.</li>
</ul>

<h2>How we use this information</h2>
<p>To operate the app (authentication, content delivery, live sessions), to
send you notifications you've opted into, to respond to support requests, and
to understand aggregate usage so we can improve the ministry's content and
the app itself. We do not sell your personal information.</p>

<h2>Who we share it with</h2>
<p>Infrastructure providers that process data on our behalf under contract
(database and file storage, email delivery, and — if you donate — a payment
processor). Public content (worship videos, audio, YouTube-sourced material)
is not personal data and is shared as intended: publicly, in the app.</p>

<h2>Your choices</h2>
<p>You can request an export or deletion of your account data at any time from
<strong>Settings → Privacy</strong> in the app, or by emailing
<a href="mailto:${supportEmail}">${supportEmail}</a>. Only administrators can
publish content to the app; regular accounts cannot upload or modify the
catalog.</p>

<h2>Children's privacy</h2>
<p>ClaudyGod is not directed at children under 13, and we do not knowingly
collect personal information from children under 13.</p>

<h2>Changes to this policy</h2>
<p>If this policy changes materially, we will update the date above and, where
appropriate, notify you in the app.</p>
`,
    ),
  );
});

legalRouter.get('/legal/terms', (_req, res) => {
  res.status(200).type('html').send(
    page(
      'Terms of Service',
      `
<h1>Terms of Service</h1>
<p class="meta">Last updated ${lastUpdated}</p>

<p>These terms govern your use of the ClaudyGod mobile app and website
(${siteUrl}). By creating an account or using the app, you agree to them.</p>

<h2>Using ClaudyGod</h2>
<p>ClaudyGod provides worship music, video, and ministry content for personal,
non-commercial use. You agree not to redistribute, resell, or use the content
outside the app without permission, and not to attempt to access, upload, or
modify content through anything other than the app's intended features.</p>

<h2>Accounts</h2>
<p>You are responsible for keeping your account credentials secure. Only
authorized administrators may publish, edit, or remove content on the
platform — end-user accounts are for browsing, engagement (favorites, prayer
wall, donations), and account settings only.</p>

<h2>Donations</h2>
<p>Donations made through the app are processed by a third-party payment
provider and are, except where required otherwise by law, non-refundable.</p>

<h2>Availability</h2>
<p>We aim to keep the app and its content available, but do not guarantee
uninterrupted access — features such as live sessions depend on third-party
infrastructure outside our control.</p>

<h2>Termination</h2>
<p>We may suspend or terminate access for accounts that violate these terms
or misuse the platform (including attempts to bypass upload/authorization
controls).</p>

<h2>Contact</h2>
<p>Questions about these terms can be sent to
<a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
`,
    ),
  );
});
