import { Sequelize, QueryTypes } from "sequelize";
import db from "../../../models";

export class SalesAnalyticsService {
  private sequelize: Sequelize;

  constructor() {
    this.sequelize = db.sequelize;
  }

  // ── Helper: wide date range for all data ──
  private getWideDateRange() {
    return {
      startDate: '2000-01-01',
      endDate: '2099-12-31',
    };
  }

  // ── 1. Sales Summary (daily) ──
  async getSalesSummary(startDate?: string, endDate?: string) {
    const { startDate: sd, endDate: ed } = startDate && endDate 
      ? { startDate, endDate } 
      : this.getWideDateRange();

    const query = `
      SELECT
        DATE(s.\`createdAt\`) AS \`date\`,
        COUNT(DISTINCT s.id) AS \`salesCount\`,
        COALESCE(SUM(si.\`totalUnits\`), 0) AS \`totalUnitsSold\`,
        COALESCE(SUM(si.\`totalPrice\`), 0) AS \`totalRevenue\`,
        COALESCE(SUM(si.\`totalCost\`), 0) AS \`totalCost\`,
        COALESCE(SUM(si.\`totalPrice\` - si.\`totalCost\`), 0) AS \`totalProfit\`,
        CASE
          WHEN COALESCE(SUM(si.\`totalPrice\`), 0) = 0 THEN 0
          ELSE (COALESCE(SUM(si.\`totalPrice\` - si.\`totalCost\`), 0) / COALESCE(SUM(si.\`totalPrice\`), 0)) * 100
        END AS \`marginPercent\`
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.\`saleId\`
      WHERE s.\`createdAt\` >= :startDate AND s.\`createdAt\` <= :endDate
      GROUP BY DATE(s.\`createdAt\`)
      ORDER BY \`date\` ASC
    `;
    const results = await this.sequelize.query(query, {
      replacements: { startDate: sd, endDate: ed },
      type: QueryTypes.SELECT,
    });
    return results;
  }

  // ── 2. Unit Type Breakdown (box vs single) ──
  async getUnitTypeBreakdown(groupBy: 'product' | 'brand' = 'product') {
    let groupField = '';
    let nameField = '';
    if (groupBy === 'product') {
      groupField = 'si.`productId`';
      nameField = 'p.`name`';
    } else {
      groupField = 'p.`brandId`';
      nameField = 'b.`name`';
    }
    const query = `
      SELECT
        ${groupField} AS \`id\`,
        ${nameField} AS \`name\`,
        COALESCE(SUM(CASE WHEN si.\`unitType\` = 'box' THEN si.\`totalUnits\` ELSE 0 END), 0) AS \`boxes\`,
        COALESCE(SUM(CASE WHEN si.\`unitType\` = 'single' THEN si.\`totalUnits\` ELSE 0 END), 0) AS \`singles\`,
        COALESCE(SUM(si.\`totalUnits\`), 0) AS \`total\`
      FROM sale_items si
      INNER JOIN products p ON si.\`productId\` = p.id
      LEFT JOIN brands b ON p.\`brandId\` = b.id
      GROUP BY ${groupField}, ${nameField}
      HAVING COALESCE(SUM(si.\`totalUnits\`), 0) > 0
      ORDER BY \`total\` DESC
    `;
    const results = await this.sequelize.query(query, { type: QueryTypes.SELECT });
    return (results as any[]).map(row => ({
      ...row,
      boxPercent: row.total > 0 ? (row.boxes / row.total) * 100 : 0,
      singlePercent: row.total > 0 ? (row.singles / row.total) * 100 : 0,
    }));
  }

  // ── 3. Quadrant Heatmap (Volume vs Margin) ──
  async getQuadrantHeatmap() {
    const query = `
      SELECT
        p.id AS \`productId\`,
        p.\`name\` AS \`productName\`,
        COALESCE(SUM(si.\`totalUnits\`), 0) AS \`totalUnitsSold\`,
        CASE
          WHEN COALESCE(SUM(si.\`totalPrice\`), 0) = 0 THEN 0
          ELSE (COALESCE(SUM(si.\`totalPrice\` - si.\`totalCost\`), 0) / NULLIF(COALESCE(SUM(si.\`totalPrice\`), 0), 0)) * 100
        END AS \`marginPercent\`,
        MAX(pr.\`allowLoss\`) AS \`hasLossLeader\`
      FROM products p
      LEFT JOIN sale_items si ON p.id = si.\`productId\`
      LEFT JOIN product_prices pr ON p.id = pr.\`productId\` AND pr.\`endAt\` IS NULL
      GROUP BY p.id, p.\`name\`
      HAVING COALESCE(SUM(si.\`totalUnits\`), 0) > 0
      ORDER BY \`totalUnitsSold\` DESC
    `;
    const results = await this.sequelize.query(query, { type: QueryTypes.SELECT });
    return results;
  }

  // ── 4. Cost vs Retail ──
  async getCostVsRetail(productId?: string) {
    const whereProduct = productId ? `AND p.id = :productId` : '';
    const replacements: any = {};
    if (productId) replacements.productId = productId;

    const query = `
      SELECT
        DATE(s.\`createdAt\`) AS \`date\`,
        AVG(pr.\`buyPricePerBox\`) AS \`avgBuyPrice\`,
        AVG(si.\`costPrice\`) AS \`avgSellCost\`
      FROM sale_items si
      INNER JOIN sales s ON si.\`saleId\` = s.id
      INNER JOIN products p ON si.\`productId\` = p.id
      LEFT JOIN product_prices pr ON p.id = pr.\`productId\`
        AND s.\`createdAt\` BETWEEN pr.\`startAt\` AND COALESCE(pr.\`endAt\`, NOW())
      WHERE 1=1 ${whereProduct}
      GROUP BY DATE(s.\`createdAt\`)
      ORDER BY \`date\` ASC
    `;
    const results = await this.sequelize.query(query, { replacements, type: QueryTypes.SELECT });
    return results;
  }

  // ── 5. Daily Profit (Revenue & Profit) ──
  async getDailyProfit(startDate?: string, endDate?: string) {
    const { startDate: sd, endDate: ed } = startDate && endDate 
      ? { startDate, endDate } 
      : this.getWideDateRange();
    const query = `
      SELECT
        DATE(s.\`createdAt\`) AS \`date\`,
        COALESCE(SUM(si.\`totalPrice\`), 0) AS \`revenue\`,
        COALESCE(SUM(si.\`totalPrice\` - si.\`totalCost\`), 0) AS \`profit\`
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.\`saleId\`
      WHERE s.\`createdAt\` >= :startDate AND s.\`createdAt\` <= :endDate
      GROUP BY DATE(s.\`createdAt\`)
      ORDER BY \`date\` ASC
    `;
    const results = await this.sequelize.query(query, {
      replacements: { startDate: sd, endDate: ed },
      type: QueryTypes.SELECT,
    });
    return results;
  }

  // ── 6. Daily Sales Frequency ──
  async getDailySalesFrequency(startDate?: string, endDate?: string) {
    const { startDate: sd, endDate: ed } = startDate && endDate 
      ? { startDate, endDate } 
      : this.getWideDateRange();
    const query = `
      SELECT
        DATE(s.\`createdAt\`) AS \`date\`,
        COUNT(s.id) AS \`saleCount\`
      FROM sales s
      WHERE s.\`createdAt\` >= :startDate AND s.\`createdAt\` <= :endDate
      GROUP BY DATE(s.\`createdAt\`)
      ORDER BY \`date\` ASC
    `;
    const results = await this.sequelize.query(query, {
      replacements: { startDate: sd, endDate: ed },
      type: QueryTypes.SELECT,
    });
    return results;
  }

  // ── 7. Daily Quantity Sold ──
  async getDailyQuantitySold(startDate?: string, endDate?: string) {
    const { startDate: sd, endDate: ed } = startDate && endDate 
      ? { startDate, endDate } 
      : this.getWideDateRange();
    const query = `
      SELECT
        DATE(s.\`createdAt\`) AS \`date\`,
        COALESCE(SUM(si.\`totalUnits\`), 0) AS \`totalUnits\`
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.\`saleId\`
      WHERE s.\`createdAt\` >= :startDate AND s.\`createdAt\` <= :endDate
      GROUP BY DATE(s.\`createdAt\`)
      ORDER BY \`date\` ASC
    `;
    const results = await this.sequelize.query(query, {
      replacements: { startDate: sd, endDate: ed },
      type: QueryTypes.SELECT,
    });
    return results;
  }

  // ── 8. Top Selling Products ──
  async getTopSellingProducts(startDate?: string, endDate?: string, limit: number = 10) {
    const { startDate: sd, endDate: ed } = startDate && endDate 
      ? { startDate, endDate } 
      : this.getWideDateRange();
    const query = `
      SELECT
        p.id AS \`productId\`,
        p.\`name\` AS \`productName\`,
        COALESCE(SUM(si.\`totalUnits\`), 0) AS \`totalUnitsSold\`
      FROM products p
      INNER JOIN sale_items si ON p.id = si.\`productId\`
      INNER JOIN sales s ON si.\`saleId\` = s.id
      WHERE s.\`createdAt\` >= :startDate AND s.\`createdAt\` <= :endDate
      GROUP BY p.id, p.\`name\`
      ORDER BY \`totalUnitsSold\` DESC
      LIMIT :limit
    `;
    const results = await this.sequelize.query(query, {
      replacements: { startDate: sd, endDate: ed, limit },
      type: QueryTypes.SELECT,
    });
    return results;
  }

  // ── 9. Top Profit Products ──
  async getTopProfitProducts(startDate?: string, endDate?: string, limit: number = 10) {
    const { startDate: sd, endDate: ed } = startDate && endDate 
      ? { startDate, endDate } 
      : this.getWideDateRange();
    const query = `
      SELECT
        p.id AS \`productId\`,
        p.\`name\` AS \`productName\`,
        COALESCE(SUM(si.\`totalPrice\` - si.\`totalCost\`), 0) AS \`totalProfit\`
      FROM products p
      INNER JOIN sale_items si ON p.id = si.\`productId\`
      INNER JOIN sales s ON si.\`saleId\` = s.id
      WHERE s.\`createdAt\` >= :startDate AND s.\`createdAt\` <= :endDate
      GROUP BY p.id, p.\`name\`
      ORDER BY \`totalProfit\` DESC
      LIMIT :limit
    `;
    const results = await this.sequelize.query(query, {
      replacements: { startDate: sd, endDate: ed, limit },
      type: QueryTypes.SELECT,
    });
    return results;
  }

  // ── 10. Revenue vs Profit with Margin Line ──
  async getRevenueProfitMargin(startDate?: string, endDate?: string) {
    const { startDate: sd, endDate: ed } = startDate && endDate 
      ? { startDate, endDate } 
      : this.getWideDateRange();
    const query = `
      SELECT
        DATE(s.\`createdAt\`) AS \`date\`,
        COALESCE(SUM(si.\`totalPrice\`), 0) AS \`revenue\`,
        COALESCE(SUM(si.\`totalPrice\` - si.\`totalCost\`), 0) AS \`profit\`,
        CASE
          WHEN COALESCE(SUM(si.\`totalPrice\`), 0) = 0 THEN 0
          ELSE (COALESCE(SUM(si.\`totalPrice\` - si.\`totalCost\`), 0) / COALESCE(SUM(si.\`totalPrice\`), 0)) * 100
        END AS \`marginPercent\`
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.\`saleId\`
      WHERE s.\`createdAt\` >= :startDate AND s.\`createdAt\` <= :endDate
      GROUP BY DATE(s.\`createdAt\`)
      ORDER BY \`date\` ASC
    `;
    const results = await this.sequelize.query(query, {
      replacements: { startDate: sd, endDate: ed },
      type: QueryTypes.SELECT,
    });
    return results;
  }
}