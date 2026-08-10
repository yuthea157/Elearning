import type { Metadata } from "next";
import { getAllCategoriesFlat } from "@/lib/data/admin";
import { CategoryForm } from "@/components/admin/category-form";
import { EditCategoryDialog } from "@/components/admin/edit-category-dialog";
import { DeleteCategoryButton } from "@/components/admin/delete-category-button";

export const metadata: Metadata = { title: "Manage categories — E-Learning admin" };

export default async function AdminCategoriesPage() {
  const categories = await getAllCategoriesFlat();
  const topLevel = categories.filter((c) => !c.parentId);
  const childParentIds = new Set(categories.filter((c) => c.parentId).map((c) => c.parentId));

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-xl font-semibold text-foreground">Categories</h2>
      <CategoryForm categories={topLevel} />
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Parent</th>
              <th className="px-4 py-3">Courses</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-4 py-3 font-medium text-foreground">{category.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{category.parent?.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{category._count.courses}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <EditCategoryDialog
                      category={{ id: category.id, name: category.name, parentId: category.parentId, hasChildren: childParentIds.has(category.id) }}
                      topLevelCategories={topLevel}
                    />
                    <DeleteCategoryButton categoryId={category.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
