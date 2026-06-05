import db from '../models';
import { AdvancedCache } from '../utils/cache.util';
import { CreateExpenseCategoryInput, UpdateExpenseCategoryInput, ExpenseCategoryQueryInput } from '../validations/expenseCategory.schema';
import { Op } from 'sequelize';

export class ExpenseCategoryService {
  private static cache = new AdvancedCache<string, any>(300, 120);

  static async create(data: CreateExpenseCategoryInput) {
    const existing = await db.ExpenseCategory.findOne({
      where: { name: data.name, parentId: data.parentId || null },
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

    if (data.name !== undefined || data.parentId !== undefined) {
      const newName = data.name ?? category.name;
      const newParentId = data.parentId !== undefined ? data.parentId : category.parentId;
      const conflict = await db.ExpenseCategory.findOne({
        where: { name: newName, parentId: newParentId || null, id: { [Op.ne]: id } },
      });
      if (conflict) throw new Error('Another category with same name already exists under this parent');
    }

    if (data.parentId === id) throw new Error('Category cannot be its own parent');

    if (data.parentId) {
      const wouldCreateCycle = await this.wouldCreateCycle(id, data.parentId);
      if (wouldCreateCycle) throw new Error('This change would create a circular reference');
    }

    await category.update(data);
    this.invalidateAllCache();
    return category.toJSON();
  }

  /**
   * Delete a category with optional force and reassignment.
   * - If force=false and category has subcategories or expenses, throws error.
   * - If force=true:
   *   - If reassignToCategoryId is provided: all expenses of this category (and its subcategories) are moved to that category.
   *   - If no reassignToCategoryId: all expenses are deleted.
   *   - All subcategories are recursively deleted (with same reassign logic).
   */
  static async delete(id: string, options?: { force?: boolean; reassignToCategoryId?: string }) {
    const category = await db.ExpenseCategory.findByPk(id);
    if (!category) throw new Error('Expense category not found');

    const force = options?.force === true;
    const reassignId = options?.reassignToCategoryId;

    // Validate reassign target if provided
    if (reassignId) {
      if (reassignId === id) throw new Error('Cannot reassign expenses to the same category being deleted');
      const targetCategory = await db.ExpenseCategory.findByPk(reassignId);
      if (!targetCategory) throw new Error('Reassignment target category not found');
    }

    const childrenCount = await db.ExpenseCategory.count({ where: { parentId: id } });
    const expensesCount = await db.Expense.count({ where: { categoryId: id } });

    if (!force && (childrenCount > 0 || expensesCount > 0)) {
      const reasons = [];
      if (childrenCount > 0) reasons.push(`${childrenCount} subcategory(s)`);
      if (expensesCount > 0) reasons.push(`${expensesCount} expense(s)`);
      throw new Error(`Cannot delete category because it has ${reasons.join(' and ')}. Use force=true to delete subcategories and optionally reassign expenses.`);
    }

    const transaction = await db.sequelize.transaction();
    try {
      // 1. Handle expenses of this category
      if (expensesCount > 0) {
        if (reassignId) {
          // Reassign expenses to target category
          await db.Expense.update(
            { categoryId: reassignId },
            { where: { categoryId: id }, transaction }
          );
        } else {
          // Delete all expenses in this category
          await db.Expense.destroy({ where: { categoryId: id }, transaction });
        }
      }

      // 2. Recursively delete subcategories (if force)
      if (force && childrenCount > 0) {
        await this.deleteSubcategoriesRecursive(id, reassignId, transaction);
      }

      // 3. Delete the category itself
      await category.destroy({ transaction });
      await transaction.commit();

      this.invalidateAllCache();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private static async deleteSubcategoriesRecursive(parentId: string, reassignToCategoryId: string | undefined, transaction: any) {
    const subcategories = await db.ExpenseCategory.findAll({
      where: { parentId },
      transaction,
    });
    for (const sub of subcategories) {
      // Handle expenses of this subcategory
      const subExpensesCount = await db.Expense.count({ where: { categoryId: sub.id }, transaction });
      if (subExpensesCount > 0) {
        if (reassignToCategoryId) {
          await db.Expense.update(
            { categoryId: reassignToCategoryId },
            { where: { categoryId: sub.id }, transaction }
          );
        } else {
          await db.Expense.destroy({ where: { categoryId: sub.id }, transaction });
        }
      }
      // Recursively delete its own children
      await this.deleteSubcategoriesRecursive(sub.id, reassignToCategoryId, transaction);
      // Delete the subcategory
      await sub.destroy({ transaction });
    }
  }

  static async list(query: ExpenseCategoryQueryInput) {
    const cacheKey = `categories:${JSON.stringify(query)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const include: any[] = [];
    if (query.includeParent) {
      include.push({ model: db.ExpenseCategory, as: 'parentCategory', attributes: ['id', 'name'] });
    }
    if (query.includeChildren) {
      include.push({ model: db.ExpenseCategory, as: 'subCategories', attributes: ['id', 'name'] });
    }

    let categories = await db.ExpenseCategory.findAll({
      where: {},
      include,
      order: [['name', 'ASC']],
    });

    let result;
    if (query.flatList) {
      result = categories.map((c: any) => c.toJSON());
    } else {
      result = this.buildTree(categories);
    }
    this.cache.set(cacheKey, result);
    return result;
  }

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
        map.get(cat.parentId).children.push(node);
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
    for (const key of this.cache['cache'].keys()) {
      if (typeof key === 'string' && (key.startsWith('category:') || key.startsWith('categories:'))) {
        this.cache.del(key);
      }
    }
  }
}