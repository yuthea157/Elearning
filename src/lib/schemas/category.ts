import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(60),
  parentId: z.string().nullish(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
