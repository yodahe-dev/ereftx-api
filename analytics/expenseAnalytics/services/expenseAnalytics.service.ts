import { QueryTypes } from "sequelize";
import db from "../../../models";

export class ExpenseAnalyticsService {
  // ── Overview (no pending invoices) ──
  async getOverview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalSales = await db.sequelize.query(
      `SELECT COALESCE(SUM(totalAmount), 0) as total FROM sales`,
      { type: QueryTypes.SELECT }
    ).then((r: any) => parseFloat(r[0]?.total || 0));

    const totalExpenses = await db.sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses`,
      { type: QueryTypes.SELECT }
    ).then((r: any) => parseFloat(r[0]?.total || 0));

    const businessExpenses = await db.sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE referenceType != 'personal'`,
      { type: QueryTypes.SELECT }
    ).then((r: any) => parseFloat(r[0]?.total || 0));

    const personalExpenses = await db.sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE referenceType = 'personal'`,
      { type: QueryTypes.SELECT }
    ).then((r: any) => parseFloat(r[0]?.total || 0));

    const netProfit = totalSales - businessExpenses;
    const totalProfitAfterAll = totalSales - totalExpenses;

    const activePlans = await db.sequelize.query(
      `SELECT COUNT(*) as count FROM expense_plans WHERE status = 'active'`,
      { type: QueryTypes.SELECT }
    ).then((r: any) => parseInt(r[0]?.count || 0));

    const expensesThisMonth = await db.sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expenseDate >= :startOfMonth`,
      { replacements: { startOfMonth }, type: QueryTypes.SELECT }
    ).then((r: any) => parseFloat(r[0]?.total || 0));

    const revenueThisMonth = await db.sequelize.query(
      `SELECT COALESCE(SUM(totalAmount), 0) as total FROM sales WHERE createdAt >= :startOfMonth`,
      { replacements: { startOfMonth }, type: QueryTypes.SELECT }
    ).then((r: any) => parseFloat(r[0]?.total || 0));

    return {
      totalSales,
      totalExpenses,
      businessExpenses,
      personalExpenses,
      netProfit,
      totalProfitAfterAll,
      activePlans,
      expensesThisMonth,
      revenueThisMonth,
      profitThisMonth: revenueThisMonth - expensesThisMonth,
    };
  }

  // ── Monthly Trend with Period Filter ──
  async getMonthlyTrend(period: string = 'all') {
    let dateCondition = '';
    const now = new Date();
    switch (period) {
      case '7d':
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        dateCondition = `AND s.createdAt >= '${sevenDaysAgo.toISOString().slice(0, 10)}'`;
        break;
      case '30d':
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        dateCondition = `AND s.createdAt >= '${thirtyDaysAgo.toISOString().slice(0, 10)}'`;
        break;
      case '3m':
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        dateCondition = `AND s.createdAt >= '${threeMonthsAgo.toISOString().slice(0, 10)}'`;
        break;
      case '6m':
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        dateCondition = `AND s.createdAt >= '${sixMonthsAgo.toISOString().slice(0, 10)}'`;
        break;
      default:
        // 'all' – no date filter
        break;
    }

    const query = `
      SELECT
        DATE_FORMAT(s.createdAt, '%Y-%m') as month,
        COALESCE(SUM(s.totalAmount), 0) as revenue,
        COALESCE((
          SELECT SUM(e.amount)
          FROM expenses e
          WHERE DATE_FORMAT(e.expenseDate, '%Y-%m') = DATE_FORMAT(s.createdAt, '%Y-%m')
          ${dateCondition.replace('s.createdAt', 'e.expenseDate')}
        ), 0) as expenses
      FROM sales s
      WHERE 1=1 ${dateCondition}
      GROUP BY month
      ORDER BY month ASC
    `;
    const results = await db.sequelize.query(query, { type: QueryTypes.SELECT });
    return (results as any[]).map(row => ({
      month: row.month,
      revenue: parseFloat(row.revenue),
      expenses: parseFloat(row.expenses),
      netProfit: parseFloat(row.revenue) - parseFloat(row.expenses),
    }));
  }

  // ── Reference Breakdown ──
  async getReferenceBreakdown() {
    const query = `
      SELECT referenceType as name, SUM(amount) as value
      FROM expenses
      GROUP BY referenceType
    `;
    const results = await db.sequelize.query(query, { type: QueryTypes.SELECT });
    const total = (results as any[]).reduce((acc, cur) => acc + parseFloat(cur.value), 0);
    return (results as any[]).map(row => ({
      name: row.name,
      value: parseFloat(row.value),
      percentage: total > 0 ? (parseFloat(row.value) / total) * 100 : 0,
    }));
  }

  // ── Daily Trend ──
  async getDailyTrend() {
    const query = `
      SELECT DATE(expenseDate) as name, SUM(amount) as value
      FROM expenses
      GROUP BY name
      ORDER BY name ASC
    `;
    const results = await db.sequelize.query(query, { type: QueryTypes.SELECT });
    return (results as any[]).map(row => ({
      name: row.name,
      value: parseFloat(row.value),
    }));
  }

  // ── Personal Usage (all‑time) ──
  async getPersonalUsage() {
    const totalSales = await db.sequelize.query(
      `SELECT COALESCE(SUM(totalAmount), 0) as total FROM sales`,
      { type: QueryTypes.SELECT }
    ).then((r: any) => parseFloat(r[0]?.total || 0));

    const businessExpenses = await db.sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE referenceType != 'personal'`,
      { type: QueryTypes.SELECT }
    ).then((r: any) => parseFloat(r[0]?.total || 0));

    const personalExpenses = await db.sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE referenceType = 'personal'`,
      { type: QueryTypes.SELECT }
    ).then((r: any) => parseFloat(r[0]?.total || 0));

    const profit = totalSales - businessExpenses;
    const personalUsagePercent = profit > 0 ? (personalExpenses / profit) * 100 : 0;
    const status = personalUsagePercent <= 30 ? 'green' : personalUsagePercent <= 50 ? 'yellow' : 'red';

    return {
      totalSales,
      businessExpenses,
      personalExpenses,
      profit,
      personalUsagePercent: parseFloat(personalUsagePercent.toFixed(2)),
      status,
    };
  }

  // ── Profit Margin ──
  async getProfitMargin() {
    const totalSales = await db.sequelize.query(
      `SELECT COALESCE(SUM(totalAmount), 0) as total FROM sales`,
      { type: QueryTypes.SELECT }
    ).then((r: any) => parseFloat(r[0]?.total || 0));

    const totalExpenses = await db.sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses`,
      { type: QueryTypes.SELECT }
    ).then((r: any) => parseFloat(r[0]?.total || 0));

    const netProfit = totalSales - totalExpenses;
    const expenseRatio = totalSales > 0 ? (totalExpenses / totalSales) * 100 : 0;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
    const markup = totalExpenses > 0 ? ((totalSales - totalExpenses) / totalExpenses) * 100 : 0;

    return {
      totalSales,
      totalExpenses,
      netProfit,
      expenseRatio: parseFloat(expenseRatio.toFixed(2)),
      profitMargin: parseFloat(profitMargin.toFixed(2)),
      markup: parseFloat(markup.toFixed(2)),
    };
  }

  // ── Category Spending (Flat) ──
  async getCategorySpending() {
    const query = `
      SELECT
        ec.name as categoryName,
        SUM(e.amount) as total
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.categoryId = ec.id
      GROUP BY e.categoryId, ec.name
      ORDER BY total DESC
    `;
    const results = await db.sequelize.query(query, { type: QueryTypes.SELECT });
    return (results as any[]).map(row => ({
      categoryName: row.categoryName || 'Uncategorized',
      total: parseFloat(row.total),
    }));
  }

  // ── Category Treemap ──
  async getCategoryTreemap() {
    const categories = await db.sequelize.query(
      `SELECT id, name, parentId FROM expense_categories`,
      { type: QueryTypes.SELECT }
    ) as any[];

    const spending = await db.sequelize.query(
      `SELECT categoryId, SUM(amount) as total FROM expenses GROUP BY categoryId`,
      { type: QueryTypes.SELECT }
    ) as any[];

    const catMap: Record<string, any> = {};
    categories.forEach(cat => {
      catMap[cat.id] = { ...cat, children: [], value: 0 };
    });

    spending.forEach(s => {
      if (catMap[s.categoryId]) {
        catMap[s.categoryId].value = parseFloat(s.total);
      }
    });

    const roots: any[] = [];
    Object.values(catMap).forEach(cat => {
      if (cat.parentId && catMap[cat.parentId]) {
        catMap[cat.parentId].children.push(cat);
      } else {
        roots.push(cat);
      }
    });

    const computeSum = (node: any) => {
      node.children.forEach((child: any) => computeSum(child));
      node.value = node.children.reduce((sum: number, child: any) => sum + child.value, node.value);
    };
    roots.forEach(computeSum);

    const flatten = (nodes: any[], parentName?: string): any[] => {
      let result: any[] = [];
      nodes.forEach(node => {
        if (node.value > 0) {
          result.push({
            name: node.name,
            value: node.value,
            parent: parentName || null,
          });
        }
        result = result.concat(flatten(node.children, node.name));
      });
      return result;
    };

    return flatten(roots);
  }

  // ── Plan Expenses ──
  async getPlanExpenses() {
    const query = `
      SELECT
        ep.title as planName,
        SUM(e.amount) as total
      FROM expenses e
      LEFT JOIN expense_plans ep ON e.expensePlanId = ep.id
      WHERE e.referenceType = 'plan' OR e.expensePlanId IS NOT NULL
      GROUP BY e.expensePlanId, ep.title
      ORDER BY total DESC
    `;
    const results = await db.sequelize.query(query, { type: QueryTypes.SELECT });
    return (results as any[]).map(row => ({
      planName: row.planName || 'Unnamed Plan',
      total: parseFloat(row.total),
    }));
  }

  // ── Yearly Heatmap ──
  async getYearlyHeatmap(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const query = `
      SELECT DATE(expenseDate) as day, SUM(amount) as total
      FROM expenses
      WHERE expenseDate BETWEEN :start AND :end
      GROUP BY day
    `;
    const results = await db.sequelize.query(query, {
      replacements: { start: startDate, end: endDate },
      type: QueryTypes.SELECT,
    });

    const dayMap: Record<string, number> = {};
    (results as any[]).forEach(row => {
      dayMap[row.day] = parseFloat(row.total);
    });

    const days = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const dayStr = current.toISOString().slice(0, 10);
      days.push({
        date: dayStr,
        total: dayMap[dayStr] || 0,
        notes: [],
      });
      current.setDate(current.getDate() + 1);
    }
    return days;
  }

  // ── Daily Profit & Margin (FIXED) ──
  async getDailyProfitMargin() {
    const query = `
      SELECT
        COALESCE(s.day, e.day) as day,
        COALESCE(s.revenue, 0) as revenue,
        COALESCE(e.expenses, 0) as expenses,
        COALESCE(s.revenue, 0) - COALESCE(e.expenses, 0) as netProfit,
        CASE
          WHEN COALESCE(s.revenue, 0) > 0
          THEN ((COALESCE(s.revenue, 0) - COALESCE(e.expenses, 0)) / COALESCE(s.revenue, 0)) * 100
          ELSE 0
        END as marginPercent
      FROM (
        SELECT DATE(createdAt) as day, SUM(totalAmount) as revenue
        FROM sales
        GROUP BY day
      ) s
      RIGHT JOIN (
        SELECT DATE(expenseDate) as day, SUM(amount) as expenses
        FROM expenses
        GROUP BY day
      ) e ON s.day = e.day
      ORDER BY day ASC
    `;
    const results = await db.sequelize.query(query, { type: QueryTypes.SELECT });
    return (results as any[]).map(row => ({
      name: row.day,
      revenue: parseFloat(row.revenue),
      expenses: parseFloat(row.expenses),
      netProfit: parseFloat(row.netProfit),
      marginPercent: parseFloat(row.marginPercent || 0), // ← FIX: parse to float
    }));
  }

  // ── Available Years ──
  async getAvailableYears() {
    const query = `
      SELECT DISTINCT YEAR(expenseDate) as year FROM expenses
      UNION
      SELECT DISTINCT YEAR(createdAt) as year FROM sales
      ORDER BY year DESC
    `;
    const results = await db.sequelize.query(query, { type: QueryTypes.SELECT });
    return (results as any[]).map(row => parseInt(row.year));
  }
}