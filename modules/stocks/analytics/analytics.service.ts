import { Op, Sequelize } from "sequelize";
import db from "../../../models";
import { SalesAnalyticsInput, StockMovementInput, TopProductsInput } from "./analytics.schema";

class AnalyticsService {
  /**
   * Sales analytics grouped by day/week/month/year
   */
  async getSalesAnalytics(filters: SalesAnalyticsInput) {
    const { groupBy, startDate, endDate, productId, brandId, categoryId } = filters;
    const dateWhere: any = {};
    if (startDate) dateWhere.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) dateWhere.createdAt = { ...dateWhere.createdAt, [Op.lte]: new Date(endDate) };

    // Base sales query with product joins for filtering
    const salesInclude: any[] = [
      {
        model: db.SaleItem,
        as: "items",
        required: true,
        include: [
          {
            model: db.Product,
            as: "product",
            required: true,
            include: [
              { model: db.Brand, as: "brand", required: false },
              { model: db.Category, as: "category", required: false },
            ],
          },
        ],
      },
    ];

    // Apply product/brand/category filters
    if (productId) {
      salesInclude[0].include[0].where = { id: productId };
    }
    if (brandId) {
      salesInclude[0].include[0].include[0].where = { id: brandId };
    }
    if (categoryId) {
      salesInclude[0].include[0].include[1].where = { id: categoryId };
    }

    const sales = await db.Sale.findAll({
      where: dateWhere,
      include: salesInclude,
    });

    // Group data by the requested interval
    const grouped: Record<string, { revenue: number; cost: number; profit: number; count: number }> = {};

    for (const sale of sales) {
      const date = new Date(sale.createdAt);
      let key: string;
      if (groupBy === "day") key = date.toISOString().slice(0, 10);
      else if (groupBy === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().slice(0, 10);
      } else if (groupBy === "month") key = date.toISOString().slice(0, 7);
      else key = date.getFullYear().toString();

      if (!grouped[key]) grouped[key] = { revenue: 0, cost: 0, profit: 0, count: 0 };
      grouped[key].revenue += Number(sale.totalAmount);
      grouped[key].cost += Number(sale.totalCost);
      grouped[key].profit += Number(sale.profit);
      grouped[key].count++;
    }

    return Object.entries(grouped).map(([date, data]) => ({ date, ...data }));
  }

  /**
   * Stock movement history for a specific product (time series)
   */
  async getStockMovement(filters: StockMovementInput) {
    const { productId, startDate, endDate, interval } = filters;
    const where: any = { productId, actionType: { [Op.ne]: "INITIAL" } };
    if (startDate) where.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(endDate) };

    const history = await db.StockHistory.findAll({
      where,
      order: [["createdAt", "ASC"]],
    });

    // Group by interval
    const grouped: Record<string, { boxChange: number; singleChange: number; netSingles: number }> = {};
    for (const h of history) {
      const date = new Date(h.createdAt);
      let key: string;
      if (interval === "day") key = date.toISOString().slice(0, 10);
      else if (interval === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().slice(0, 10);
      } else key = date.toISOString().slice(0, 7);

      if (!grouped[key]) grouped[key] = { boxChange: 0, singleChange: 0, netSingles: 0 };
      grouped[key].boxChange += h.boxQuantityChange;
      grouped[key].singleChange += h.singleQuantityChange;
      // Convert boxes to singles using unitsPerBox from product (fetch once)
    }

    // Attach product's unitsPerBox for conversion
    const product = await db.Product.findByPk(productId, { attributes: ["unitsPerBox"] });
    const unitsPerBox = product?.unitsPerBox || 12;
    const result = Object.entries(grouped).map(([date, data]) => ({
      date,
      boxChange: data.boxChange,
      singleChange: data.singleChange,
      netSinglesChange: data.boxChange * unitsPerBox + data.singleChange,
    }));
    return result;
  }

  /**
   * Top selling products (by quantity, revenue, or profit)
   */
  async getTopProducts(filters: TopProductsInput) {
    const { limit, days, sortBy } = filters;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const saleItems = await db.SaleItem.findAll({
      where: { createdAt: { [Op.gte]: startDate } },
      include: [
        {
          model: db.Product,
          as: "product",
          include: [{ model: db.Brand, as: "brand" }, { model: db.Category, as: "category" }],
        },
      ],
    });

    // Aggregate per product
    const productMap = new Map();
    for (const item of saleItems) {
      const productId = item.productId;
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          productId,
          productName: item.productName,
          brand: item.product?.brand?.name,
          category: item.product?.category?.name,
          totalQuantity: 0,
          totalRevenue: 0,
          totalProfit: 0,
        });
      }
      const entry = productMap.get(productId);
      entry.totalQuantity += item.quantity;
      entry.totalRevenue += Number(item.totalPrice);
      entry.totalProfit += Number(item.totalPrice) - Number(item.totalCost);
    }

    let top = Array.from(productMap.values());
    if (sortBy === "quantity") top.sort((a, b) => b.totalQuantity - a.totalQuantity);
    else if (sortBy === "revenue") top.sort((a, b) => b.totalRevenue - a.totalRevenue);
    else top.sort((a, b) => b.totalProfit - a.totalProfit);
    return top.slice(0, limit);
  }

  /**
   * Dashboard summary (cards)
   */
  async getDashboardSummary() {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startWeek = new Date(now.getTime() - 7 * 86400000);
    const startMonth = new Date(now.getTime() - 30 * 86400000);

    const totals = await db.Sale.findAll({
      where: { createdAt: { [Op.gte]: startToday } },
      attributes: [
        [Sequelize.fn("SUM", Sequelize.col("totalAmount")), "revenueToday"],
        [Sequelize.fn("SUM", Sequelize.col("profit")), "profitToday"],
      ],
      raw: true,
    });
    const revenueToday = Number(totals[0]?.revenueToday || 0);
    const profitToday = Number(totals[0]?.profitToday || 0);

    const weekStats = await db.Sale.findAll({
      where: { createdAt: { [Op.gte]: startWeek } },
      attributes: [[Sequelize.fn("SUM", Sequelize.col("totalAmount")), "revenueWeek"]],
      raw: true,
    });
    const revenueWeek = Number(weekStats[0]?.revenueWeek || 0);

    const monthStats = await db.Sale.findAll({
      where: { createdAt: { [Op.gte]: startMonth } },
      attributes: [[Sequelize.fn("SUM", Sequelize.col("totalAmount")), "revenueMonth"]],
      raw: true,
    });
    const revenueMonth = Number(monthStats[0]?.revenueMonth || 0);

    const totalProducts = await db.Product.count();
    const lowStock = await db.Stock.count({
      where: { [Op.or]: [{ boxQuantity: { [Op.lte]: 5 } }, { singleQuantity: { [Op.lte]: 10 } }] },
    });

    return {
      revenueToday,
      profitToday,
      revenueWeek,
      revenueMonth,
      totalProducts,
      lowStockProducts: lowStock,
    };
  }
}

export default new AnalyticsService();