import { z } from "zod";

/**
 * Zod Schema for an Awards & Certifications card row
 */
export const AwardsCertificationsItemSchema = z.object({
  id: z.string().uuid().optional(),
  image_url: z.string().max(1000),
  name: z.string().max(200),
  year: z.string().max(4),
  issuer: z.string().max(200),
  sort_order: z.number().int().min(0).optional(),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

export type AwardsCertificationsItem = z.infer<
  typeof AwardsCertificationsItemSchema
>;

export const AwardsCertificationsItemCreateSchema =
  AwardsCertificationsItemSchema.omit({
    created_at: true,
    updated_at: true,
  });

export type AwardsCertificationsItemCreate = z.infer<
  typeof AwardsCertificationsItemCreateSchema
>;

export interface AwardCard {
  id: string;
  imageUrl: string;
  name: string;
  year: string;
  issuer: string;
}

export const DEFAULT_AWARD_ITEMS: AwardCard[] = [
  {
    id: "a1",
    imageUrl: "",
    name: "Best Mobile Beauty Service",
    year: "2023",
    issuer: "London Beauty Awards",
  },
  {
    id: "a2",
    imageUrl: "",
    name: "Five Star Excellence",
    year: "2024",
    issuer: "UK Nail Industry Association",
  },
];

export const mapAwardsItemToAwardCard = (
  item: AwardsCertificationsItem,
): AwardCard => ({
  id: item.id ?? crypto.randomUUID(),
  imageUrl: item.image_url,
  name: item.name,
  year: item.year,
  issuer: item.issuer,
});

export const validateAwardsCertificationsItem = (
  data: unknown,
): AwardsCertificationsItem => {
  return AwardsCertificationsItemSchema.parse(data);
};

export const validateAwardsCertificationsItemCreate = (
  data: unknown,
): AwardsCertificationsItemCreate => {
  return AwardsCertificationsItemCreateSchema.parse(data);
};
