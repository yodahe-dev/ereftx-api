import { Sequelize } from "sequelize";
import db from "../../../models";

export class StockAnalyticsService {
  private sequelize: Sequelize;

  constructor() {
    this.sequelize = db.sequelize;
  }

  // Restock frequency (count of restock events)
  async getRestockFrequencyByCategory() {
    const query = `
      SELECT
        c.id AS categoryId,
        c.name AS categoryName,
        p.id AS productId,
        p.name AS productName,
        COUNT(sh.id) AS restockCount
      FROM categories c
      INNER JOIN brands b ON b.categoryId = c.id
      INNER JOIN products p ON p.brandId = b.id
      LEFT JOIN stock_history sh 
        ON sh.productId = p.id 
        AND sh.actionType = 'restock'
      GROUP BY c.id, c.name, p.id, p.name
      ORDER BY c.name, p.name
    `;
    const [results] = await this.sequelize.query(query);
    return this.groupByCategory(results as any[]);
  }

  // Restock quantity details (boxes and singles)
  async getRestockQuantityDetailsByCategory() {
    const query = `
      SELECT
        c.id AS categoryId,
        c.name AS categoryName,
        p.id AS productId,
        p.name AS productName,
        SUM(sh.boxQuantityChange) AS totalBoxesRestocked,
        SUM(sh.singleQuantityChange) AS totalSinglesRestocked
      FROM categories c
      INNER JOIN brands b ON b.categoryId = c.id
      INNER JOIN products p ON p.brandId = b.id
      LEFT JOIN stock_history sh 
        ON sh.productId = p.id 
        AND sh.actionType = 'restock'
      GROUP BY c.id, c.name, p.id, p.name
      HAVING SUM(sh.boxQuantityChange) > 0 OR SUM(sh.singleQuantityChange) > 0
      ORDER BY c.name, p.name
    `;
    const [results] = await this.sequelize.query(query);
    return this.groupByCategoryWithDetails(results as any[]);
  }

  private groupByCategory(rows: any[]) {
    const map = new Map();
    for (const row of rows) {
      if (!map.has(row.categoryId)) {
        map.set(row.categoryId, {
          categoryId: row.categoryId,
          categoryName: row.categoryName,
          products: [],
        });
      }
      map.get(row.categoryId).products.push({
        productId: row.productId,
        productName: row.productName,
        value: Number(row.restockCount) || 0,
      });
    }
    return Array.from(map.values());
  }

  private groupByCategoryWithDetails(rows: any[]) {
    const map = new Map();
    for (const row of rows) {
      if (!map.has(row.categoryId)) {
        map.set(row.categoryId, {
          categoryId: row.categoryId,
          categoryName: row.categoryName,
          products: [],
        });
      }
      map.get(row.categoryId).products.push({
        productId: row.productId,
        productName: row.productName,
        totalBoxesRestocked: Number(row.totalBoxesRestocked) || 0,
        totalSinglesRestocked: Number(row.totalSinglesRestocked) || 0,
      });
    }
    return Array.from(map.values());
  }
}