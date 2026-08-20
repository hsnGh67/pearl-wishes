import { z } from "zod";

/**
 * Zod Schema for a Why Choose Us card row
 */
export const WhyChooseUsItemSchema = z.object({
  id: z.string().uuid().optional(),
  icon: z.string().max(8),
  image_url: z.string().max(1000),
  title: z.string().max(200),
  description: z.string().max(1000),
  sort_order: z.number().int().min(0).optional(),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

export type WhyChooseUsItem = z.infer<typeof WhyChooseUsItemSchema>;

export const WhyChooseUsItemCreateSchema = WhyChooseUsItemSchema.omit({
  created_at: true,
  updated_at: true,
});

export type WhyChooseUsItemCreate = z.infer<typeof WhyChooseUsItemCreateSchema>;

export interface WhyCard {
  id: string;
  icon: string;
  imageUrl: string;
  title: string;
  description: string;
}

export const DEFAULT_WHY_ITEMS: WhyCard[] = [
  {
    id: "w1",
    icon: "✨",
    imageUrl: "",
    title: "Thoughtful Craft",
    description:
      "Every detail matters. From preparation to finish, each set is created with precision, balance, and intention — ensuring refined results that stand the test of time.",
  },
  {
    id: "w2",
    icon: "💅",
    imageUrl: "",
    title: "Premium Products",
    description:
      "We work exclusively with carefully selected, high-quality products chosen for performance, safety, and nail health. Quality is never compromised, because exceptional results begin with exceptional materials.",
  },
  {
    id: "w3",
    icon: "🎓",
    imageUrl: "",
    title: "Personal Experience",
    description:
      "No two clients are the same. We take time to understand your style, needs, and occasion, delivering a service that feels considered, personal, and never formulaic.",
  },
];

export const mapWhyChooseUsItemToWhyCard = (
  item: WhyChooseUsItem,
): WhyCard => ({
  id: item.id ?? crypto.randomUUID(),
  icon: item.icon,
  imageUrl: item.image_url,
  title: item.title,
  description: item.description,
});

export const validateWhyChooseUsItem = (
  data: unknown,
): WhyChooseUsItem => {
  return WhyChooseUsItemSchema.parse(data);
};

export const validateWhyChooseUsItemCreate = (
  data: unknown,
): WhyChooseUsItemCreate => {
  return WhyChooseUsItemCreateSchema.parse(data);
};
