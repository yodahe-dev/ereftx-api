import { Sequelize, Op } from "sequelize";
import db from "../../../models";

export class StockAnalyticsService {
  private sequelize: Sequelize;

  constructor() {
    this.sequelize = db.sequelize;
  }

  // ========== CATEGORY METHODS (existing) ==========
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

  // ========== PRODUCT-LEVEL – ENHANCED ==========

  // 1. Restock details: list of restock events with dates, changes, and cumulative totals
  async getRestockDetailsByProduct(productId: string) {
    const history = await db.StockHistory.findAll({
      where: {
        productId,
        actionType: 'restock',
      },
      attributes: ['createdAt', 'boxQuantityChange', 'singleQuantityChange'],
      order: [['createdAt', 'ASC']],
      raw: true,
    });

    let cumBox = 0;
    let cumSingle = 0;
    const details = history.map((entry: any) => {
      const boxChange = Number(entry.boxQuantityChange) || 0;
      const singleChange = Number(entry.singleQuantityChange) || 0;
      cumBox += boxChange;
      cumSingle += singleChange;
      return {
        date: entry.createdAt,
        boxChange,
        singleChange,
        cumulativeBoxes: cumBox,
        cumulativeSingles: cumSingle,
      };
    });

    return details;
  }

  // 2. Sales velocity: daily sales (boxes & singles) with fast/slow categorization
  async getSalesVelocityByProduct(productId: string) {
    const sales = await db.StockHistory.findAll({
      where: {
        productId,
        actionType: 'sale',
      },
      attributes: [
        'createdAt',
        'boxQuantityChange',
        'singleQuantityChange',
      ],
      order: [['createdAt', 'ASC']],
      raw: true,
    });

    // Aggregate by day
    const dailyMap: Record<string, { boxes: number; singles: number }> = {};
    for (const entry of sales) {
      const date = new Date(entry.createdAt).toISOString().split('T')[0];
      if (!dailyMap[date]) {
        dailyMap[date] = { boxes: 0, singles: 0 };
      }
      // sales are negative changes, convert to positive
      dailyMap[date].boxes += Math.abs(Number(entry.boxQuantityChange) || 0);
      dailyMap[date].singles += Math.abs(Number(entry.singleQuantityChange) || 0);
    }

    // Convert to array and sort by date
    const sortedDates = Object.keys(dailyMap).sort();
    const velocityData = sortedDates.map(date => ({
      date,
      boxesSold: dailyMap[date].boxes,
      singlesSold: dailyMap[date].singles,
      totalUnits: dailyMap[date].boxes + dailyMap[date].singles,
    }));

    // Compute average to determine fast/slow
    if (velocityData.length === 0) {
      return { data: [], average: 0, fastDays: [], slowDays: [] };
    }
    const totalUnits = velocityData.reduce((sum, d) => sum + d.totalUnits, 0);
    const average = totalUnits / velocityData.length;
    const threshold = average * 0.8; // days with >80% of average are "fast", else "slow"

    const fastDays = velocityData.filter(d => d.totalUnits >= threshold);
    const slowDays = velocityData.filter(d => d.totalUnits < threshold);

    return {
      data: velocityData,
      average,
      fastDays: fastDays.map(d => d.date),
      slowDays: slowDays.map(d => d.date),
      fastCount: fastDays.length,
      slowCount: slowDays.length,
    };
  }

  // 3. Current stock (from stocks table)
  async getCurrentStockByProduct(productId: string) {
    const stock = await db.Stock.findOne({
      where: { productId },
      attributes: ['id', 'boxQuantity', 'singleQuantity', 'containerType'],
      raw: true,
    });
    if (!stock) {
      return { boxQuantity: 0, singleQuantity: 0, containerType: null };
    }
    return {
      boxQuantity: Number(stock.boxQuantity) || 0,
      singleQuantity: Number(stock.singleQuantity) || 0,
      containerType: stock.containerType,
    };
  }

  // 4. Stock level history (from stock_history, using after values)
  async getStockLevelHistoryByProduct(productId: string) {
    const history = await db.StockHistory.findAll({
      where: { productId },
      attributes: ['createdAt', 'boxQuantityAfter', 'singleQuantityAfter'],
      order: [['createdAt', 'ASC']],
      raw: true,
    });

    return history.map((entry: any) => ({
      date: entry.createdAt,
      boxes: Number(entry.boxQuantityAfter) || 0,
      singles: Number(entry.singleQuantityAfter) || 0,
    }));
  }

  // 5. Full product analytics (extended)
  async getFullProductAnalytics(productId: string) {
    const [
      frequency,
      timeline,
      sales,
      restockDetails,
      salesVelocity,
      currentStock,
      stockLevelHistory,
    ] = await Promise.all([
      this.getActionFrequencyByProduct(productId),
      this.getTimelineByProduct(productId),
      this.getSalesSummaryByProduct(productId),
      this.getRestockDetailsByProduct(productId),
      this.getSalesVelocityByProduct(productId),
      this.getCurrentStockByProduct(productId),
      this.getStockLevelHistoryByProduct(productId),
    ]);

    const product = await db.Product.findByPk(productId, { attributes: ['id', 'name'] });

    return {
      productId,
      productName: product?.name || null,
      frequency,
      timeline,
      sales,
      restockDetails,
      salesVelocity,
      currentStock,
      stockLevelHistory,
    };
  }

  // ----- Helper methods (used above) -----
  private async getActionFrequencyByProduct(productId: string) {
    const result = await db.StockHistory.findAll({
      where: { productId },
      attributes: [
        'actionType',
        [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count']
      ],
      group: ['actionType'],
      raw: true,
    });

    const frequency: Record<string, number> = {
      restock: 0,
      sale: 0,
      adjust: 0,
      exchange: 0,
      initial: 0,
    };

    for (const row of result) {
      const action = (row as any).actionType as string;
      frequency[action] = Number((row as any).count) || 0;
    }

    return frequency;
  }

  private async getTimelineByProduct(productId: string) {
    const history = await db.StockHistory.findAll({
      where: { productId },
      attributes: ['createdAt', 'boxQuantityChange', 'singleQuantityChange'],
      order: [['createdAt', 'ASC']],
      raw: true,
    });

    const dailyMap: Record<string, { boxChange: number; singleChange: number }> = {};
    for (const entry of history) {
      const date = new Date(entry.createdAt).toISOString().split('T')[0];
      if (!dailyMap[date]) {
        dailyMap[date] = { boxChange: 0, singleChange: 0 };
      }
      dailyMap[date].boxChange += Number(entry.boxQuantityChange) || 0;
      dailyMap[date].singleChange += Number(entry.singleQuantityChange) || 0;
    }

    const sortedDates = Object.keys(dailyMap).sort();
    let cumBox = 0;
    let cumSingle = 0;
    const timeline = sortedDates.map(date => {
      cumBox += dailyMap[date].boxChange;
      cumSingle += dailyMap[date].singleChange;
      return {
        date,
        boxChange: dailyMap[date].boxChange,
        singleChange: dailyMap[date].singleChange,
        boxCumulative: cumBox,
        singleCumulative: cumSingle,
      };
    });

    return timeline;
  }

  private async getSalesSummaryByProduct(productId: string) {
    const result = await db.StockHistory.findOne({
      where: {
        productId,
        actionType: 'sale',
      },
      attributes: [
        [this.sequelize.fn('SUM', this.sequelize.col('boxQuantityChange')), 'totalBoxesSold'],
        [this.sequelize.fn('SUM', this.sequelize.col('singleQuantityChange')), 'totalSinglesSold'],
      ],
      raw: true,
    });

    return {
      totalBoxesSold: Number((result as any)?.totalBoxesSold) || 0,
      totalSinglesSold: Number((result as any)?.totalSinglesSold) || 0,
    };
  }
}