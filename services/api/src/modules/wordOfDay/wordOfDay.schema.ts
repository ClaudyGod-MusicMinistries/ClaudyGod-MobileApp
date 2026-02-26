import { z } from 'zod';

const optionalTrimmedString = (max: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().max(max).optional(),
  ) as unknown as z.ZodType<string | undefined>;

export const wordOfDayListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(60).default(20),
  })
  .strict();

export const upsertWordOfDaySchema = z
  .object({
    title: optionalTrimmedString(120),
    passage: z.string().trim().min(2).max(120),
    verse: z.string().trim().min(3).max(6000),
    reflection: z.string().trim().min(3).max(6000),
    messageDate: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      z.string().date().optional(),
    ) as unknown as z.ZodType<string | undefined>,
    status: z.enum(['draft', 'published', 'archived']).default('published'),
    notifySubscribers: z.boolean().default(false),
  })
  .strict();

export type UpsertWordOfDayInput = z.infer<typeof upsertWordOfDaySchema>;
