import db  from '../models';
import { AdvancedCache } from '../utils/cache.util';
import { CreateExpenseCategoryInput, UpdateExpenseCategoryInput, ExpenseCategoryQueryInput } from '../validations/expenseCategory.schema';
import { Op } from 'sequelize';

export class ExpenseCategoryService {
  private static cache = new AdvancedCache<string, any>(300, 120); // 2 min TTL

  static async create(data: CreateExpenseCategoryInput) {
    // Prevent circular parent reference? Not needed on create (parentId may be null or existing)
    const existing = await db.ExpenseCategory.findOne({
      where: {
        name: data.name,
        parentId: data.parentId || null,
      },
    });
    if (existing) throw new Error('Category with same name already exists under this parent');

    const category = await db.ExpenseCategory.create(data);
    this.invalidateAllCache();
    return category.toJSON();
  }

  static async getById(id: string, query?: ExpenseCategoryQueryInput) {
    const cacheKey = `category:${id}:${JSON.stringify(query)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const include: any[] = [];
    if (query?.includeParent) {
      include.push({ model: db.ExpenseCategory, as: 'parentCategory', attributes: ['id', 'name'] });
    }
    if (query?.includeChildren) {
      include.push({ model: db.ExpenseCategory, as: 'subCategories', attributes: ['id', 'name'] });
    }

    const category = await db.ExpenseCategory.findByPk(id, { include });
    if (!category) throw new Error('Expense category not found');

    const result = category.toJSON();
    this.cache.set(cacheKey, result);
    return result;
  }

  static async update(id: string, data: UpdateExpenseCategoryInput) {
    const category = await db.ExpenseCategory.findByPk(id);
    if (!category) throw new Error('Expense category not found');

    // If changing name or parentId, check uniqueness
    if (data.name !== undefined || data.parentId !== undefined) {
      const newName = data.name ?? category.name;
      const newParentId = data.parentId !== undefined ? data.parentId : category.parentId;
      const conflict = await db.ExpenseCategory.findOne({
        where: {
          name: newName,
          parentId: newParentId || null,
          id: { [Op.ne]: id },
        },
      });
      if (conflict) throw new Error('Another category with same name already exists under this parent');
    }

    // Prevent setting parentId to itself
    if (data.parentId === id) throw new Error('Category cannot be its own parent');

    // Prevent circular reference (optional but recommended)
    if (data.parentId) {
      const wouldCreateCycle = await this.wouldCreateCycle(id, data.parentId);
      if (wouldCreateCycle) throw new Error('This change would create a circular reference');
    }

    await category.update(data);
    this.invalidateAllCache();
    return category.toJSON();
  }

  static async delete(id: string) {
    const category = await db.ExpenseCategory.findByPk(id);
    if (!category) throw new Error('Expense category not found');

    const childrenCount = await db.ExpenseCategory.count({ where: { parentId: id } });
    if (childrenCount > 0) throw new Error('Cannot delete category with subcategories. Reassign or delete them first.');

    await category.destroy();
    this.invalidateAllCache();
  }

  static async list(query: ExpenseCategoryQueryInput) {
    const cacheKey = `categories:${JSON.stringify(query)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const where = {}; // could add filters later
    const include: any[] = [];
    if (query.includeParent) {
      include.push({ model: db.ExpenseCategory, as: 'parentCategory', attributes: ['id', 'name'] });
    }
    if (query.includeChildren) {
      include.push({ model: db.ExpenseCategory, as: 'subCategories', attributes: ['id', 'name'] });
    }

    let categories = await db.ExpenseCategory.findAll({
      where,
      include,
      order: [['name', 'ASC']],
    });

    let result;
    if (query.flatList) {
      result = categories.map((c: { toJSON: () => any; }) => c.toJSON());
    } else {
      result = this.buildTree(categories);
    }

    this.cache.set(cacheKey, result);
    return result;
  }

  // Build hierarchical tree from flat list
  private static buildTree(categories: any[]): any[] {
    const map = new Map();
    const roots: any[] = [];

    categories.forEach(cat => {
      const node = cat.toJSON ? cat.toJSON() : cat;
      node.children = [];
      map.set(node.id, node);
    });

    categories.forEach(cat => {
      const node = map.get(cat.id);
      if (cat.parentId && map.has(cat.parentId)) {
        const parent = map.get(cat.parentId);
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  private static async wouldCreateCycle(categoryId: string, newParentId: string): Promise<boolean> {
    let currentParentId: string | null = newParentId;
    const visited = new Set<string>();
    while (currentParentId) {
      if (currentParentId === categoryId) return true;
      if (visited.has(currentParentId)) break;
      visited.add(currentParentId);
      const parent = await db.ExpenseCategory.findByPk(currentParentId, { attributes: ['parentId'] }) as any;
      if (!parent) break;
      currentParentId = parent.parentId;
    }
    return false;
  }

  private static invalidateAllCache() {
    // Clear all keys starting with 'category:' or 'categories:'
    for (const key of this.cache['cache'].keys()) {
      if (typeof key === 'string' && (key.startsWith('category:') || key.startsWith('categories:'))) {
        this.cache.del(key);
      }
    }
  }
}