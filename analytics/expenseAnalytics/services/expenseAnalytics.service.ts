import { Op, fn, col, QueryTypes } from "sequelize";
import db from "../../../models";

const { Sale, Expense, ExpenseCategory, ExpensePlan } = db;

export class ExpenseAnalyticsService {
  // ── 1. Overview ──
  async getOverview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const profitAll = (await Sale.sum("profit", { where: {} })) || 0;
    const pendingInvoices = (await Sale.sum("totalAmount", {
      where: { paymentStatus: "pending" },
    })) || 0;
    const activePlans = await ExpensePlan.count({
      where: { status: "active" },
    });
    const expensesThisMonth = (await Expense.sum("amount", {
      where: { expenseDate: { [Op.gte]: startOfMonth } },
    })) || 0;
    const revenueThisMonth = (await Sale.sum("totalAmount", {
      where: { createdAt: { [Op.gte]: startOfMonth } },
    })) || 0;
    const profitThisMonth = revenueThisMonth - expensesThisMonth;

    return {
      totalProfit: profitAll,
      pendingInvoices,
      activePlans,
      expensesThisMonth,
      revenueThisMonth,
      profitThisMonth,
    };
  }

  // ── 2. Monthly Trend ──
  async getMonthlyTrend(startDate?: string, endDate?: string) {
    const whereSale: any = {};
    const whereExpense: any = {};
    if (startDate) {
      whereSale.createdAt = { [Op.gte]: new Date(startDate) };
      whereExpense.expenseDate = { [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      whereSale.createdAt = { [Op.lte]: new Date(endDate) };
      whereExpense.expenseDate = { [Op.lte]: new Date(endDate) };
    }

    const revenue = await Sale.findAll({
      attributes: [
        [fn("DATE_FORMAT", col("createdAt"), "%Y-%m"), "month"],
        [fn("SUM", col("totalAmount")), "revenue"],
      ],
      where: whereSale,
      group: [fn("DATE_FORMAT", col("createdAt"), "%Y-%m")],
      order: [[fn("DATE_FORMAT", col("createdAt"), "%Y-%m"), "ASC"]],
      raw: true,
    });

    const expenses = await Expense.findAll({
      attributes: [
        [fn("DATE_FORMAT", col("expenseDate"), "%Y-%m"), "month"],
        [fn("SUM", col("amount")), "expenses"],
      ],
      where: whereExpense,
      group: [fn("DATE_FORMAT", col("expenseDate"), "%Y-%m")],
      order: [[fn("DATE_FORMAT", col("expenseDate"), "%Y-%m"), "ASC"]],
      raw: true,
    });

    const monthMap: Record<string, any> = {};
    (revenue as any[]).forEach((r) => {
      const m = r.month;
      if (!monthMap[m]) monthMap[m] = { month: m, revenue: 0, expenses: 0 };
      monthMap[m].revenue = parseFloat(r.revenue);
    });
    (expenses as any[]).forEach((e) => {
      const m = e.month;
      if (!monthMap[m]) monthMap[m] = { month: m, revenue: 0, expenses: 0 };
      monthMap[m].expenses = parseFloat(e.expenses);
    });

    return Object.values(monthMap).map((item) => ({
      month: item.month,
      revenue: item.revenue,
      totalCost: item.expenses,
      netProfit: item.revenue - item.expenses,
    }));
  }

  // ── 3. Expense Breakdown by Reference Type ──
  async getExpenseBreakdown(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate) where.expenseDate = { [Op.gte]: new Date(startDate) };
    if (endDate) where.expenseDate = { [Op.lte]: new Date(endDate) };

    const breakdown = await Expense.findAll({
      attributes: [
        [fn("DATE_FORMAT", col("expenseDate"), "%Y-%m"), "month"],
        "referenceType",
        [fn("SUM", col("amount")), "total"],
      ],
      where,
      group: [fn("DATE_FORMAT", col("expenseDate"), "%Y-%m"), "referenceType"],
      order: [[fn("DATE_FORMAT", col("expenseDate"), "%Y-%m"), "ASC"]],
      raw: true,
    });

    const months = [...new Set((breakdown as any[]).map((b) => b.month))].sort();
    const types = ["stock", "personal", "recurring", "general", "plan"];

    return months.map((month) => {
      const row: any = { month };
      types.forEach((t) => (row[t] = 0));
      (breakdown as any[]).forEach((b) => {
        if (b.month === month) {
          row[b.referenceType] = parseFloat(b.total);
        }
      });
      return row;
    });
  }

  // ── 4. Category Treemap ──
  async getCategoryTreemap(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate) where.expenseDate = { [Op.gte]: new Date(startDate) };
    if (endDate) where.expenseDate = { [Op.lte]: new Date(endDate) };

    const query = `
      SELECT 
        e.categoryId,
        ec.name as categoryName,
        ec.parentId,
        SUM(e.amount) as total
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.categoryId = ec.id
      WHERE e.expenseDate BETWEEN :start AND :end
      GROUP BY e.categoryId, ec.name, ec.parentId
    `;

    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date(9999, 11, 31);

    let results = await db.sequelize.query(query, {
      replacements: { start, end },
      type: QueryTypes.SELECT,
    });

    if (!Array.isArray(results)) {
      results = results[0] || [];
    }

    const categoryMap: Record<string, any> = {};
    const allCategories = await ExpenseCategory.findAll({ raw: true });
    allCategories.forEach((cat: any) => {
      categoryMap[cat.id] = {
        id: cat.id,
        name: cat.name,
        parentId: cat.parentId,
        value: 0,
        children: [],
      };
    });

    (results as any[]).forEach((row) => {
      const catId = row.categoryId;
      if (categoryMap[catId]) {
        categoryMap[catId].value += parseFloat(row.total);
      }
    });

    const roots: any[] = [];
    Object.values(categoryMap).forEach((cat) => {
      if (cat.parentId && categoryMap[cat.parentId]) {
        categoryMap[cat.parentId].children.push(cat);
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
      nodes.forEach((node) => {
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

  // ── 5. Budget Progress ──
  async getBudgetProgress() {
    const plans = await ExpensePlan.findAll({
      where: { status: "active" },
      attributes: ["id", "title", "targetAmount", "currentAllocatedAmount"],
      raw: true,
    });

    return plans.map((plan: any) => ({
      id: plan.id,
      title: plan.title,
      targetAmount: parseFloat(plan.targetAmount),
      currentAllocatedAmount: parseFloat(plan.currentAllocatedAmount),
      progress: (parseFloat(plan.currentAllocatedAmount) / parseFloat(plan.targetAmount)) * 100,
      status:
        parseFloat(plan.currentAllocatedAmount) >= parseFloat(plan.targetAmount)
          ? "completed"
          : "active",
    }));
  }

  // ── 6. Cash Flow ──
  async getCashFlow(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate) where.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) where.createdAt = { [Op.lte]: new Date(endDate) };

    const cashFlow = await Sale.findAll({
      attributes: [
        [fn("DATE_FORMAT", col("createdAt"), "%Y-%m"), "month"],
        "paymentStatus",
        [fn("SUM", col("totalAmount")), "total"],
      ],
      where,
      group: [fn("DATE_FORMAT", col("createdAt"), "%Y-%m"), "paymentStatus"],
      order: [[fn("DATE_FORMAT", col("createdAt"), "%Y-%m"), "ASC"]],
      raw: true,
    });

    const months = [...new Set((cashFlow as any[]).map((c) => c.month))].sort();
    return months.map((month) => {
      const row: any = { month };
      const paid = (cashFlow as any[]).find(
        (c) => c.month === month && c.paymentStatus === "paid"
      );
      const pending = (cashFlow as any[]).find(
        (c) => c.month === month && c.paymentStatus === "pending"
      );
      row.paid = paid ? parseFloat(paid.total) : 0;
      row.pending = pending ? parseFloat(pending.total) : 0;
      return row;
    });
  }

  // ── 7. Payment Type Distribution ──
  async getPaymentTypeDistribution(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate) where.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) where.createdAt = { [Op.lte]: new Date(endDate) };

    const distribution = await Sale.findAll({
      attributes: [
        "paymentType",
        [fn("SUM", col("totalAmount")), "total"],
      ],
      where,
      group: ["paymentType"],
      raw: true,
    });

    return (distribution as any[]).map((d) => ({
      name: d.paymentType === "cash" ? "Cash" : "Credit",
      value: parseFloat(d.total),
    }));
  }

  // ── 8. Personal vs Business ──
  async getPersonalVsBusiness(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate) where.expenseDate = { [Op.gte]: new Date(startDate) };
    if (endDate) where.expenseDate = { [Op.lte]: new Date(endDate) };

    const personal = await Expense.findAll({
      attributes: [
        [fn("DATE_FORMAT", col("expenseDate"), "%Y-%m"), "month"],
        [fn("SUM", col("amount")), "total"],
      ],
      where: { ...where, referenceType: "personal" },
      group: [fn("DATE_FORMAT", col("expenseDate"), "%Y-%m")],
      order: [[fn("DATE_FORMAT", col("expenseDate"), "%Y-%m"), "ASC"]],
      raw: true,
    });

    const business = await Expense.findAll({
      attributes: [
        [fn("DATE_FORMAT", col("expenseDate"), "%Y-%m"), "month"],
        [fn("SUM", col("amount")), "total"],
      ],
      where: { ...where, referenceType: { [Op.ne]: "personal" } },
      group: [fn("DATE_FORMAT", col("expenseDate"), "%Y-%m")],
      order: [[fn("DATE_FORMAT", col("expenseDate"), "%Y-%m"), "ASC"]],
      raw: true,
    });

    const monthMap: Record<string, any> = {};
    (personal as any[]).forEach((p) => {
      const m = p.month;
      if (!monthMap[m]) monthMap[m] = { month: m, personal: 0, business: 0 };
      monthMap[m].personal = parseFloat(p.total);
    });
    (business as any[]).forEach((b) => {
      const m = b.month;
      if (!monthMap[m]) monthMap[m] = { month: m, personal: 0, business: 0 };
      monthMap[m].business = parseFloat(b.total);
    });

    return Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
  }

  // ── 9. Burn Rate ──
  async getBurnRate(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate) where.expenseDate = { [Op.gte]: new Date(startDate) };
    if (endDate) where.expenseDate = { [Op.lte]: new Date(endDate) };

    const fixed = await Expense.findAll({
      attributes: [
        [fn("DATE_FORMAT", col("expenseDate"), "%Y-%m"), "month"],
        [fn("SUM", col("amount")), "total"],
      ],
      where: { ...where, referenceType: "recurring" },
      group: [fn("DATE_FORMAT", col("expenseDate"), "%Y-%m")],
      order: [[fn("DATE_FORMAT", col("expenseDate"), "%Y-%m"), "ASC"]],
      raw: true,
    });

    const variable = await Expense.findAll({
      attributes: [
        [fn("DATE_FORMAT", col("expenseDate"), "%Y-%m"), "month"],
        [fn("SUM", col("amount")), "total"],
      ],
      where: { ...where, referenceType: { [Op.in]: ["general", "stock"] } },
      group: [fn("DATE_FORMAT", col("expenseDate"), "%Y-%m")],
      order: [[fn("DATE_FORMAT", col("expenseDate"), "%Y-%m"), "ASC"]],
      raw: true,
    });

    const monthMap: Record<string, any> = {};
    (fixed as any[]).forEach((f) => {
      const m = f.month;
      if (!monthMap[m]) monthMap[m] = { month: m, fixed: 0, variable: 0 };
      monthMap[m].fixed = parseFloat(f.total);
    });
    (variable as any[]).forEach((v) => {
      const m = v.month;
      if (!monthMap[m]) monthMap[m] = { month: m, fixed: 0, variable: 0 };
      monthMap[m].variable = parseFloat(v.total);
    });

    return Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
  }

  // ── 10. Runway ──
  async getRunway() {
    const totalRevenue = (await Sale.sum("totalAmount", {
      where: { paymentStatus: "paid" },
    })) || 0;
    const totalExpenses = (await Expense.sum("amount", {})) || 0;
    const currentBalance = totalRevenue - totalExpenses;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recurringExpenses = await Expense.findAll({
      attributes: [
        [fn("DATE_FORMAT", col("expenseDate"), "%Y-%m"), "month"],
        [fn("SUM", col("amount")), "total"],
      ],
      where: {
        referenceType: "recurring",
        expenseDate: { [Op.gte]: sixMonthsAgo },
      },
      group: [fn("DATE_FORMAT", col("expenseDate"), "%Y-%m")],
      raw: true,
    });

    const avgMonthlyRecurring =
      (recurringExpenses as any[]).reduce(
        (acc, cur) => acc + parseFloat(cur.total),
        0
      ) / (recurringExpenses.length || 1);

    const projection = [];
    let balance = currentBalance;
    for (let i = 0; i < 3; i++) {
      balance -= avgMonthlyRecurring;
      projection.push({
        month: new Date(
          new Date().setMonth(new Date().getMonth() + i + 1)
        ).toISOString().slice(0, 7),
        projectedBalance: Math.max(balance, 0),
      });
    }

    return {
      currentBalance,
      avgMonthlyRecurring,
      projection,
      monthsOfRunway: Math.floor(currentBalance / (avgMonthlyRecurring || 1)),
    };
  }

  // ── 11. Monthly Heatmap ──
  async getHeatmap(year?: number, month?: number) {
    const targetYear = year || new Date().getFullYear();
    const targetMonth = month !== undefined ? month : new Date().getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    const expenses = await Expense.findAll({
      attributes: [
        [fn("DATE", col("expenseDate")), "day"],
        [fn("SUM", col("amount")), "total"],
      ],
      where: {
        expenseDate: { [Op.between]: [startDate, endDate] },
      },
      group: [fn("DATE", col("expenseDate"))],
      raw: true,
    });

    const dayMap: Record<string, number> = {};
    (expenses as any[]).forEach((exp) => {
      const dayStr = exp.day;
      dayMap[dayStr] = parseFloat(exp.total);
    });

    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const result = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(targetYear, targetMonth - 1, d);
      const dayStr = dateObj.toISOString().slice(0, 10);
      result.push({
        date: dayStr,
        total: dayMap[dayStr] || 0,
        notes: [],
      });
    }

    return result;
  }

  // ── 12. Daily Net Profit ──
  async getDailyNetProfit(startDate?: string, endDate?: string) {
    const whereSale: any = {};
    const whereExpense: any = {};
    if (startDate) {
      whereSale.createdAt = { [Op.gte]: new Date(startDate) };
      whereExpense.expenseDate = { [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      whereSale.createdAt = { [Op.lte]: new Date(endDate) };
      whereExpense.expenseDate = { [Op.lte]: new Date(endDate) };
    }

    const revenue = await Sale.findAll({
      attributes: [
        [fn("DATE", col("createdAt")), "day"],
        [fn("SUM", col("totalAmount")), "revenue"],
      ],
      where: whereSale,
      group: [fn("DATE", col("createdAt"))],
      raw: true,
    });

    const expenses = await Expense.findAll({
      attributes: [
        [fn("DATE", col("expenseDate")), "day"],
        [fn("SUM", col("amount")), "expenses"],
      ],
      where: whereExpense,
      group: [fn("DATE", col("expenseDate"))],
      raw: true,
    });

    const dayMap: Record<string, any> = {};
    (revenue as any[]).forEach((r) => {
      const d = r.day;
      if (!dayMap[d]) dayMap[d] = { day: d, revenue: 0, expenses: 0 };
      dayMap[d].revenue = parseFloat(r.revenue);
    });
    (expenses as any[]).forEach((e) => {
      const d = e.day;
      if (!dayMap[d]) dayMap[d] = { day: d, revenue: 0, expenses: 0 };
      dayMap[d].expenses = parseFloat(e.expenses);
    });

    return Object.values(dayMap)
      .map((item) => ({
        day: item.day,
        revenue: item.revenue,
        expenses: item.expenses,
        netProfit: item.revenue - item.expenses,
      }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }

  // ── 13. Cumulative Profit ──
  async getCumulativeProfit(startDate?: string, endDate?: string) {
    const daily = await this.getDailyNetProfit(startDate, endDate);
    let running = 0;
    return daily.map((d) => {
      running += d.netProfit;
      return { day: d.day, cumulativeProfit: running };
    });
  }

  // ── 14. Weekly Aggregates ──
  async getWeeklyAggregates(startDate?: string, endDate?: string) {
    const whereSale: any = {};
    const whereExpense: any = {};
    if (startDate) {
      whereSale.createdAt = { [Op.gte]: new Date(startDate) };
      whereExpense.expenseDate = { [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      whereSale.createdAt = { [Op.lte]: new Date(endDate) };
      whereExpense.expenseDate = { [Op.lte]: new Date(endDate) };
    }

    const revenue = await Sale.findAll({
      attributes: [
        [fn("YEARWEEK", col("createdAt"), 1), "week"],
        [fn("SUM", col("totalAmount")), "revenue"],
      ],
      where: whereSale,
      group: [fn("YEARWEEK", col("createdAt"), 1)],
      raw: true,
    });

    const expenses = await Expense.findAll({
      attributes: [
        [fn("YEARWEEK", col("expenseDate"), 1), "week"],
        [fn("SUM", col("amount")), "expenses"],
      ],
      where: whereExpense,
      group: [fn("YEARWEEK", col("expenseDate"), 1)],
      raw: true,
    });

    const weekMap: Record<string, any> = {};
    (revenue as any[]).forEach((r) => {
      const w = r.week;
      if (!weekMap[w]) weekMap[w] = { week: w, revenue: 0, expenses: 0 };
      weekMap[w].revenue = parseFloat(r.revenue);
    });
    (expenses as any[]).forEach((e) => {
      const w = e.week;
      if (!weekMap[w]) weekMap[w] = { week: w, revenue: 0, expenses: 0 };
      weekMap[w].expenses = parseFloat(e.expenses);
    });

    return Object.values(weekMap)
      .map((item) => {
        const netProfit = item.revenue - item.expenses;
        const expenseRatio = item.revenue > 0 ? (item.expenses / item.revenue) * 100 : 0;
        return {
          week: String(item.week),
          revenue: item.revenue,
          expenses: item.expenses,
          netProfit,
          expenseRatio: parseFloat(expenseRatio.toFixed(2)),
        };
      })
      .sort((a, b) => a.week.localeCompare(b.week));
  }

  // ── 15. Category Spending ──
  async getCategorySpending(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate) where.expenseDate = { [Op.gte]: new Date(startDate) };
    if (endDate) where.expenseDate = { [Op.lte]: new Date(endDate) };

    const spending = await Expense.findAll({
      attributes: [
        "categoryId",
        [fn("SUM", col("amount")), "total"],
      ],
      where,
      group: ["categoryId"],
      raw: true,
    });

    const categoryIds = (spending as any[]).map((s) => s.categoryId).filter(Boolean);
    const categories = await ExpenseCategory.findAll({
      where: { id: { [Op.in]: categoryIds } },
      attributes: ["id", "name", "parentId"],
      raw: true,
    });
    const catMap: Record<string, any> = {};
    categories.forEach((cat: any) => {
      catMap[cat.id] = cat;
    });

    return (spending as any[]).map((s) => ({
      categoryId: s.categoryId,
      categoryName: catMap[s.categoryId]?.name || "Uncategorized",
      parentId: catMap[s.categoryId]?.parentId || null,
      total: parseFloat(s.total),
    }));
  }

  // ── 16. Reference Type Summary ──
  async getReferenceTypeSummary(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate) where.expenseDate = { [Op.gte]: new Date(startDate) };
    if (endDate) where.expenseDate = { [Op.lte]: new Date(endDate) };

    const summary = await Expense.findAll({
      attributes: [
        "referenceType",
        [fn("SUM", col("amount")), "total"],
      ],
      where,
      group: ["referenceType"],
      raw: true,
    });

    return (summary as any[]).map((s) => ({
      referenceType: s.referenceType,
      total: parseFloat(s.total),
    }));
  }

  // ── 17. Yearly Heatmap ──
  async getYearlyHeatmap(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const expenses = await Expense.findAll({
      attributes: [
        [fn("DATE", col("expenseDate")), "day"],
        [fn("SUM", col("amount")), "total"],
      ],
      where: {
        expenseDate: { [Op.between]: [startDate, endDate] },
      },
      group: [fn("DATE", col("expenseDate"))],
      raw: true,
    });

    const dayMap: Record<string, number> = {};
    (expenses as any[]).forEach((exp) => {
      const dayStr = exp.day;
      dayMap[dayStr] = parseFloat(exp.total);
    });

    const result = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayStr = currentDate.toISOString().slice(0, 10);
      result.push({
        date: dayStr,
        total: dayMap[dayStr] || 0,
        notes: [],
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  // ── 18. Profit Margin ──
  async getProfitMargin() {
    const totalRevenue = (await Sale.sum("totalAmount")) || 0;
    const totalExpenses = (await Expense.sum("amount")) || 0;
    const netProfit = totalRevenue - totalExpenses;
    const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      expenseRatio: parseFloat(expenseRatio.toFixed(2)),
      profitMargin: parseFloat(profitMargin.toFixed(2)),
    };
  }

  // ── 19. Personal Usage Summary (monthly) ──
  async getPersonalUsageSummary(startDate?: string, endDate?: string) {
    // Revenue per month
    const revenueWhere: any = {};
    if (startDate) revenueWhere.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) revenueWhere.createdAt = { [Op.lte]: new Date(endDate) };

    const revenue = await Sale.findAll({
      attributes: [
        [fn("DATE_FORMAT", col("createdAt"), "%Y-%m"), "month"],
        [fn("SUM", col("totalAmount")), "revenue"],
      ],
      where: revenueWhere,
      group: [fn("DATE_FORMAT", col("createdAt"), "%Y-%m")],
      order: [[fn("DATE_FORMAT", col("createdAt"), "%Y-%m"), "ASC"]],
      raw: true,
    });

    // Expenses: business (all except personal) and personal separately
    const expenseWhere: any = {};
    if (startDate) expenseWhere.expenseDate = { [Op.gte]: new Date(startDate) };
    if (endDate) expenseWhere.expenseDate = { [Op.lte]: new Date(endDate) };

    // Business expenses (referenceType != 'personal')
    const businessExpenses = await Expense.findAll({
      attributes: [
        [fn("DATE_FORMAT", col("expenseDate"), "%Y-%m"), "month"],
        [fn("SUM", col("amount")), "businessExpenses"],
      ],
      where: { ...expenseWhere, referenceType: { [Op.ne]: "personal" } },
      group: [fn("DATE_FORMAT", col("expenseDate"), "%Y-%m")],
      order: [[fn("DATE_FORMAT", col("expenseDate"), "%Y-%m"), "ASC"]],
      raw: true,
    });

    // Personal expenses (referenceType = 'personal')
    const personalExpenses = await Expense.findAll({
      attributes: [
        [fn("DATE_FORMAT", col("expenseDate"), "%Y-%m"), "month"],
        [fn("SUM", col("amount")), "personalExpenses"],
      ],
      where: { ...expenseWhere, referenceType: "personal" },
      group: [fn("DATE_FORMAT", col("expenseDate"), "%Y-%m")],
      order: [[fn("DATE_FORMAT", col("expenseDate"), "%Y-%m"), "ASC"]],
      raw: true,
    });

    // Merge by month
    const monthMap: Record<string, any> = {};
    (revenue as any[]).forEach((r) => {
      const m = r.month;
      if (!monthMap[m]) monthMap[m] = { month: m, revenue: 0, businessExpenses: 0, personalExpenses: 0 };
      monthMap[m].revenue = parseFloat(r.revenue);
    });
    (businessExpenses as any[]).forEach((b) => {
      const m = b.month;
      if (!monthMap[m]) monthMap[m] = { month: m, revenue: 0, businessExpenses: 0, personalExpenses: 0 };
      monthMap[m].businessExpenses = parseFloat(b.businessExpenses);
    });
    (personalExpenses as any[]).forEach((p) => {
      const m = p.month;
      if (!monthMap[m]) monthMap[m] = { month: m, revenue: 0, businessExpenses: 0, personalExpenses: 0 };
      monthMap[m].personalExpenses = parseFloat(p.personalExpenses);
    });

    // Compute profit and percentage
    const result = Object.values(monthMap).map((item) => {
      const profit = item.revenue - item.businessExpenses;
      const personalUsagePercent = profit > 0 ? (item.personalExpenses / profit) * 100 : 0;
      let status: 'green' | 'yellow' | 'red';
      if (personalUsagePercent <= 30) status = 'green';
      else if (personalUsagePercent <= 50) status = 'yellow';
      else status = 'red';

      return {
        month: item.month,
        revenue: item.revenue,
        businessExpenses: item.businessExpenses,
        personalExpenses: item.personalExpenses,
        profit,
        personalUsagePercent: parseFloat(personalUsagePercent.toFixed(2)),
        status,
      };
    });

    return result;
  }

  // ── 20. Personal Usage Total (all-time) ──
  async getPersonalUsageTotal(startDate?: string, endDate?: string) {
    const revenueWhere: any = {};
    const expenseWhere: any = {};
    if (startDate) {
      revenueWhere.createdAt = { [Op.gte]: new Date(startDate) };
      expenseWhere.expenseDate = { [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      revenueWhere.createdAt = { [Op.lte]: new Date(endDate) };
      expenseWhere.expenseDate = { [Op.lte]: new Date(endDate) };
    }

    const totalRevenue = (await Sale.sum("totalAmount", { where: revenueWhere })) || 0;
    const businessExpenses = (await Expense.sum("amount", {
      where: { ...expenseWhere, referenceType: { [Op.ne]: "personal" } },
    })) || 0;
    const personalExpenses = (await Expense.sum("amount", {
      where: { ...expenseWhere, referenceType: "personal" },
    })) || 0;

    const profit = totalRevenue - businessExpenses;
    const personalUsagePercent = profit > 0 ? (personalExpenses / profit) * 100 : 0;
    let status: 'green' | 'yellow' | 'red';
    if (personalUsagePercent <= 30) status = 'green';
    else if (personalUsagePercent <= 50) status = 'yellow';
    else status = 'red';

    return {
      totalRevenue,
      businessExpenses,
      personalExpenses,
      profit,
      personalUsagePercent: parseFloat(personalUsagePercent.toFixed(2)),
      status,
    };
  }
}