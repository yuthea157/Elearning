"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { logAdminAction } from "@/lib/services/audit";
import { categorySchema } from "@/lib/schemas/category";
import { slugify } from "@/lib/schemas/course";

export type CategoryFormState = { errors?: Record<string, string[]>; formError?: string } | null;

async function uniqueSlugFor(name: string, excludeId?: string) {
  const base = slugify(name) || "category";
  let candidate = base;
  let n = 1;
  while (
    await prisma.courseCategory.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${++n}`;
  }
  return candidate;
}

export async function createCategoryAction(_prev: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  const admin = await requireRole("ADMIN");

  const parentIdRaw = formData.get("parentId");
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    parentId: parentIdRaw === "none" ? null : parentIdRaw,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };

  const slug = await uniqueSlugFor(parsed.data.name);
  const category = await prisma.courseCategory.create({
    data: { name: parsed.data.name, slug, parentId: parsed.data.parentId ?? null },
  });
  await logAdminAction(admin.id, "CREATE_CATEGORY", "CourseCategory", category.id);

  revalidatePath("/admin/categories");
  return null;
}

export async function updateCategoryAction(
  categoryId: string,
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const admin = await requireRole("ADMIN");

  const parentIdRaw = formData.get("parentId");
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    parentId: parentIdRaw === "none" ? null : parentIdRaw,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };

  const current = await prisma.courseCategory.findUnique({
    where: { id: categoryId },
    select: { name: true, slug: true },
  });
  if (!current) return { formError: "Category not found." };

  if (parsed.data.parentId === categoryId) {
    return { errors: { parentId: ["A category can't be its own parent."] } };
  }
  if (parsed.data.parentId) {
    const childCount = await prisma.courseCategory.count({ where: { parentId: categoryId } });
    if (childCount > 0) {
      return { errors: { parentId: ["This category has subcategories — it can't also be made a subcategory."] } };
    }
  }

  const slug = parsed.data.name === current.name ? current.slug : await uniqueSlugFor(parsed.data.name, categoryId);

  await prisma.courseCategory.update({
    where: { id: categoryId },
    data: { name: parsed.data.name, slug, parentId: parsed.data.parentId ?? null },
  });
  await logAdminAction(admin.id, "UPDATE_CATEGORY", "CourseCategory", categoryId);

  revalidatePath("/admin/categories");
  return null;
}

export async function deleteCategoryAction(categoryId: string) {
  const admin = await requireRole("ADMIN");
  const courseCount = await prisma.course.count({ where: { categoryId } });
  if (courseCount > 0) {
    throw new Error(`Can't delete — ${courseCount} course(s) still use this category. Reassign them first.`);
  }
  await prisma.courseCategory.delete({ where: { id: categoryId } });
  await logAdminAction(admin.id, "DELETE_CATEGORY", "CourseCategory", categoryId);
  revalidatePath("/admin/categories");
}
