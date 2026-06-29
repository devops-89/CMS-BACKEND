import { z } from "zod";

export const createCountrySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z.string().min(1, "ISO code is required").max(10),
  phoneCode: z.string().max(10).optional(),
  currencyCode: z.string().max(10).optional(),
  currencyName: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type createCountryDto = z.infer<typeof createCountrySchema>;

export const updateCountrySchema = createCountrySchema.partial();

export type updateCountryDto = z.infer<typeof updateCountrySchema>;

export const getCountryByIdSchema = z.object({
  id: z.string().uuid("Invalid country ID"),
});

export type getCountryByIdDto = z.infer<typeof getCountryByIdSchema>;
