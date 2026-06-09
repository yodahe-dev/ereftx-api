// graph/TradePlan.timeSeries.processor.ts
import db from '../models';
import { Op } from 'sequelize';

const { TradePlan, Trade } = db;

export class TradePlanTimeSeriesProcessor {
  /**
   * Get number of plans created vs triggered per day.
   */
  static async getPlanActivity(start: Date, end: Date): Promise<{ date: string; created: number; triggered: number; expired: number }[]> {
    const plans = await TradePlan.findAll({
      where: {
        createdAt: { [Op.between]: [start, end] },
      },
      attributes: ['createdAt', 'status'],
    });

    const dateMap = new Map<string, { created: number; triggered: number; expired: number }>();
    for (const plan of plans) {
      const dateKey = plan.createdAt.toISOString().split('T')[0];
      const entry = dateMap.get(dateKey) || { created: 0, triggered: 0, expired: 0 };
      entry.created++;
      if (plan.status === 'triggered') entry.triggered++;
      if (plan.status === 'expired') entry.expired++;
      dateMap.set(dateKey, entry);
    }

    const result = [];
    for (const [date, stats] of dateMap) {
      result.push({ date, ...stats });
    }
    return result.sort((a,b) => a.date.localeCompare(b.date));
  }

  /**
   * Get plan adherence: percentage of triggered plans that were executed with exact parameters.
   */
  static async getPlanAdherence(accountId: string): Promise<{ totalPlans: number; exactExecutions: number; adherenceRate: number }> {
    const plans = await TradePlan.findAll({
      where: { accountId, status: 'triggered' },
      attributes: ['lotSize', 'entryPrice', 'actualLotSize', 'actualEntryPrice'],
    });

    let exact = 0;
    for (const p of plans) {
      const lotMatch = p.actualLotSize === null || p.lotSize === p.actualLotSize;
      const priceMatch = p.actualEntryPrice === null || p.entryPrice === p.actualEntryPrice;
      if (lotMatch && priceMatch) exact++;
    }
    const total = plans.length;
    return {
      totalPlans: total,
      exactExecutions: exact,
      adherenceRate: total ? (exact / total) * 100 : 0,
    };
  }
}