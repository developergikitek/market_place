import type { CategoryNode } from "@/services/addProductService";

export interface CategoryIndex {
  byId: Map<string, CategoryNode>;
  children: Map<string | null, CategoryNode[]>;
}

export function buildCategoryIndex(categories: CategoryNode[]): CategoryIndex {
  const byId = new Map<string, CategoryNode>();
  const children = new Map<string | null, CategoryNode[]>();
  for (const category of categories) {
    byId.set(category.id, category);
    const siblings = children.get(category.parent_id) ?? [];
    siblings.push(category);
    children.set(category.parent_id, siblings);
  }
  for (const list of children.values()) list.sort((a, b) => a.name.localeCompare(b.name));
  return { byId, children };
}

/** Root → node chain, following parent_id links. */
export function categoryPath(index: CategoryIndex, id: string): CategoryNode[] {
  const path: CategoryNode[] = [];
  let current = index.byId.get(id);
  while (current) {
    path.unshift(current);
    current = current.parent_id ? index.byId.get(current.parent_id) : undefined;
  }
  return path;
}

export function pathLabel(path: CategoryNode[]): string {
  return path.map((node) => node.name).join(" › ");
}
