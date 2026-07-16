import { z } from 'zod';

const characterColumns = [
  { header: 'Player_ID', schema: z.string() },
  { header: 'Player_Name', schema: z.string() },
] as const;

export const CHARACTER_HEADERS = characterColumns.map(c => c.header);
// Zod tuple wants [ZodTypeAny, ZodTypeAny]
// In TypeScript, how can we map a tuple of objects to a tuple of schemas?
// We can't do it dynamically without losing strict type inference in zod.
// For example:
const schemas = characterColumns.map(c => c.schema);
// This produces ZodTypeAny[] which z.tuple doesn't like for strict inference.
// z.tuple expects [ZodString, ZodString].
