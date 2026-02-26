import { z } from 'zod';

const iconNameSchema = z.string().trim().min(1).max(64);
const shortTextSchema = z.string().trim().min(1).max(240);
const longTextSchema = z.string().trim().min(1).max(5000);
const urlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => /^https?:\/\//i.test(value) || value.startsWith('mailto:') || value.startsWith('tel:'), {
    message: 'Invalid URL format',
  });

const helpContactSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    icon: iconNameSchema,
    title: shortTextSchema.max(120),
    desc: shortTextSchema,
    actionUrl: z.string().trim().min(1).max(500),
  })
  .strict();

const faqSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    q: shortTextSchema,
    a: longTextSchema.max(1500),
  })
  .strict();

const socialSchema = z
  .object({
    icon: iconNameSchema,
    label: shortTextSchema.max(120),
    url: urlSchema,
  })
  .strict();

const donateMethodSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    icon: iconNameSchema,
    label: shortTextSchema.max(120),
    subtitle: shortTextSchema,
    badge: z.string().trim().max(80).optional(),
  })
  .strict();

const donatePlanSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    name: shortTextSchema.max(120),
    amount: z.string().trim().min(1).max(32),
    period: z.enum(['once', 'monthly']),
    note: z.string().trim().min(1).max(400),
    featured: z.boolean().optional(),
    icon: iconNameSchema,
  })
  .strict();

export const mobileAppConfigSchema = z
  .object({
    version: z.coerce.number().int().min(1).max(1000).default(1),
    privacy: z
      .object({
        contactEmail: z.string().trim().email(),
        deleteConfirmPhrase: z.string().trim().min(3).max(40).default('I CONFIRM'),
        principles: z.array(shortTextSchema).min(1).max(12),
      })
      .strict(),
    help: z
      .object({
        supportCenterUrl: urlSchema,
        contact: z.array(helpContactSchema).min(1).max(20),
        faqs: z.array(faqSchema).min(1).max(40),
      })
      .strict(),
    about: z
      .object({
        heroStats: z
          .array(
            z
              .object({
                label: shortTextSchema.max(120),
                value: z.string().trim().min(1).max(80),
              })
              .strict(),
          )
          .min(1)
          .max(12),
        featureChips: z
          .array(
            z
              .object({
                icon: iconNameSchema,
                label: shortTextSchema.max(120),
              })
              .strict(),
          )
          .min(1)
          .max(40),
        team: z
          .array(
            z
              .object({
                name: shortTextSchema.max(120),
                role: shortTextSchema.max(120),
                desc: shortTextSchema.max(400),
              })
              .strict(),
          )
          .min(1)
          .max(20),
        social: z.array(socialSchema).min(1).max(20),
        versionLabel: z.string().trim().min(1).max(40),
      })
      .strict(),
    donate: z
      .object({
        currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
        quickAmounts: z.array(z.string().trim().min(1).max(16)).min(1).max(12),
        methods: z.array(donateMethodSchema).min(1).max(20),
        plans: z.array(donatePlanSchema).min(1).max(20),
        impactBreakdown: z
          .array(
            z
              .object({
                label: shortTextSchema.max(120),
                value: z.coerce.number().int().min(0).max(100),
                icon: iconNameSchema,
              })
              .strict(),
          )
          .min(1)
          .max(12),
      })
      .strict(),
    rate: z
      .object({
        iosStoreUrl: urlSchema,
        androidStoreUrl: urlSchema,
        feedbackRoute: z.string().trim().min(1).max(120).default('/settingsPage/help'),
      })
      .strict(),
  })
  .strict();

export const updateMobileAppConfigSchema = z
  .object({
    config: mobileAppConfigSchema,
  })
  .strict();

export type MobileAppConfig = z.infer<typeof mobileAppConfigSchema>;
