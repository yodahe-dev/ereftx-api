import { QueryTypes } from "sequelize";
import db from "../../../models";

export class ExpenseAnalyticsService {
  // ── Overview ──
  async getOverview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total profit from sale_items
    const totalSalesProfit = await db.sequelize.query(
      `SELECT COALESCE(SUM(si.totalPrice - si.totalCost), 0) as total
       FROM sale_items si
       INNER JOIN sales s ON si.saleId = s.id`,
      { type: QueryTypes.SELECT }
    ).then((r: any) => parseFloat(r[0]?.total || 0));

    // Total business expenses (referenceType != 'personal')
    const businessExpenses = await db.sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE referenceType != 'personal'`,
      { type: QueryTypes.SELECT }
    ).then((r: any) => parseFloat(r[0]?.total || 0));

    // Personal expenses
    const personalExpenses = await db.sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE referenceType = 'personal'`,
      { type: QueryTypes.SELECT }
    ).then((r: any) => parseFloat(r[0]?.total || 0));

    const totalExpenses = businessExpenses + personalExpenses;
    const netProfit = totalSalesProfit - businessExpenses; // profit after business expenses
    const totalProfitAfterAll = totalSalesProfit - totalExpenses; // profit after all expenses

    const activePlans = await db.sequelize.query(
      `SELECT COUNT(*) as count FROM expense_plans WHERE status = 'active'`,
      { type: QueryTypes.SELECT }
    ).then((r: any) => parseInt(r[0]?.count || 0));

    const expensesThisMonth = await db.sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE expenseDate >= :startOfMonth`,
      { replacements: { startOfMonth }, type: QueryTypes.SELECT }
    ).then((r: any) => parseFloat(r[0]?.total || 0));

    return {
      totalSalesProfit,
      totalExpenses,
      businessExpenses,
      personalExpenses,
      netProfit,
      totalProfitAfterAll,
      activePlans,
      expensesThisMonth,
    };
  }

  // ── Monthly Trend ──
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
        break;
    }

    // Profit from sale_items per month
    const profitQuery = `
      SELECT
        DATE_FORMAT(s.createdAt, '%Y-%m') as month,
        COALESCE(SUM(si.totalPrice - si.totalCost), 0) as profit
      FROM sales s
      INNER JOIN sale_items si ON s.id = si.saleId
      WHERE 1=1 ${dateCondition}
      GROUP BY month
    `;
    const profitResults = await db.sequelize.query(profitQuery, { type: QueryTypes.SELECT });

    // Expenses per month
    const expenseQuery = `
      SELECT
        DATE_FORMAT(e.expenseDate, '%Y-%m') as month,
        COALESCE(SUM(e.amount), 0) as expenses
      FROM expenses e
      WHERE 1=1 ${dateCondition.replace('s.createdAt', 'e.expenseDate')}
      GROUP BY month
    `;
    const expenseResults = await db.sequelize.query(expenseQuery, { type: QueryTypes.SELECT });

    // Merge by month
    const monthMap: Record<string, any> = {};
    (profitResults as any[]).forEach((row) => {
      monthMap[row.month] = { month: row.month, profit: parseFloat(row.profit), expenses: 0 };
    });
    (expenseResults as any[]).forEach((row) => {
      if (monthMap[row.month]) {
        monthMap[row.month].expenses = parseFloat(row.expenses);
      } else {
        monthMap[row.month] = { month: row.month, profit: 0, expenses: parseFloat(row.expenses) };
      }
    });

    return Object.values(monthMap).map((item) => ({
      month: item.month,
      profit: item.profit,
      expenses: item.expenses,
      netProfit: item.profit - item.expenses,
    }));
  }

  // ── Daily Profit & Margin (uses sale_items) ──
  async getDailyProfitMargin() {
    // Profit per day from sale_items
    const profitQuery = `
      SELECT
        DATE(s.createdAt) as day,
        COALESCE(SUM(si.totalPrice - si.totalCost), 0) as profit
      FROM sales s
      INNER JOIN sale_items si ON s.id = si.saleId
      GROUP BY day
    `;
    const profitResults = await db.sequelize.query(profitQuery, { type: QueryTypes.SELECT });

    // Expenses per day (total and personal)
    const expenseQuery = `
      SELECT
        DATE(e.expenseDate) as day,
        SUM(e.amount) as totalExpenses,
        SUM(CASE WHEN e.referenceType = 'personal' THEN e.amount ELSE 0 END) as personalExpenses
      FROM expenses e
      GROUP BY day
    `;
    const expenseResults = await db.sequelize.query(expenseQuery, { type: QueryTypes.SELECT });

    // Merge by day
    const dayMap: Record<string, any> = {};
    (profitResults as any[]).forEach((row) => {
      dayMap[row.day] = {
        day: row.day,
        profit: parseFloat(row.profit),
        totalExpenses: 0,
        personalExpenses: 0,
      };
    });
    (expenseResults as any[]).forEach((row) => {
      if (dayMap[row.day]) {
        dayMap[row.day].totalExpenses = parseFloat(row.totalExpenses);
        dayMap[row.day].personalExpenses = parseFloat(row.personalExpenses);
      } else {
        dayMap[row.day] = {
          day: row.day,
          profit: 0,
          totalExpenses: parseFloat(row.totalExpenses),
          personalExpenses: parseFloat(row.personalExpenses),
        };
      }
    });

    return Object.values(dayMap).map((item) => ({
      name: item.day,
      expenses: item.totalExpenses,
      netProfit: item.profit - item.totalExpenses,
      personalExpenses: item.personalExpenses,
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

  // ── Daily Trend (expenses only) ──
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
    const totalSalesProfit = await db.sequelize.query(
      `SELECT COALESCE(SUM(si.totalPrice - si.totalCost), 0) as total
       FROM sale_items si
       INNER JOIN sales s ON si.saleId = s.id`,
      { type: QueryTypes.SELECT }
    ).then((r: any) => parseFloat(r[0]?.total || 0));

    const businessExpenses = await db.sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE referenceType != 'personal'`,
      { type: QueryTypes.SELECT }
    ).then((r: any) => parseFloat(r[0]?.total || 0));

    const personalExpenses = await db.sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE referenceType = 'personal'`,
      { type: QueryTypes.SELECT }
    ).then((r: any) => parseFloat(r[0]?.total || 0));

    const profit = totalSalesProfit - businessExpenses;
    const personalUsagePercent = profit > 0 ? (personalExpenses / profit) * 100 : 0;
    const status = personalUsagePercent <= 30 ? 'green' : personalUsagePercent <= 50 ? 'yellow' : 'red';

    return {
      totalSalesProfit,
      businessExpenses,
      personalExpenses,
      profit,
      personalUsagePercent: parseFloat(personalUsagePercent.toFixed(2)),
      status,
    };
  }

  // ── Profit Margin (all‑time) ──
  async getProfitMargin() {
    const totalSalesProfit = await db.sequelize.query(
      `SELECT COALESCE(SUM(si.totalPrice - si.totalCost), 0) as total
       FROM sale_items si
       INNER JOIN sales s ON si.saleId = s.id`,
      { type: QueryTypes.SELECT }
    ).then((r: any) => parseFloat(r[0]?.total || 0));

    const totalExpenses = await db.sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses`,
      { type: QueryTypes.SELECT }
    ).then((r: any) => parseFloat(r[0]?.total || 0));

    const netProfit = totalSalesProfit - totalExpenses;
    const expenseRatio = totalSalesProfit > 0 ? (totalExpenses / totalSalesProfit) * 100 : 0;
    const profitMargin = totalSalesProfit > 0 ? (netProfit / totalSalesProfit) * 100 : 0;
    const markup = totalExpenses > 0 ? ((totalSalesProfit - totalExpenses) / totalExpenses) * 100 : 0;

    return {
      totalExpenses,
      netProfit,
      expenseRatio: parseFloat(expenseRatio.toFixed(2)),
      profitMargin: parseFloat(profitMargin.toFixed(2)),
      markup: parseFloat(markup.toFixed(2)),
    };
  }

  // ── Category Spending ──
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