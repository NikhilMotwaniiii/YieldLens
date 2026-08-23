import { z } from "zod";

export const positionSchema = z.object({
  quantity: z.coerce.number().positive("Quantity must be positive"),
  purchase_price: z.coerce.number().nonnegative().optional().or(z.literal("")),
  purchase_date: z.string().optional(),
  manual_current_price: z.coerce.number().nonnegative().optional().or(z.literal(""))
});

export const manualBondSchema = positionSchema.extend({
  isin: z.string().regex(/^INE[A-Z0-9]{9}$/, "Use a valid Indian ISIN starting with INE"),
  issuer: z.string().min(2),
  security_name: z.string().min(2),
  coupon_rate: z.coerce.number().min(0).max(30),
  maturity_date: z.string().min(1),
  face_value: z.coerce.number().positive(),
  credit_rating: z.string().optional(),
  sector: z.string().optional(),
  duration: z.coerce.number().min(0).max(40).optional().or(z.literal("")),
  latest_yield: z.coerce.number().min(0).max(40).optional().or(z.literal("")),
  latest_price: z.coerce.number().nonnegative().optional().or(z.literal(""))
});

